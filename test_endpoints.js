const https = require('https');

const BASE_URL = 'https://vibez-n5h1.onrender.com';

function request(method, path, data = null, headers = {}) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      }
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = body;
        try { parsed = JSON.parse(body); } catch(e) {}
        resolve({
          method,
          path,
          status: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        method,
        path,
        error: err.message
      });
    });

    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`TESTING ALL HTTP METHODS ON: ${BASE_URL}`);
  console.log(`======================================================\n`);

  const results = [];

  async function test(name, method, path, data = null, headers = {}) {
    const res = await request(method, path, data, headers);
    results.push({ name, ...res });
    const statusIcon = res.status >= 200 && res.status < 400 ? '✅' : (res.status === 401 || res.status === 403 || res.status === 404 ? 'ℹ️' : '⚠️');
    console.log(`${statusIcon} [${method.padEnd(7)}] ${path.padEnd(45)} -> HTTP ${res.status || 'ERR'} ${res.statusMessage || ''}`);
    if (res.data) {
      const preview = typeof res.data === 'object' ? JSON.stringify(res.data).substring(0, 100) : String(res.data).substring(0, 100);
      console.log(`   Response: ${preview}`);
    }
    return res;
  }

  // 1. HEAD & OPTIONS Methods
  console.log(`\n--- 1. HTTP HEAD & OPTIONS ---`);
  await test('OPTIONS Preflight', 'OPTIONS', '/api/chats');
  await test('HEAD Health Check', 'HEAD', '/health');
  await test('HEAD System Status', 'HEAD', '/api/system/status');
  await test('HEAD Developer Health', 'HEAD', '/api/developer/health');
  await test('HEAD Public Config', 'HEAD', '/api/config/public');

  // 2. Public GET Methods
  console.log(`\n--- 2. Public GET Endpoints ---`);
  await test('Health Check', 'GET', '/health');
  await test('System Status', 'GET', '/api/system/status');
  await test('Public Config', 'GET', '/api/config/public');
  await test('App Download Info', 'GET', '/api/app/download-info');
  await test('Latest Updates', 'GET', '/api/app/updates/latest');
  await test('Public Broadcasts', 'GET', '/api/broadcasts');
  await test('Public Announcements', 'GET', '/api/announcements');
  await test('Payment Providers List', 'GET', '/api/payments/providers');
  await test('Developer Health Check', 'GET', '/api/developer/health');
  await test('Developer Server Health Check', 'GET', '/api/developer/server/health-check');
  await test('Developer API Metrics', 'GET', '/api/developer/metrics');

  // 3. Public POST Methods
  console.log(`\n--- 3. Public POST Endpoints ---`);
  await test('Contact Inquiry', 'POST', '/api/contact', {
    name: 'Curl Test Bot',
    email: 'curlbot@example.com',
    message: 'Testing POST endpoint via test suite'
  });
  await test('Newsletter Subscribe', 'POST', '/api/subscribe', {
    email: 'curlbot-sub@example.com'
  });
  await test('Developer Webhook Verify', 'POST', '/api/developer/webhooks/verify', {
    url: 'https://webhook.site/test',
    secret: 'test-secret'
  });

  // 4. Authentication Flow (POST)
  console.log(`\n--- 4. Authentication (POST) ---`);
  const testPhone = '+1999888' + Math.floor(1000 + Math.random() * 9000);
  const phoneAuthRes = await test('Phone Login/Register', 'POST', '/api/auth/phone', {
    phoneNumber: testPhone,
    displayName: 'Test Runner User',
    about: 'Automated test suite profile'
  });

  let userToken = '';
  let userId = '';
  if (phoneAuthRes.data && phoneAuthRes.data.token) {
    userToken = phoneAuthRes.data.token;
    userId = phoneAuthRes.data.user?.id || '';
    console.log(`   -> Obtained User Auth Token for User ID: ${userId}`);
  }

  const userHeaders = userToken ? { 'Authorization': `Bearer ${userToken}` } : {};

  // 5. Authenticated User GET Endpoints
  console.log(`\n--- 5. Authenticated GET Endpoints ---`);
  await test('Get Current User Profile', 'GET', '/api/auth/profile', null, userHeaders);
  await test('Search Users', 'GET', '/api/users/search?q=Test', null, userHeaders);
  await test('Get User Settings', 'GET', '/api/users/settings', null, userHeaders);
  await test('Get User Chats', 'GET', '/api/chats', null, userHeaders);
  await test('Get User Statuses', 'GET', '/api/statuses', null, userHeaders);
  await test('Get Status Privacy', 'GET', '/api/statuses/privacy', null, userHeaders);
  await test('Get Communities', 'GET', '/api/communities', null, userHeaders);
  await test('Get Call Logs', 'GET', '/api/calls', null, userHeaders);
  await test('Get Verification Status', 'GET', '/api/payments/verification/status', null, userHeaders);

  // 6. Authenticated User PUT & PATCH Endpoints
  console.log(`\n--- 6. Authenticated PUT & PATCH Endpoints ---`);
  await test('Update Profile (PUT)', 'PUT', '/api/users/profile', {
    displayName: 'Updated Test Runner',
    about: 'Updated status text via PUT test'
  }, userHeaders);

  await test('Update Settings (PUT)', 'PUT', '/api/users/settings', {
    theme: 'DARK',
    notifications: true
  }, userHeaders);

  await test('Update Status Privacy (PUT)', 'PUT', '/api/statuses/privacy', {
    privacy: 'CONTACTS'
  }, userHeaders);

  // 7. Authenticated User POST Endpoints (Create Chat, Group, Community, Status, Call)
  console.log(`\n--- 7. Authenticated POST Endpoints ---`);
  const statusRes = await test('Create Status', 'POST', '/api/statuses', {
    type: 'TEXT',
    content: 'Hello world status from test suite',
    backgroundColor: '#128C7E'
  }, userHeaders);
  const statusId = statusRes.data?.id;

  if (statusId) {
    await test('View Status', 'POST', `/api/statuses/${statusId}/view`, {}, userHeaders);
  }

  const groupChatRes = await test('Create Group Chat', 'POST', '/api/chats/group', {
    name: 'Automated Test Group'
  }, userHeaders);
  const chatId = groupChatRes.data?.id;

  if (chatId) {
    await test('Get Chat Messages', 'GET', `/api/chats/${chatId}/messages`, null, userHeaders);
    await test('Update Chat Details (PATCH)', 'PATCH', `/api/chats/${chatId}`, {
      name: 'Renamed Test Group'
    }, userHeaders);
  }

  const commRes = await test('Create Community', 'POST', '/api/communities', {
    name: 'Test Community Group',
    description: 'Community created during endpoint test'
  }, userHeaders);
  const commId = commRes.data?.id;

  if (commId) {
    await test('Get Community Details', 'GET', `/api/communities/${commId}`, null, userHeaders);
    await test('Get Community Channels', 'GET', `/api/communities/${commId}/chats`, null, userHeaders);
    await test('Join Community', 'POST', `/api/communities/${commId}/join`, {}, userHeaders);
  }

  const callRes = await test('Create Call Log', 'POST', '/api/calls', {
    callerId: userId,
    receiverId: userId,
    type: 'VOICE',
    duration: 45,
    status: 'COMPLETED'
  }, userHeaders);
  const callId = callRes.data?.id;

  await test('Create Payment Order', 'POST', '/api/payments/create', {
    amount: 3.00,
    currency: 'USD',
    provider: 'STRIPE',
    type: 'VERIFICATION_BADGE'
  }, userHeaders);

  await test('Request Media Upload URL', 'POST', '/api/media/upload-url', {
    fileName: 'test-image.jpg',
    contentType: 'image/jpeg'
  }, userHeaders);

  await test('Report User', 'POST', '/api/users/report', {
    reportedUserId: userId,
    reason: 'Test Report from integration suite'
  }, userHeaders);

  // 8. Authenticated User DELETE Endpoints
  console.log(`\n--- 8. Authenticated DELETE Endpoints ---`);
  if (statusId) {
    await test('Delete Status (DELETE)', 'DELETE', `/api/statuses/${statusId}`, null, userHeaders);
  }
  if (callId) {
    await test('Delete Single Call Log (DELETE)', 'DELETE', `/api/calls/${callId}`, null, userHeaders);
  }
  await test('Clear All Call Logs (DELETE)', 'DELETE', '/api/calls', null, userHeaders);

  if (chatId) {
    await test('Delete Chat (DELETE)', 'DELETE', `/api/chats/${chatId}`, null, userHeaders);
  }

  // 9. Admin Flow (Login, GET, POST, PUT, PATCH, DELETE)
  console.log(`\n--- 9. Admin Flow ---`);
  const adminLoginRes = await test('Admin Login (POST)', 'POST', '/api/admin/login', {
    email: 'admin@vibez.com',
    password: 'admin'
  });

  let adminToken = '';
  if (adminLoginRes.data && adminLoginRes.data.token) {
    adminToken = adminLoginRes.data.token;
    console.log(`   -> Admin Token Acquired`);
  }

  const adminHeaders = adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {};

  if (adminToken) {
    await test('Admin Metrics (GET)', 'GET', '/api/admin/metrics', null, adminHeaders);
    await test('Admin Users List (GET)', 'GET', '/api/admin/users', null, adminHeaders);
    await test('Admin Reports List (GET)', 'GET', '/api/admin/reports', null, adminHeaders);
    await test('Admin Audit Logs (GET)', 'GET', '/api/admin/logs', null, adminHeaders);
    await test('Admin Settings (GET)', 'GET', '/api/admin/settings', null, adminHeaders);
    await test('Admin Payment Providers (GET)', 'GET', '/api/admin/payments/providers', null, adminHeaders);
    await test('Admin Payment Transactions (GET)', 'GET', '/api/admin/payments/transactions', null, adminHeaders);
    await test('Admin Storage Stats (GET)', 'GET', '/api/admin/storage', null, adminHeaders);
    await test('Admin Analytics (GET)', 'GET', '/api/admin/analytics', null, adminHeaders);
    await test('Admin Inquiries (GET)', 'GET', '/api/admin/inquiries', null, adminHeaders);
    await test('Admin Security Health (GET)', 'GET', '/api/admin/security/health', null, adminHeaders);
    await test('Admin Profile (GET)', 'GET', '/api/admin/profile', null, adminHeaders);

    // Admin POST, PATCH, PUT
    await test('Admin Update Settings (PATCH)', 'PATCH', '/api/admin/settings', {
      appName: 'VIBEZ'
    }, adminHeaders);

    await test('Admin Broadcast Send (POST)', 'POST', '/api/admin/broadcasts', {
      title: 'Automated Test Announcement',
      content: 'Testing admin broadcast functionality',
      target: 'ALL'
    }, adminHeaders);

    await test('Admin Storage Purge (POST)', 'POST', '/api/admin/storage/purge', {}, adminHeaders);
  }

  console.log(`\n======================================================`);
  console.log(`SUMMARY OF TEST EXECUTION:`);
  console.log(`Total Endpoints Tested: ${results.length}`);
  const methods = {};
  results.forEach(r => {
    methods[r.method] = (methods[r.method] || 0) + 1;
  });
  console.log(`Methods covered:`, methods);
  console.log(`======================================================\n`);
}

runTests().catch(console.error);
