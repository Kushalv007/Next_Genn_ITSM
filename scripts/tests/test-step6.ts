import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

async function runStep6Tests() {
  console.log('==============================================');
  console.log('🚀 STARTING STEP 6 SMART ITSM AUTOMATED TESTS');
  console.log('==============================================\n');

  // 1. Authenticate users
  console.log('🔑 [1/6] Authenticating test accounts...');
  const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
    email: 'admin@itsm.com',
    password: 'admin123',
  });
  const adminToken = adminLogin.data.data.tokens.accessToken;
  const adminUser = adminLogin.data.data.user;

  const techLogin = await axios.post(`${API_BASE}/auth/login`, {
    email: 'tech@itsm.com',
    password: 'tech123',
  });
  const techToken = techLogin.data.data.tokens.accessToken;
  const techUser = techLogin.data.data.user;

  const userLogin = await axios.post(`${API_BASE}/auth/login`, {
    email: 'user@itsm.com',
    password: 'user123',
  });
  const userToken = userLogin.data.data.tokens.accessToken;
  const employeeUser = userLogin.data.data.user;

  console.log(`   Logged in Admin: ${adminUser.email}`);
  console.log(`   Logged in Technician: ${techUser.email}`);
  console.log(`   Logged in Employee: ${employeeUser.email}\n`);

  // 2. Knowledge Base Tests
  console.log('📚 [2/6] Testing Knowledge Base...');
  // 2.1 List articles as employee (only published)
  const kbListRes = await axios.get(`${API_BASE}/knowledge`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  console.log(`   Published articles found: ${kbListRes.data.data.length}`);
  if (kbListRes.data.data.length === 0) throw new Error('Expected seeded KB articles');

  // 2.2 Keyword suggestion test
  const suggestRes = await axios.get(`${API_BASE}/knowledge/suggest?query=vpn`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  console.log(`   Keyword match for "vpn": found ${suggestRes.data.data.length} article(s)`);
  if (!suggestRes.data.data.some((a: any) => a.title.toLowerCase().includes('vpn'))) {
    throw new Error('Expected VPN article in suggestion results');
  }

  // 2.3 Create new article as Technician
  const newArticleRes = await axios.post(
    `${API_BASE}/knowledge`,
    {
      title: 'Resetting Multi-Factor Authentication (MFA)',
      content: 'To reset your MFA authenticator app, contact IT Support or visit the self-service security portal at security.vibe-itsm.local. Follow on-screen QR verification.',
      category: 'Access',
      status: 'PUBLISHED',
    },
    { headers: { Authorization: `Bearer ${techToken}` } }
  );
  const createdArticle = newArticleRes.data.data;
  console.log(`   Created article: [${createdArticle.id}] "${createdArticle.title}" (Status: ${createdArticle.status})`);

  // 2.4 Update article
  const updatedArticleRes = await axios.put(
    `${API_BASE}/knowledge/${createdArticle.id}`,
    {
      title: 'Resetting Multi-Factor Authentication (MFA) Guide',
    },
    { headers: { Authorization: `Bearer ${techToken}` } }
  );
  console.log(`   Updated article title to: "${updatedArticleRes.data.data.title}"\n`);

  // 3. Basic SLA Management Tests
  console.log('⏱️  [3/6] Testing Basic SLA Management...');
  // 3.1 Create Critical Incident (Target 2 hours)
  const critIncRes = await axios.post(
    `${API_BASE}/incidents`,
    {
      shortDescription: 'Core Production ERP is Down',
      description: 'The entire production ERP application is throwing HTTP 500 errors across all departments.',
      category: 'Software',
      priority: 'CRITICAL',
    },
    { headers: { Authorization: `Bearer ${userToken}` } }
  );
  const critIncident = critIncRes.data.data;
  const critDeadline = new Date(critIncident.slaDeadline).getTime();
  const critCreated = new Date(critIncident.createdAt).getTime();
  const critDiffHours = (critDeadline - critCreated) / (1000 * 60 * 60);
  console.log(`   CRITICAL Incident ${critIncident.ticketNumber}: SLA deadline is in ${critDiffHours.toFixed(1)} hours (expected ~2.0)`);
  if (Math.abs(critDiffHours - 2) > 0.1) throw new Error('Critical SLA duration mismatch');

  // 3.2 Create Medium Incident (Target 8 hours)
  const medIncRes = await axios.post(
    `${API_BASE}/incidents`,
    {
      shortDescription: 'Second monitor flickers intermittently',
      description: 'When plugged into HDMI port on dock, monitor flickers every few minutes.',
      category: 'Hardware',
      priority: 'MEDIUM',
    },
    { headers: { Authorization: `Bearer ${userToken}` } }
  );
  const medIncident = medIncRes.data.data;
  const medDeadline = new Date(medIncident.slaDeadline).getTime();
  const medCreated = new Date(medIncident.createdAt).getTime();
  const medDiffHours = (medDeadline - medCreated) / (1000 * 60 * 60);
  console.log(`   MEDIUM Incident ${medIncident.ticketNumber}: SLA deadline is in ${medDiffHours.toFixed(1)} hours (expected ~8.0)`);
  if (Math.abs(medDiffHours - 8) > 0.1) throw new Error('Medium SLA duration mismatch');

  // 3.3 Assign and Resolve Incident -> Check SLA Met & Notifications
  console.log('   Assigning and resolving incident to test SLA Met calculation & notifications...');
  await axios.put(
    `${API_BASE}/incidents/${critIncident.id}`,
    {
      assignedToId: techUser.id,
      status: 'IN_PROGRESS',
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );

  const resolveRes = await axios.put(
    `${API_BASE}/incidents/${critIncident.id}`,
    {
      status: 'RESOLVED',
      resolutionNotes: 'Restarted ERP clustered gateway nodes and flushed database connection pools.',
    },
    { headers: { Authorization: `Bearer ${techToken}` } }
  );
  const resolvedIncident = resolveRes.data.data;
  console.log(`   Resolved Incident ${resolvedIncident.ticketNumber}:`);
  console.log(`     status: ${resolvedIncident.status}`);
  console.log(`     slaBreached: ${resolvedIncident.slaBreached} (expected false)`);
  console.log(`     resolvedAt: ${resolvedIncident.resolvedAt}\n`);
  if (resolvedIncident.slaBreached !== false) throw new Error('Incident resolved in time should not be marked breached');

  // 4. Basic Request Approvals Tests
  console.log('✍️  [4/6] Testing Service Request Approval Workflow...');
  // 4.1 Get catalog items
  const catalogRes = await axios.get(`${API_BASE}/service-catalog`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const firstCatalogItem = catalogRes.data.data[0];

  // 4.2 Submit request as employee
  const newReqRes = await axios.post(
    `${API_BASE}/requests`,
    {
      serviceCatalogItemId: firstCatalogItem.id,
      description: 'Requesting MacBook Pro 16-inch for upcoming mobile engineering project.',
    },
    { headers: { Authorization: `Bearer ${userToken}` } }
  );
  const createdReq = newReqRes.data.data;
  console.log(`   Submitted Request ${createdReq.requestNumber}:`);
  console.log(`     approvalStatus: ${createdReq.approvalStatus} (expected PENDING)`);
  if (createdReq.approvalStatus !== 'PENDING') throw new Error('Initial approvalStatus must be PENDING');

  // 4.3 Approve request as Technician/Admin
  const approveRes = await axios.post(
    `${API_BASE}/requests/${createdReq.id}/approval`,
    {
      approvalStatus: 'APPROVED',
    },
    { headers: { Authorization: `Bearer ${techToken}` } }
  );
  const approvedReq = approveRes.data.data;
  console.log(`   Manager Approved Request ${approvedReq.requestNumber}:`);
  console.log(`     approvalStatus: ${approvedReq.approvalStatus}`);
  console.log(`     status: ${approvedReq.status} (expected IN_PROGRESS)`);
  console.log(`     approverId: ${approvedReq.approverId} (${approvedReq.approver.email})`);
  console.log(`     approvedAt: ${approvedReq.approvedAt}\n`);

  if (approvedReq.approvalStatus !== 'APPROVED') throw new Error('Expected APPROVED approvalStatus');
  if (approvedReq.status !== 'IN_PROGRESS') throw new Error('Expected IN_PROGRESS status after approval');

  // 4.4 Submit another request and test rejection
  const secondReqRes = await axios.post(
    `${API_BASE}/requests`,
    {
      serviceCatalogItemId: firstCatalogItem.id,
      description: 'Requesting second laptop for temporary guest.',
    },
    { headers: { Authorization: `Bearer ${userToken}` } }
  );
  const rejectRes = await axios.post(
    `${API_BASE}/requests/${secondReqRes.data.data.id}/approval`,
    {
      approvalStatus: 'REJECTED',
    },
    { headers: { Authorization: `Bearer ${techToken}` } }
  );
  const rejectedReq = rejectRes.data.data;
  console.log(`   Manager Rejected Request ${rejectedReq.requestNumber}:`);
  console.log(`     approvalStatus: ${rejectedReq.approvalStatus} (expected REJECTED)`);
  console.log(`     status: ${rejectedReq.status} (expected REJECTED)\n`);
  if (rejectedReq.approvalStatus !== 'REJECTED' || rejectedReq.status !== 'REJECTED') {
    throw new Error('Expected REJECTED status');
  }

  // 5. In-app Notifications Tests
  console.log('🔔 [5/6] Testing In-app Notifications...');
  // 5.1 Check notifications for employee
  const employeeNotifRes = await axios.get(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  console.log(`   Employee received ${employeeNotifRes.data.data.length} notification(s):`);
  for (const n of employeeNotifRes.data.data.slice(0, 4)) {
    console.log(`     - [${n.isRead ? 'READ' : 'UNREAD'}] "${n.title}": ${n.message}`);
  }

  // 5.2 Check unread count
  const unreadCountRes = await axios.get(`${API_BASE}/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  console.log(`   Employee unread notification count: ${unreadCountRes.data.data.unreadCount}`);
  if (unreadCountRes.data.data.unreadCount <= 0) throw new Error('Expected unread notifications');

  // 5.3 Mark single notification as read
  const firstNotif = employeeNotifRes.data.data[0];
  await axios.patch(
    `${API_BASE}/notifications/${firstNotif.id}/read`,
    {},
    { headers: { Authorization: `Bearer ${userToken}` } }
  );
  console.log(`   Marked notification ${firstNotif.id} as read`);

  // 5.4 Mark all as read
  await axios.patch(
    `${API_BASE}/notifications/read-all`,
    {},
    { headers: { Authorization: `Bearer ${userToken}` } }
  );
  const finalCountRes = await axios.get(`${API_BASE}/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  console.log(`   After mark-all-read, unread count: ${finalCountRes.data.data.unreadCount} (expected 0)`);
  if (finalCountRes.data.data.unreadCount !== 0) throw new Error('Expected unread count to be 0');

  // 6. Summary
  console.log('\n==============================================');
  console.log('🎉 ALL STEP 6 TESTS PASSED SUCCESSFULLY!');
  console.log('==============================================');
}

runStep6Tests().catch((err) => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
