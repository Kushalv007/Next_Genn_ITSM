import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

async function runStep7Tests() {
  console.log('========================================================');
  console.log('🚀 STARTING STEP 7 ENTERPRISE MANAGEMENT AUTOMATED TESTS');
  console.log('========================================================\n');

  try {
    // 1. Authenticate users
    console.log('🔑 [1/5] Authenticating test accounts...');
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

    // 2. Asset Management Tests
    console.log('💻 [2/5] Testing Asset Management...');
    // 2.1 Create an asset
    const newAssetRes = await axios.post(
      `${API_BASE}/assets`,
      {
        name: 'MacBook Pro 16 M3 Max',
        type: 'Laptop',
        model: 'Apple A2992 (Space Black)',
        serialNumber: `SN-AUTO-${Date.now().toString().slice(-6)}`,
        status: 'AVAILABLE',
        locationId: 'Building 4, Floor 2, Desk 42',
      },
      { headers: { Authorization: `Bearer ${techToken}` } }
    );
    const createdAsset = newAssetRes.data.data;
    console.log(`   ✅ Asset created: ${createdAsset.assetTag} - ${createdAsset.name}`);
    if (!createdAsset.assetTag.startsWith('AST')) {
      throw new Error(`Invalid asset tag format: ${createdAsset.assetTag}`);
    }

    // 2.2 Update asset custody (assign to Technician)
    const updateAssetRes = await axios.put(
      `${API_BASE}/assets/${createdAsset.id}`,
      {
        status: 'ASSIGNED',
        assignedToId: techUser.id,
      },
      { headers: { Authorization: `Bearer ${techToken}` } }
    );
    console.log(`   ✅ Asset assigned to ${updateAssetRes.data.data.assignedTo?.email}, status: ${updateAssetRes.data.data.status}`);
    if (updateAssetRes.data.data.status !== 'ASSIGNED' || updateAssetRes.data.data.assignedToId !== techUser.id) {
      throw new Error('Failed to update asset assignment');
    }

    // 2.3 Search & Filter assets
    const searchAssetRes = await axios.get(
      `${API_BASE}/assets?search=${createdAsset.assetTag}&type=Laptop`,
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    console.log(`   ✅ Asset search returned ${searchAssetRes.data.data.length} match(es)`);
    if (searchAssetRes.data.data.length === 0) {
      throw new Error('Search failed to find created asset');
    }

    // 3. Incident referencing Asset
    console.log('\n🎫 [3/5] Testing Incident referencing Asset...');
    const incidentWithAssetRes = await axios.post(
      `${API_BASE}/incidents`,
      {
        shortDescription: 'Liquid spill on keyboard and trackpad malfunction',
        description: 'Coffee spilled over laptop keyboard causing keys to stick and trackpad to register erratic clicks.',
        category: 'Hardware',
        priority: 'HIGH',
        assetId: createdAsset.id,
      },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    const createdIncident = incidentWithAssetRes.data.data;
    console.log(`   ✅ Incident created: ${createdIncident.ticketNumber} referencing asset ${createdAsset.assetTag}`);
    if (createdIncident.assetId !== createdAsset.id) {
      throw new Error('Incident does not reference target assetId');
    }

    // Verify asset detail now lists this incident
    const assetDetailRes = await axios.get(
      `${API_BASE}/assets/${createdAsset.id}`,
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    const linkedIncidents = assetDetailRes.data.data.incidents;
    console.log(`   ✅ Asset details verified: ${linkedIncidents?.length ?? 0} linked incident(s) found`);
    if (!linkedIncidents || !linkedIncidents.some((i: any) => i.id === createdIncident.id)) {
      throw new Error('Asset does not list the referencing incident in history');
    }

    // 4. Problem Management Tests
    console.log('\n🔍 [4/5] Testing Problem Management...');
    // 4.1 Create Problem
    const newProblemRes = await axios.post(
      `${API_BASE}/problems`,
      {
        title: 'MacBook Pro Apple Silicon Keyboard Controller Glitch',
        description: 'Investigating widespread erratic keystrokes and intermittent trackpad lag across developer fleet.',
        ownerId: techUser.id,
        rootCause: 'Hardware controller firmware bug during high thermal load',
        workaround: 'Attach external USB keyboard and run cooling fan throttle script',
      },
      { headers: { Authorization: `Bearer ${techToken}` } }
    );
    const createdProblem = newProblemRes.data.data;
    console.log(`   ✅ Problem created: ${createdProblem.problemNumber} - ${createdProblem.title}`);
    if (!createdProblem.problemNumber.startsWith('PRB')) {
      throw new Error(`Invalid problem number format: ${createdProblem.problemNumber}`);
    }

    // 4.2 Link Incident to Problem
    const linkRes = await axios.post(
      `${API_BASE}/problems/${createdProblem.id}/incidents`,
      { incidentId: createdIncident.id },
      { headers: { Authorization: `Bearer ${techToken}` } }
    );
    console.log(`   ✅ Incident ${createdIncident.ticketNumber} linked to problem ${createdProblem.problemNumber}`);
    if (linkRes.data.data.incidents?.length === 0) {
      throw new Error('Incident was not linked to problem');
    }

    // 4.3 Update Problem Status & Details
    const updateProblemRes = await axios.put(
      `${API_BASE}/problems/${createdProblem.id}`,
      {
        status: 'RESOLVED',
        rootCause: 'Vendor confirmed firmware defect in revision 1.2. Permanent patch deployed via SMC update.',
        workaround: 'Apply SMC firmware patch v1.3 immediately',
      },
      { headers: { Authorization: `Bearer ${techToken}` } }
    );
    console.log(`   ✅ Problem status updated to: ${updateProblemRes.data.data.status}`);
    if (updateProblemRes.data.data.status !== 'RESOLVED') {
      throw new Error('Failed to resolve problem');
    }

    // 5. Change Management Tests
    console.log('\n🔄 [5/5] Testing Change Management...');
    // 5.1 Create Change
    const newChangeRes = await axios.post(
      `${API_BASE}/changes`,
      {
        title: 'Emergency SMC Firmware Patch Deployment v1.3',
        description: 'Push critical hardware firmware patch across all Silicon workstations to resolve controller lockups.',
        risk: 'HIGH',
        implementationPlan: '1. Stage firmware payload in local MDM cache\n2. Trigger silent firmware pre-flash\n3. Notify user for scheduled 5-min reboot window',
        rollbackPlan: 'Boot into recovery fallback partition and restore SMC ROM v1.1 if POST fails',
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
      },
      { headers: { Authorization: `Bearer ${techToken}` } }
    );
    const createdChange = newChangeRes.data.data;
    console.log(`   ✅ Change created: ${createdChange.changeNumber} (Status: ${createdChange.status}, Risk: ${createdChange.risk})`);
    if (!createdChange.changeNumber.startsWith('CHG')) {
      throw new Error(`Invalid change number format: ${createdChange.changeNumber}`);
    }
    if (createdChange.status !== 'DRAFT') {
      throw new Error(`Expected initial status DRAFT, got ${createdChange.status}`);
    }

    // 5.2 Submit Change for Approval
    const submitChangeRes = await axios.patch(
      `${API_BASE}/changes/${createdChange.id}/status`,
      { status: 'PENDING_APPROVAL' },
      { headers: { Authorization: `Bearer ${techToken}` } }
    );
    console.log(`   ✅ Change submitted for authorization (Status: ${submitChangeRes.data.data.status})`);
    if (submitChangeRes.data.data.status !== 'PENDING_APPROVAL') {
      throw new Error('Failed to transition change to PENDING_APPROVAL');
    }

    // 5.3 Verify Employee CANNOT approve change (Role Authorization test)
    let unauthorizedBlocked = false;
    try {
      await axios.post(
        `${API_BASE}/changes/${createdChange.id}/approval`,
        { decision: 'APPROVED' },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
    } catch (err: any) {
      if (err.response?.status === 403) {
        unauthorizedBlocked = true;
      }
    }
    console.log(`   ✅ Regular user blocked from approving change: ${unauthorizedBlocked}`);
    if (!unauthorizedBlocked) {
      throw new Error('Security check failed: regular employee was able to approve a change!');
    }

    // 5.4 Manager/Admin Approval
    const approveRes = await axios.post(
      `${API_BASE}/changes/${createdChange.id}/approval`,
      { decision: 'APPROVED' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const approvedChange = approveRes.data.data;
    console.log(`   ✅ Change approved by Admin (Status: ${approvedChange.status}, Approver: ${approvedChange.approver?.email})`);
    if (approvedChange.status !== 'APPROVED' || !approvedChange.approvedAt) {
      throw new Error('Change approval failed or missing timestamp');
    }

    // 5.5 Transition to IMPLEMENTATION
    const implRes = await axios.patch(
      `${API_BASE}/changes/${createdChange.id}/status`,
      { status: 'IMPLEMENTATION' },
      { headers: { Authorization: `Bearer ${techToken}` } }
    );
    console.log(`   ✅ Change transitioned to: ${implRes.data.data.status}`);
    if (implRes.data.data.status !== 'IMPLEMENTATION') {
      throw new Error('Failed to transition change to IMPLEMENTATION');
    }

    // 5.6 Transition to CLOSED
    const closeRes = await axios.patch(
      `${API_BASE}/changes/${createdChange.id}/status`,
      { status: 'CLOSED' },
      { headers: { Authorization: `Bearer ${techToken}` } }
    );
    console.log(`   ✅ Change transitioned to: ${closeRes.data.data.status}`);
    if (closeRes.data.data.status !== 'CLOSED') {
      throw new Error('Failed to complete and close change');
    }

    console.log('\n========================================================');
    console.log('🎉 ALL STEP 7 TESTS PASSED SUCCESSFULLY! (100% SUCCESS)');
    console.log('========================================================');
  } catch (err: any) {
    console.error('\n❌ STEP 7 TEST FAILED:');
    if (err.response) {
      console.error(`HTTP Status: ${err.response.status}`);
      console.error('Response Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message || err);
    }
    process.exit(1);
  }
}

void runStep7Tests();
