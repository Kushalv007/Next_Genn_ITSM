import {
  PrismaClient,
  Role,
  IncidentStatus,
  IncidentPriority,
  RequestStatus,
  AssetStatus,
  ProblemStatus,
  ChangeRisk,
  ChangeStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const saltRounds = 12;

  const adminPassword = await bcrypt.hash('admin123', saltRounds);
  const techPassword = await bcrypt.hash('tech123', saltRounds);
  const userPassword = await bcrypt.hash('user123', saltRounds);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@itsm.com' },
    update: { password: adminPassword },
    create: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@itsm.com',
      password: adminPassword,
      role: Role.Admin,
    },
  });

  const tech = await prisma.user.upsert({
    where: { email: 'tech@itsm.com' },
    update: { password: techPassword },
    create: {
      firstName: 'Tech',
      lastName: 'User',
      email: 'tech@itsm.com',
      password: techPassword,
      role: Role.Technician,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@itsm.com' },
    update: { password: userPassword },
    create: {
      firstName: 'End',
      lastName: 'User',
      email: 'user@itsm.com',
      password: userPassword,
      role: Role.User,
    },
  });

  const hclAdminPass = await bcrypt.hash('Admin@1234', saltRounds);
  const hclAgentPass = await bcrypt.hash('Agent@1234', saltRounds);
  const hclUserPass = await bcrypt.hash('User@1234', saltRounds);

  await prisma.user.upsert({
    where: { email: 'admin@hcl.com' },
    update: { password: hclAdminPass },
    create: {
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@hcl.com',
      password: hclAdminPass,
      role: Role.Admin,
    },
  });

  await prisma.user.upsert({
    where: { email: 'agent@hcl.com' },
    update: { password: hclAgentPass },
    create: {
      firstName: 'Service',
      lastName: 'Agent',
      email: 'agent@hcl.com',
      password: hclAgentPass,
      role: Role.Technician,
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@hcl.com' },
    update: { password: hclUserPass },
    create: {
      firstName: 'HCL',
      lastName: 'Employee',
      email: 'user@hcl.com',
      password: hclUserPass,
      role: Role.User,
    },
  });

  // Seed Service Catalog Items
  const catalogItems = [
    {
      name: 'New Laptop',
      category: 'Hardware',
      description: 'Request a standard developer workstation or high-performance corporate laptop.',
      icon: 'Laptop',
    },
    {
      name: 'VPN Access',
      category: 'Access',
      description: 'Request secure remote VPN tunnel credentials for working off-site.',
      icon: 'Shield',
    },
    {
      name: 'Software Installation',
      category: 'Software',
      description: 'Request approved enterprise productivity tools, IDEs, or design software.',
      icon: 'Download',
    },
    {
      name: 'Application Access',
      category: 'Access',
      description: 'Request access permissions for Jira, Confluence, ERP, or internal databases.',
      icon: 'Key',
    },
    {
      name: 'Password Reset',
      category: 'Access',
      description: 'Submit an identity-verified credential reset request for corporate SSO.',
      icon: 'Lock',
    },
    {
      name: 'Network Port Activation',
      category: 'Network',
      description: 'Request activation and VLAN assignment for desk Ethernet wall ports.',
      icon: 'Wifi',
    },
  ];

  for (const item of catalogItems) {
    const existing = await prisma.serviceCatalogItem.findFirst({
      where: { name: item.name },
    });
    if (!existing) {
      await prisma.serviceCatalogItem.create({ data: item });
    }
  }

  // Seed sample incidents
  const inc1 = await prisma.incident.upsert({
    where: { ticketNumber: 'INC000001' },
    update: {},
    create: {
      ticketNumber: 'INC000001',
      shortDescription: 'VPN connection dropping repeatedly',
      description: 'Unable to maintain a stable VPN tunnel when connected from home network. Disconnects every 15 minutes.',
      category: 'Network',
      priority: IncidentPriority.HIGH,
      status: IncidentStatus.IN_PROGRESS,
      requesterId: user.id,
      assignedToId: tech.id,
    },
  });

  const commentCount = await prisma.incidentComment.count({
    where: { incidentId: inc1.id },
  });
  if (commentCount === 0) {
    await prisma.incidentComment.create({
      data: {
        incidentId: inc1.id,
        userId: tech.id,
        content: 'Investigating network logs on edge gateway. MTU size mismatch detected.',
      },
    });
  }

  await prisma.incident.upsert({
    where: { ticketNumber: 'INC000002' },
    update: {},
    create: {
      ticketNumber: 'INC000002',
      shortDescription: 'Outlook client crashes on startup',
      description: 'Microsoft Outlook 365 crashes with error code 0xc0000005 immediately when opened after latest Windows update.',
      category: 'Software',
      priority: IncidentPriority.MEDIUM,
      status: IncidentStatus.NEW,
      requesterId: user.id,
    },
  });

  // Seed sample service request
  const laptopItem = await prisma.serviceCatalogItem.findFirst({
    where: { name: 'New Laptop' },
  });

  if (laptopItem) {
    await prisma.serviceRequest.upsert({
      where: { requestNumber: 'REQ000001' },
      update: {},
      create: {
        requestNumber: 'REQ000001',
        serviceCatalogItemId: laptopItem.id,
        requesterId: user.id,
        description: 'Developer Macbook Pro M3 32GB RAM request for new project kickoff.',
        status: RequestStatus.SUBMITTED,
      },
    });
  }

  // Seed initial Knowledge Articles
  const articles = [
    {
      title: 'How to Connect to Corporate VPN',
      category: 'Access',
      content: `## Connecting to Corporate VPN

To connect securely to corporate network resources:
1. Open Cisco AnyConnect or GlobalProtect on your laptop.
2. Enter server portal: \`vpn.corp.itsm.com\`
3. Authenticate using your corporate email and SSO MFA push.
4. If connection drops, verify your Wi-Fi MTU is set to 1420 or disable local IPv6.`,
      status: 'PUBLISHED' as const,
      authorId: tech.id,
    },
    {
      title: 'Setting up Microsoft Outlook on Windows 11',
      category: 'Software',
      content: `## Outlook Configuration Guide

If Outlook fails to start or crashes on startup:
1. Press \`Win + R\` and run \`outlook.exe /safe\`
2. Navigate to **File > Options > Add-ins** and disable third-party COM add-ins.
3. If corruption persists, go to Control Panel > Mail > Show Profiles and create a clean profile.`,
      status: 'PUBLISHED' as const,
      authorId: tech.id,
    },
    {
      title: 'Troubleshooting Office Printer Offline Issues',
      category: 'Hardware',
      content: `## Printer Offline Remediation

1. Verify printer IP is reachable: \`ping 10.20.4.15\`
2. Restart the Windows Print Spooler: \`net stop spooler && net start spooler\`
3. Clear \`C:\\Windows\\System32\\spool\\PRINTERS\` queue folder.
4. Power cycle the physical printer and wait 60 seconds for DHCP renewal.`,
      status: 'PUBLISHED' as const,
      authorId: tech.id,
    },
  ];

    for (const art of articles) {
    const existing = await prisma.knowledgeArticle.findFirst({
      where: { title: art.title },
    });
    if (!existing) {
      await prisma.knowledgeArticle.create({ data: art });
    }
  }

  // Seed initial Assets
  const laptopAsset = await prisma.asset.upsert({
    where: { assetTag: 'AST000001' },
    update: {},
    create: {
      assetTag: 'AST000001',
      name: 'MacBook Pro 16" M3 Max',
      type: 'Laptop',
      model: 'Apple A2991',
      serialNumber: 'C02G841NMD6R',
      status: AssetStatus.ASSIGNED,
      assignedToId: user.id,
      locationId: 'Building A, Floor 3',
    },
  });

  await prisma.asset.upsert({
    where: { assetTag: 'AST000002' },
    update: {},
    create: {
      assetTag: 'AST000002',
      name: 'Dell Precision 3660 Tower',
      type: 'Desktop',
      model: 'Precision 3660',
      serialNumber: '8H2K9Q3',
      status: AssetStatus.AVAILABLE,
      locationId: 'Building B, Lab 102',
    },
  });

  await prisma.asset.upsert({
    where: { assetTag: 'AST000003' },
    update: {},
    create: {
      assetTag: 'AST000003',
      name: 'Core Edge Switch Cisco Catalyst 9300',
      type: 'Network Device',
      model: 'C9300-48P',
      serialNumber: 'FCW2348A021',
      status: AssetStatus.AVAILABLE,
      locationId: 'Data Center Rack 4',
    },
  });

  // Seed initial Problem
  const existingProb = await prisma.problem.findFirst({
    where: { problemNumber: 'PRB000001' },
  });
  if (!existingProb) {
    await prisma.problem.create({
      data: {
        problemNumber: 'PRB000001',
        title: 'Intermittent VPN Gateway Session Terminations',
        description: 'Multiple users across remote sites reporting sudden SSL tunnel disconnects every 45 minutes.',
        status: ProblemStatus.INVESTIGATING,
        rootCause: 'Memory leak in VPN appliance firmware v12.4 causing packet buffer exhaustion.',
        workaround: 'Disable DTLS tunnel optimization and force standard TLS 1.3 fallback.',
        ownerId: tech.id,
      },
    });
  }

  // Seed initial Change
  const existingChange = await prisma.change.findFirst({
    where: { changeNumber: 'CHG000001' },
  });
  if (!existingChange) {
    await prisma.change.create({
      data: {
        changeNumber: 'CHG000001',
        title: 'Upgrade Edge Core Switch Firmware to v17.9.4a',
        description: 'Apply critical security patching and resolve memory buffer starvation on core stack.',
        risk: ChangeRisk.HIGH,
        implementationPlan: '1. Backup running config. 2. Push image to secondary boot partition. 3. Reload stack during maintenance window at 02:00 AM. 4. Verify spanning tree convergence.',
        rollbackPlan: 'Revert boot variable to previous stable image v17.6.3 and power cycle switch stack.',
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: ChangeStatus.PENDING_APPROVAL,
        ownerId: tech.id,
      },
    });
  }

  console.log('Seeding complete! Initial users, service catalog items, incidents, requests, KB articles, assets, problems, and changes are ready.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
