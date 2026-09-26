import bcrypt from 'bcryptjs';
import { Role, IncidentPriority, IncidentStatus, RequestStatus, ApprovalStatus, ArticleStatus, ProblemStatus, ChangeRisk, ChangeStatus, AssetStatus } from '@prisma/client';

export interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string; // bcrypt hash
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

export interface MockRefreshToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface MockCatalogItem {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockIncident {
  id: string;
  ticketNumber: string;
  shortDescription: string;
  description: string;
  category: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  requesterId: string;
  assignedToId?: string | null;
  resolutionNotes?: string | null;
  slaDeadline?: Date | null;
  slaBreached: boolean;
  resolvedAt?: Date | null;
  problemId?: string | null;
  assetId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  requester?: MockUser;
  assignedTo?: MockUser | null;
  comments?: MockComment[];
}

export interface MockComment {
  id: string;
  incidentId: string;
  userId: string;
  content: string;
  createdAt: Date;
  user?: MockUser;
}

export interface MockServiceRequest {
  id: string;
  requestNumber: string;
  serviceCatalogItemId: string;
  requesterId: string;
  description: string;
  status: RequestStatus;
  assignedToId?: string | null;
  approvalStatus: ApprovalStatus;
  approverId?: string | null;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  catalogItem?: MockCatalogItem;
  requester?: MockUser;
  assignedTo?: MockUser | null;
  approver?: MockUser | null;
}

export interface MockKnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  authorId: string;
  status: ArticleStatus;
  createdAt: Date;
  updatedAt: Date;
  author?: MockUser;
}

export interface MockAsset {
  id: string;
  assetTag: string;
  name: string;
  type: string;
  model: string;
  serialNumber: string;
  status: AssetStatus;
  assignedToId?: string | null;
  locationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: MockUser | null;
}

export interface MockProblem {
  id: string;
  problemNumber: string;
  title: string;
  description: string;
  status: ProblemStatus;
  rootCause?: string | null;
  workaround?: string | null;
  ownerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  owner?: MockUser | null;
  incidents?: MockIncident[];
}

export interface MockChange {
  id: string;
  changeNumber: string;
  title: string;
  description: string;
  risk: ChangeRisk;
  implementationPlan: string;
  rollbackPlan: string;
  scheduledDate?: Date | null;
  status: ChangeStatus;
  ownerId: string;
  approverId?: string | null;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  owner?: MockUser;
  approver?: MockUser | null;
}

export interface MockNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: Date;
}

// Pre-hash default passwords synchronously for fast startup
const salt = bcrypt.genSaltSync(10);
const adminPassHash = bcrypt.hashSync('admin123', salt);
const techPassHash = bcrypt.hashSync('tech123', salt);
const userPassHash = bcrypt.hashSync('user123', salt);
const hclAdminHash = bcrypt.hashSync('Admin@1234', salt);
const hclAgentHash = bcrypt.hashSync('Agent@1234', salt);
const hclUserHash = bcrypt.hashSync('User@1234', salt);

class InMemoryStore {
  public users: MockUser[] = [
    {
      id: 'usr-admin-01',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@itsm.com',
      password: adminPassHash,
      role: Role.Admin,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    },
    {
      id: 'usr-tech-01',
      firstName: 'Alex',
      lastName: 'Technician',
      email: 'tech@itsm.com',
      password: techPassHash,
      role: Role.Technician,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    },
    {
      id: 'usr-user-01',
      firstName: 'Sarah',
      lastName: 'Employee',
      email: 'user@itsm.com',
      password: userPassHash,
      role: Role.User,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    },
    {
      id: 'usr-hcl-admin',
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@hcl.com',
      password: hclAdminHash,
      role: Role.Admin,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    },
    {
      id: 'usr-hcl-agent',
      firstName: 'Service',
      lastName: 'Agent',
      email: 'agent@hcl.com',
      password: hclAgentHash,
      role: Role.Technician,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    },
    {
      id: 'usr-hcl-user',
      firstName: 'HCL',
      lastName: 'Employee',
      email: 'user@hcl.com',
      password: hclUserHash,
      role: Role.User,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    },
  ];

  public refreshTokens: MockRefreshToken[] = [];

  public catalogItems: MockCatalogItem[] = [
    {
      id: 'cat-01',
      name: 'New Laptop',
      category: 'Hardware',
      description: 'Request a standard developer workstation or high-performance corporate laptop.',
      icon: 'Laptop',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'cat-02',
      name: 'VPN Access',
      category: 'Access',
      description: 'Request secure remote VPN tunnel credentials for working off-site.',
      icon: 'Shield',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'cat-03',
      name: 'Software Installation',
      category: 'Software',
      description: 'Request approved enterprise productivity tools, IDEs, or design software.',
      icon: 'Download',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'cat-04',
      name: 'Application Access',
      category: 'Access',
      description: 'Request access permissions for Jira, Confluence, ERP, or internal databases.',
      icon: 'Key',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'cat-05',
      name: 'Password Reset',
      category: 'Access',
      description: 'Submit an identity-verified credential reset request for corporate SSO.',
      icon: 'Lock',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'cat-06',
      name: 'Network Port Activation',
      category: 'Network',
      description: 'Request activation and VLAN assignment for desk Ethernet wall ports.',
      icon: 'Wifi',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  public incidents: MockIncident[] = [
    {
      id: 'inc-01',
      ticketNumber: 'INC000001',
      shortDescription: 'VPN connection dropping repeatedly',
      description: 'Unable to maintain a stable VPN tunnel when connected from home network. Disconnects every 15 minutes.',
      category: 'Network',
      priority: IncidentPriority.HIGH,
      status: IncidentStatus.IN_PROGRESS,
      requesterId: 'usr-user-01',
      assignedToId: 'usr-tech-01',
      slaBreached: false,
      createdAt: new Date(Date.now() - 2 * 3600 * 1000),
      updatedAt: new Date(),
    },
    {
      id: 'inc-02',
      ticketNumber: 'INC000002',
      shortDescription: 'Outlook client crashes on startup',
      description: 'Microsoft Outlook 365 crashes with error code 0xc0000005 immediately when opened after latest Windows update.',
      category: 'Software',
      priority: IncidentPriority.MEDIUM,
      status: IncidentStatus.NEW,
      requesterId: 'usr-user-01',
      slaBreached: false,
      createdAt: new Date(Date.now() - 5 * 3600 * 1000),
      updatedAt: new Date(),
    },
  ];

  public comments: MockComment[] = [
    {
      id: 'comm-01',
      incidentId: 'inc-01',
      userId: 'usr-tech-01',
      content: 'Investigating network logs on edge gateway. MTU size mismatch detected.',
      createdAt: new Date(Date.now() - 1 * 3600 * 1000),
    },
  ];

  public serviceRequests: MockServiceRequest[] = [
    {
      id: 'req-01',
      requestNumber: 'REQ000001',
      serviceCatalogItemId: 'cat-01',
      requesterId: 'usr-user-01',
      description: 'Developer Macbook Pro M3 32GB RAM request for new project kickoff.',
      status: RequestStatus.SUBMITTED,
      approvalStatus: ApprovalStatus.PENDING,
      createdAt: new Date(Date.now() - 24 * 3600 * 1000),
      updatedAt: new Date(),
    },
  ];

  public knowledgeArticles: MockKnowledgeArticle[] = [
    {
      id: 'kb-01',
      title: 'How to Connect to Corporate VPN',
      category: 'Access',
      content: `## Connecting to Corporate VPN\n\nTo connect securely to corporate network resources:\n1. Open Cisco AnyConnect or GlobalProtect on your laptop.\n2. Enter server portal: \`vpn.corp.itsm.com\`\n3. Authenticate using your corporate email and SSO MFA push.\n4. If connection drops, verify your Wi-Fi MTU is set to 1420 or disable local IPv6.`,
      status: ArticleStatus.PUBLISHED,
      authorId: 'usr-tech-01',
      createdAt: new Date(Date.now() - 48 * 3600 * 1000),
      updatedAt: new Date(),
    },
    {
      id: 'kb-02',
      title: 'Setting up Microsoft Outlook on Windows 11',
      category: 'Software',
      content: `## Outlook Configuration Guide\n\nIf Outlook fails to start or crashes on startup:\n1. Press \`Win + R\` and run \`outlook.exe /safe\`\n2. Navigate to **File > Options > Add-ins** and disable third-party COM add-ins.\n3. If corruption persists, go to Control Panel > Mail > Show Profiles and create a clean profile.`,
      status: ArticleStatus.PUBLISHED,
      authorId: 'usr-tech-01',
      createdAt: new Date(Date.now() - 72 * 3600 * 1000),
      updatedAt: new Date(),
    },
    {
      id: 'kb-03',
      title: 'Troubleshooting Office Printer Offline Issues',
      category: 'Hardware',
      content: `## Printer Offline Remediation\n\n1. Verify printer IP is reachable: \`ping 10.20.4.15\`\n2. Restart the Windows Print Spooler: \`net stop spooler && net start spooler\`\n3. Clear \`C:\\Windows\\System32\\spool\\PRINTERS\` queue folder.\n4. Power cycle the physical printer and wait 60 seconds for DHCP renewal.`,
      status: ArticleStatus.PUBLISHED,
      authorId: 'usr-tech-01',
      createdAt: new Date(Date.now() - 96 * 3600 * 1000),
      updatedAt: new Date(),
    },
  ];

  public assets: MockAsset[] = [
    {
      id: 'ast-01',
      assetTag: 'AST000001',
      name: 'MacBook Pro 16" M3 Max',
      type: 'Laptop',
      model: 'Apple A2991',
      serialNumber: 'C02G841NMD6R',
      status: AssetStatus.ASSIGNED,
      assignedToId: 'usr-user-01',
      locationId: 'Building A, Floor 3',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'ast-02',
      assetTag: 'AST000002',
      name: 'Dell Precision 3660 Tower',
      type: 'Desktop',
      model: 'Precision 3660',
      serialNumber: '8H2K9Q3',
      status: AssetStatus.AVAILABLE,
      locationId: 'Building B, Lab 102',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'ast-03',
      assetTag: 'AST000003',
      name: 'Core Edge Switch Cisco Catalyst 9300',
      type: 'Network Device',
      model: 'C9300-48P',
      serialNumber: 'FCW2348A021',
      status: AssetStatus.AVAILABLE,
      locationId: 'Data Center Rack 4',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  public problems: MockProblem[] = [
    {
      id: 'prb-01',
      problemNumber: 'PRB000001',
      title: 'Intermittent VPN Gateway Session Terminations',
      description: 'Multiple users across remote sites reporting sudden SSL tunnel disconnects every 45 minutes.',
      status: ProblemStatus.INVESTIGATING,
      rootCause: 'Memory leak in VPN appliance firmware v12.4 causing packet buffer exhaustion.',
      workaround: 'Disable DTLS tunnel optimization and force standard TLS 1.3 fallback.',
      ownerId: 'usr-tech-01',
      createdAt: new Date(Date.now() - 24 * 3600 * 1000),
      updatedAt: new Date(),
    },
  ];

  public changes: MockChange[] = [
    {
      id: 'chg-01',
      changeNumber: 'CHG000001',
      title: 'Upgrade Edge Core Switch Firmware to v17.9.4a',
      description: 'Apply critical security patching and resolve memory buffer starvation on core stack.',
      risk: ChangeRisk.HIGH,
      implementationPlan: '1. Backup running config. 2. Push image to secondary boot partition. 3. Reload stack during maintenance window at 02:00 AM. 4. Verify spanning tree convergence.',
      rollbackPlan: 'Revert boot variable to previous stable image v17.6.3 and power cycle switch stack.',
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: ChangeStatus.PENDING_APPROVAL,
      ownerId: 'usr-tech-01',
      createdAt: new Date(Date.now() - 12 * 3600 * 1000),
      updatedAt: new Date(),
    },
  ];

  public notifications: MockNotification[] = [
    {
      id: 'notif-01',
      userId: 'usr-user-01',
      title: 'Incident Updated',
      message: 'Technician Alex commented on your incident INC000001.',
      link: '/incidents/inc-01',
      read: false,
      createdAt: new Date(Date.now() - 3600 * 1000),
    },
    {
      id: 'notif-02',
      userId: 'usr-admin-01',
      title: 'New Change Request',
      message: 'Change CHG000001 is awaiting managerial approval.',
      link: '/changes/chg-01',
      read: false,
      createdAt: new Date(Date.now() - 7200 * 1000),
    },
  ];

  // Helper getters with relations
  public getIncidentWithRelations(inc: MockIncident): MockIncident {
    const requester = this.users.find((u) => u.id === inc.requesterId);
    const assignedTo = inc.assignedToId ? this.users.find((u) => u.id === inc.assignedToId) : null;
    const comments = this.comments
      .filter((c) => c.incidentId === inc.id)
      .map((c) => ({
        ...c,
        user: this.users.find((u) => u.id === c.userId),
      }));
    return {
      ...inc,
      requester,
      assignedTo,
      comments,
    };
  }

  public getRequestWithRelations(req: MockServiceRequest): MockServiceRequest {
    const catalogItem = this.catalogItems.find((c) => c.id === req.serviceCatalogItemId);
    const requester = this.users.find((u) => u.id === req.requesterId);
    const assignedTo = req.assignedToId ? this.users.find((u) => u.id === req.assignedToId) : null;
    const approver = req.approverId ? this.users.find((u) => u.id === req.approverId) : null;
    return {
      ...req,
      catalogItem,
      requester,
      assignedTo,
      approver,
    };
  }

  public getKnowledgeWithRelations(art: MockKnowledgeArticle): MockKnowledgeArticle {
    const author = this.users.find((u) => u.id === art.authorId);
    return {
      ...art,
      author,
    };
  }

  public getChangeWithRelations(chg: MockChange): MockChange {
    const owner = this.users.find((u) => u.id === chg.ownerId);
    const approver = chg.approverId ? this.users.find((u) => u.id === chg.approverId) : null;
    return {
      ...chg,
      owner,
      approver,
    };
  }

  public getProblemWithRelations(prb: MockProblem): MockProblem {
    const owner = prb.ownerId ? this.users.find((u) => u.id === prb.ownerId) : null;
    const incidents = this.incidents.filter((i) => i.problemId === prb.id);
    return {
      ...prb,
      owner,
      incidents,
    };
  }
}

export const mockStore = new InMemoryStore();

let dbUnavailableCached: boolean | null = null;

export function isDbUnavailable(): boolean {
  if (dbUnavailableCached !== null) return dbUnavailableCached;
  const dbUrl = process.env.DATABASE_URL || '';
  if (process.env.VERCEL && (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1') || !dbUrl)) {
    dbUnavailableCached = true;
    return true;
  }
  return false;
}

export function markDbUnavailable(): void {
  dbUnavailableCached = true;
}

export function isDbConnectionError(error: any): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const code = error.code || '';
  const isErr = (
    code === 'P1001' ||
    code === 'P1000' ||
    code === 'P1002' ||
    code === 'P1003' ||
    code === 'P1017' ||
    error.name === 'PrismaClientInitializationError' ||
    (error.name === 'PrismaClientKnownRequestError' && (code === 'P1001' || code === 'P1002')) ||
    msg.includes("can't reach database server") ||
    msg.includes('connection refused') ||
    msg.includes('econnrefused') ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('connection terminated') ||
    msg.includes('database_url')
  );
  if (isErr) {
    dbUnavailableCached = true;
  }
  return isErr;
}

