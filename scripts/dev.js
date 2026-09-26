const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');
const os = require('os');

const ROOT_DIR = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

let pgProcess = null;
let backendProcess = null;
let frontendProcess = null;

// Clean exit on termination
function cleanup() {
  console.log('\n🛑 Shutting down Next Gen ITSM...');
  if (backendProcess) {
    try { process.kill(backendProcess.pid); } catch (e) {}
  }
  if (frontendProcess) {
    try { process.kill(frontendProcess.pid); } catch (e) {}
  }
  if (pgProcess) {
    console.log('🛑 Stopping local database...');
    try { process.kill(pgProcess.pid); } catch (e) {}
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

function log(msg) {
  console.log(`\x1b[36m[Next Gen ITSM]\x1b[0m ${msg}`);
}

function logSuccess(msg) {
  console.log(`\x1b[32m[Next Gen ITSM] ✔ ${msg}\x1b[0m`);
}

function logWarn(msg) {
  console.log(`\x1b[33m[Next Gen ITSM] ⚠️ ${msg}\x1b[0m`);
}

function isPortReachable(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

function findPostgresBinary(binaryName) {
  // Check PATH first
  try {
    const checkCmd = process.platform === 'win32' ? `where ${binaryName}` : `which ${binaryName}`;
    const output = execSync(checkCmd, { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' }).trim();
    if (output) {
      const firstLine = output.split(/\r?\n/)[0];
      if (fs.existsSync(firstLine)) return firstLine;
    }
  } catch (e) {}

  // Check common Windows installations
  if (process.platform === 'win32') {
    const versions = ['18', '17', '16', '15', '14'];
    for (const v of versions) {
      const p = `C:\\Program Files\\PostgreSQL\\${v}\\bin\\${binaryName}.exe`;
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

async function ensureDependencies() {
  log('Checking dependencies...');

  if (!fs.existsSync(path.join(ROOT_DIR, 'node_modules'))) {
    log('Installing root dependencies...');
    execSync('npm install', { cwd: ROOT_DIR, stdio: 'inherit' });
  }

  if (!fs.existsSync(path.join(BACKEND_DIR, 'node_modules'))) {
    log('Installing backend dependencies...');
    execSync('npm install', { cwd: BACKEND_DIR, stdio: 'inherit' });
  }

  if (!fs.existsSync(path.join(FRONTEND_DIR, 'node_modules'))) {
    log('Installing frontend dependencies...');
    execSync('npm install', { cwd: FRONTEND_DIR, stdio: 'inherit' });
  }

  logSuccess('All dependencies are ready.');
}

function ensureEnvironmentFiles() {
  const backendEnv = path.join(BACKEND_DIR, '.env');
  const backendEnvEx = path.join(BACKEND_DIR, '.env.example');
  if (!fs.existsSync(backendEnv)) {
    if (fs.existsSync(backendEnvEx)) {
      fs.copyFileSync(backendEnvEx, backendEnv);
      logSuccess('Created backend/.env from .env.example');
    }
  }

  const frontendEnv = path.join(FRONTEND_DIR, '.env');
  const frontendEnvEx = path.join(FRONTEND_DIR, '.env.example');
  if (!fs.existsSync(frontendEnv)) {
    if (fs.existsSync(frontendEnvEx)) {
      fs.copyFileSync(frontendEnvEx, frontendEnv);
      logSuccess('Created frontend/.env from .env.example');
    }
  }
}

function getDatabaseConfig() {
  const backendEnv = path.join(BACKEND_DIR, '.env');
  let dbUrl = 'postgresql://postgres@localhost:5433/itsm_db?schema=public';
  if (fs.existsSync(backendEnv)) {
    const content = fs.readFileSync(backendEnv, 'utf8');
    const match = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match) dbUrl = match[1];
  }

  let port = 5433;
  let host = '127.0.0.1';
  let dbName = 'itsm_db';
  try {
    const parsed = new URL(dbUrl);
    if (parsed.port) port = parseInt(parsed.port, 10);
    if (parsed.hostname) host = parsed.hostname;
    if (parsed.pathname) dbName = parsed.pathname.replace(/^\//, '');
  } catch (e) {}

  return { dbUrl, host, port, dbName };
}

async function ensureDatabase() {
  const { dbUrl, host, port, dbName } = getDatabaseConfig();
  log(`Checking PostgreSQL connection on ${host}:${port}...`);

  const alreadyUp = await isPortReachable(port, host);
  if (alreadyUp) {
    logSuccess(`PostgreSQL is already accepting connections on port ${port}.`);
    return;
  }

  logWarn(`PostgreSQL is not responding on port ${port}. Attempting auto-start...`);

  const pgBinary = findPostgresBinary('postgres');
  const devDbPath = path.join(ROOT_DIR, 'dev-db');

  if (pgBinary) {
    // If dev-db doesn't exist, create it with initdb
    if (!fs.existsSync(devDbPath)) {
      const initdbBinary = findPostgresBinary('initdb');
      if (initdbBinary) {
        log('Initializing local database cluster in ./dev-db...');
        execSync(`"${initdbBinary}" -D "${devDbPath}" -U postgres -A trust`, { stdio: 'inherit' });
      }
    }

    if (fs.existsSync(devDbPath)) {
      // Clean up stale postmaster.pid if process is not running
      const pidFile = path.join(devDbPath, 'postmaster.pid');
      if (fs.existsSync(pidFile)) {
        try {
          const pidContent = fs.readFileSync(pidFile, 'utf8');
          const oldPid = parseInt(pidContent.split(/\r?\n/)[0], 10);
          let isRunning = false;
          try {
            process.kill(oldPid, 0);
            isRunning = true;
          } catch (e) {
            isRunning = false;
          }
          if (!isRunning) {
            fs.unlinkSync(pidFile);
            log('Cleaned up stale postmaster.pid file.');
          }
        } catch (e) {}
      }

      log(`Starting local PostgreSQL server from ${devDbPath} on port ${port}...`);
      const tmpLog = path.join(os.tmpdir(), 'nextgen_postgres.log');
      const outStream = fs.openSync(tmpLog, 'a');
      pgProcess = spawn(pgBinary, ['-D', devDbPath, '-p', port.toString()], {
        stdio: ['ignore', outStream, outStream],
        detached: true
      });
      pgProcess.unref();

      // Wait up to 15 seconds for it to start
      let isReady = false;
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        isReady = await isPortReachable(port, host);
        if (isReady) break;
      }

      if (isReady) {
        logSuccess(`Local PostgreSQL started successfully on port ${port}.`);

        // Check if database exists, create if missing
        const createdbBinary = findPostgresBinary('createdb');
        if (createdbBinary) {
          try {
            execSync(`"${createdbBinary}" -U postgres -p ${port} ${dbName}`, {
              stdio: ['ignore', 'ignore', 'ignore']
            });
            logSuccess(`Created database "${dbName}".`);
          } catch (e) {
            // Database likely already exists, ignore
          }
        }
        return;
      }
    }
  }

  // Check if Docker is available as fallback
  try {
    execSync('docker --version', { stdio: 'ignore' });
    log('Attempting to start database via Docker Compose...');
    execSync('docker compose up -d db', { cwd: ROOT_DIR, stdio: 'inherit' });
    let isReady = false;
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      isReady = await isPortReachable(port, host);
      if (isReady) break;
    }
    if (isReady) {
      logSuccess(`Docker PostgreSQL started successfully on port ${port}.`);
      return;
    }
  } catch (e) {}

  logWarn(`Could not automatically start PostgreSQL.`);
  logWarn(`Please ensure PostgreSQL is running or verify DATABASE_URL in backend/.env`);
}

async function preparePrisma() {
  log('Preparing Prisma database schema & seeding...');
  try {
    execSync('npx prisma generate', { cwd: BACKEND_DIR, stdio: 'inherit', shell: true });
    execSync('npx prisma db push --skip-generate', { cwd: BACKEND_DIR, stdio: 'inherit', shell: true });
    try {
      execSync('npm run seed', { cwd: BACKEND_DIR, stdio: 'inherit', shell: true });
    } catch (e) {
      // Seed may have already run
    }
    logSuccess('Database schema is synchronized and seeded.');
  } catch (e) {
    logWarn(`Prisma synchronization warning: ${e.message}`);
  }
}

function startServices() {
  console.log('\n\x1b[35m' + '='.repeat(60));
  console.log('   🚀 Next Gen ITSM — Enterprise IT Service Management');
  console.log('='.repeat(60) + '\x1b[0m\n');
  console.log('  🌐 Frontend UI:    \x1b[32mhttp://localhost:5173\x1b[0m');
  console.log('  ⚙️  Backend API:    \x1b[34mhttp://localhost:4000/api\x1b[0m');
  console.log('\n  🔑 Default Demo Accounts (Clickable on Login Screen):');
  console.log('     • Admin:       admin@itsm.com (Pass: admin123)');
  console.log('     • Technician:  tech@itsm.com  (Pass: tech123)');
  console.log('     • Employee:    user@itsm.com  (Pass: user123)');
  console.log('\n\x1b[35m' + '='.repeat(60) + '\x1b[0m\n');

  // Spawn backend
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  backendProcess = spawn(npmCmd, ['run', 'dev'], {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: '4000' }
  });

  // Spawn frontend
  frontendProcess = spawn(npmCmd, ['run', 'dev'], {
    cwd: FRONTEND_DIR,
    stdio: 'inherit',
    shell: true
  });

  backendProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      logWarn(`Backend process exited with code ${code}`);
    }
  });

  frontendProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      logWarn(`Frontend process exited with code ${code}`);
    }
  });
}

async function main() {
  try {
    await ensureDependencies();
    ensureEnvironmentFiles();
    await ensureDatabase();
    await preparePrisma();
    startServices();
  } catch (err) {
    console.error('Fatal startup error:', err);
    process.exit(1);
  }
}

main();
