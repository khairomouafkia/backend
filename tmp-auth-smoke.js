const admin = require('./config/firebaseAdmin');

(async () => {
  const apiKey = 'AIzaSyDb5rZt83FQZ6qOs8w5IO5OTDp3liwYfNw';
  const uid = 'verify-test-user';

  const customToken = await admin.auth().createCustomToken(uid);
  const signInRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });

  const signInData = await signInRes.json();
  if (!signInRes.ok || !signInData.idToken) {
    console.log('FIREBASE_SIGNIN_FAIL');
    console.log(JSON.stringify(signInData, null, 2));
    process.exit(1);
  }

  const token = signInData.idToken;
  const items = [
    ['SCREENINGS_GET', 'GET', `/api/screenings/${uid}`, null],
    ['SCREENINGS_POST', 'POST', '/api/screenings', { screeningType: 'mammogram', scheduledDate: '2026-10-15T10:00:00.000Z', notes: 'verification smoke test' }],
    ['AI_CHAT', 'POST', '/api/ai/chat', { message: 'مرحبا', history: [] }],
  ];

  for (const [label, method, path, body] of items) {
    const res = await fetch(`http://localhost:3000${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    console.log(label + ' STATUS=' + res.status);
    console.log(text.slice(0, 220));
  }
})();
