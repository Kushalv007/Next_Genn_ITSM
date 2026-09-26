import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { config } from './config/environment';
import routes from './routes';
import { errorHandler } from './middleware/error';
import { AppError } from './utils/AppError';

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      if (config.FRONTEND_URL === '*' || config.NODE_ENV === 'production') {
        return callback(null, true);
      }
      if (origin === config.FRONTEND_URL || origin.includes('localhost')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// API Routes
app.use('/api', routes);

// Flexible route matching for hosting providers (e.g. Vercel) that may strip or omit /api
app.use((req, res, next) => {
  const apiPathRegex = /^\/(auth|incidents|service-catalog|requests|knowledge|notifications|problems|changes|health)(\/|$)/;
  if (apiPathRegex.test(req.url)) {
    return routes(req, res, next);
  }
  // Allow /assets API endpoint while letting static /assets/*.js, *.css pass through
  if (req.url.startsWith('/assets') && !req.url.match(/\.(js|css|map|png|svg|ico|jpg|webp)$/)) {
    return routes(req, res, next);
  }
  next();
});

// Production Static Frontend Hosting
const candidateFrontendPaths = [
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), '../frontend/dist'),
  path.resolve(__dirname, '../../../frontend/dist'),
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(process.cwd(), 'public'),
];

const frontendDistPath = candidateFrontendPaths.find((p) => fs.existsSync(p));

if (frontendDistPath) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next(new AppError(`Cannot ${req.method} ${req.originalUrl}`, 404));
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  app.all('*', (req, _res, next) => {
    next(new AppError(`Cannot ${req.method} ${req.originalUrl}`, 404));
  });
}

app.use(errorHandler);

if (!process.env.VERCEL) {
  app.listen(config.PORT, () => {
    console.log(`🚀 Next Gen ITSM Backend Server running on port ${config.PORT}`);
    console.log(`   Environment: ${config.NODE_ENV}`);
    console.log(`   Frontend URL: ${config.FRONTEND_URL}`);
  });
}

export default app;
