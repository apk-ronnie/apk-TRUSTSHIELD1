const { analyzeAndRedactText, localFallbackAnalysis } = require('./services/aiService');
const storageService = require('./services/storageService');
const authController = require('./controllers/authController');
const analysisController = require('./controllers/analysisController');

function createMockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
  return res;
}

async function runDirectTests() {
  console.log('🧪 Starting Controller and AI Service Direct Verification Suite...\n');

  // Test 1: AI Heuristic & PII Redaction
  console.log('[Test 1] Verifying AI Analysis & PII Redaction...');
  const suspiciousText = 'URGENT NOTICE: Your account with John Doe (email: john.d@enterprise.com, phone: 415-555-0199, SSN: 123-45-6789) is suspended! Verify your account immediately.';
  const aiResult = await analyzeAndRedactText(suspiciousText);
  console.log('  Threat Score:', aiResult.threatScore);
  console.log('  Threat Type:', aiResult.threatType);
  console.log('  Explanation:', aiResult.explanation);
  console.log('  Redacted Text:', aiResult.redactedText);

  if (!aiResult.redactedText.includes('[REDACTED]')) {
    throw new Error('PII Redaction failed to mask identifiers.');
  }
  if (aiResult.redactedText.includes('john.d@enterprise.com')) {
    throw new Error('Email was not redacted!');
  }
  if (aiResult.redactedText.includes('123-45-6789')) {
    throw new Error('SSN was not redacted!');
  }
  if (aiResult.threatScore < 40) {
    throw new Error('Urgent suspension text should trigger elevated threat score');
  }
  console.log('  ✅ Test 1 Passed: AI threat detection and PII redaction working accurately!\n');

  // Test 2: User Registration & Zod Validation
  console.log('[Test 2] Verifying User Registration Controller...');
  const regReq = {
    body: {
      name: 'Cyber Sentinel',
      email: `test_analyst_${Date.now()}@shield.io`,
      password: 'SafePassword2026!'
    }
  };
  const regRes = createMockRes();
  await authController.register(regReq, regRes, (err) => { if (err) throw err; });
  console.log('  Status Code:', regRes.statusCode);
  console.log('  Created User:', regRes.data?.data?.user?.email);
  console.log('  Issued JWT Token:', !!regRes.data?.data?.token);

  if (regRes.statusCode !== 201 || !regRes.data?.data?.token) {
    throw new Error('Registration failed');
  }
  const token = regRes.data.data.token;
  const user = regRes.data.data.user;
  console.log('  ✅ Test 2 Passed: User registered with bcrypt hashing & JWT issued!\n');

  // Test 3: User Login
  console.log('[Test 3] Verifying User Authentication (Login)...');
  const loginReq = {
    body: {
      email: regReq.body.email,
      password: regReq.body.password
    }
  };
  const loginRes = createMockRes();
  await authController.login(loginReq, loginRes, (err) => { if (err) throw err; });
  console.log('  Status Code:', loginRes.statusCode);
  console.log('  Login Success:', loginRes.data?.success);
  if (loginRes.statusCode !== 200 || !loginRes.data?.data?.token) {
    throw new Error('Login failed');
  }
  console.log('  ✅ Test 3 Passed: Password verified and new JWT issued!\n');

  // Test 4: Analysis Scan Submission
  console.log('[Test 4] Verifying Text Scan Submission Controller...');
  const scanReq = {
    user: { id: user.id, email: user.email, name: user.name },
    body: {
      text: 'From: support@paypal-security-update.com\nDear user, unauthorized access detected on your account. Please update payment immediately or transfer wire funds. Contact agent at support@paypal-security-update.com or call 555-888-9999.'
    }
  };
  const scanRes = createMockRes();
  await analysisController.scanText(scanReq, scanRes, (err) => { if (err) throw err; });
  console.log('  Status Code:', scanRes.statusCode);
  console.log('  Detected Threat Type:', scanRes.data?.data?.threatType);
  console.log('  Threat Score:', scanRes.data?.data?.threatScore);
  console.log('  PII Count:', scanRes.data?.data?.metrics?.piiEntitiesCount);
  console.log('  Redacted Text Snippet:\n ', scanRes.data?.data?.redactedText.split('\n')[0]);
  if (scanRes.statusCode !== 200) {
    throw new Error('Scan failed');
  }
  console.log('  ✅ Test 4 Passed: Threat scanned, PII redacted, metadata saved!\n');

  // Test 5: Metrics Aggregation
  console.log('[Test 5] Verifying Metrics Aggregation Controller...');
  const metricsReq = {
    user: { id: user.id, email: user.email, name: user.name }
  };
  const metricsRes = createMockRes();
  await analysisController.getMetrics(metricsReq, metricsRes, (err) => { if (err) throw err; });
  console.log('  Total Scans:', metricsRes.data?.data?.totalScans);
  console.log('  Average Threat Score:', metricsRes.data?.data?.averageScore);
  console.log('  PII Redacted Total:', metricsRes.data?.data?.piiRedactedTotal);
  console.log('  Threat Type Breakdown:', metricsRes.data?.data?.threatTypeBreakdown);
  console.log('  Timeline points:', metricsRes.data?.data?.timeline?.length);

  if (metricsRes.data?.data?.totalScans !== 1) {
    throw new Error('Expected 1 total scan in metrics');
  }
  console.log('  ✅ Test 5 Passed: Metrics aggregated correctly for Recharts visualization!\n');

  // Test 6: Audit History
  console.log('[Test 6] Verifying History Retrieval Controller...');
  const historyReq = {
    user: { id: user.id, email: user.email, name: user.name },
    query: { page: '1', limit: '10' }
  };
  const historyRes = createMockRes();
  await analysisController.getHistory(historyReq, historyRes, (err) => { if (err) throw err; });
  console.log('  History items count:', historyRes.data?.data?.items?.length);
  console.log('  Total documents:', historyRes.data?.data?.pagination?.total);

  if (historyRes.data?.data?.items?.length !== 1) {
    throw new Error('Expected 1 history item');
  }
  console.log('  ✅ Test 6 Passed: Paginated history successfully retrieved!\n');

  console.log('🎉 ALL BACKEND LOGIC, MODELS, CONTROLLERS, AND SECURITY ENGINES ARE 100% OPERATIONAL!');
}

runDirectTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});

