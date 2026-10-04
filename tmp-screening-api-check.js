const path = require('path');
const crypto = require('crypto');
const { createRequire } = require('module');

const root = __dirname;
process.chdir(root);
require('dotenv').config({ path: path.join(root, '.env') });
process.env.PORT = '0';

const localRequire = createRequire(path.join(root, 'server.js'));
const express = localRequire('express');
const originalListen = express.application.listen;
let httpServer;
express.application.listen = function (...args) {
  httpServer = originalListen.apply(this, args);
  return httpServer;
};

let uid;
let scheduledDate;
let admin;
let supabase;
const failures = [];
const check = (name, passed, detail = '') => {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}${detail ? ` ${detail}` : ''}`);
  if (!passed) failures.push(name);
};

async function request(base, method, url, body, idToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (idToken) headers.Authorization = `Bearer ${idToken}`;
  return fetch(`${base}${url}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
}

async function main() {
  try {
    require(path.join(root, 'server.js'));
    await new Promise((resolve, reject) => {
      httpServer.once('listening', resolve);
      httpServer.once('error', reject);
    });

    const base = `http://127.0.0.1:${httpServer.address().port}`;
    admin = require(path.join(root, 'config/firebaseAdmin'));
    supabase = require(path.join(root, 'config/supabase'));

    const date = new Date();
    date.setDate(date.getDate() + 1);
    scheduledDate = date.toISOString();
    const frontendBody = {
      screeningType: 'self_exam',
      scheduledDate,
      notes: '',
    };
    console.log(`ACTUAL_FRONTEND_BODY=${JSON.stringify(frontendBody)}`);
    check('DatePicker ISO date parses', !Number.isNaN(Date.parse(scheduledDate)));

    let response = await request(base, 'POST', '/api/screenings', {
      screeningType: 'screening', scheduledDate, notes: '',
    });
    check('Unauthenticated POST is rejected', response.status === 401, `HTTP ${response.status}`);

    uid = `sr${crypto.randomUUID().replaceAll('-', '')}`;
    const customToken = await admin.auth().createCustomToken(uid);
    const firebaseSource = require('fs').readFileSync(
      path.join(root, '..', 'octobre-rose-web', 'src', 'firebase.ts'), 'utf8',
    );
    const apiKey = firebaseSource.match(/apiKey:\s*'([^']+)'/)?.[1];
    if (!apiKey) throw new Error('Firebase web config unavailable');

    const exchange = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
        signal: AbortSignal.timeout(15000),
      },
    );
    check('Firebase test authentication succeeds', exchange.ok, `HTTP ${exchange.status}`);
    if (!exchange.ok) return;
    const idToken = (await exchange.json()).idToken;

    response = await request(base, 'POST', '/api/screenings', {
      screeningType: 'self_exam',
      scheduledDate,
      notes: '',
    }, idToken);
    const created = await response.json();
    console.log(`FLUTTER_STYLE_POST_HTTP=${response.status}`);
    check('Flutter-style authenticated POST succeeds', response.status === 201);
    check('Stored owner comes from the verified token', created.data?.userId === uid);

    if (response.status === 201 && created.data?.id) {
      const databaseResult = await supabase.from('screenings')
        .select('id,screening_type,scheduled_date')
        .eq('id', created.data.id)
        .maybeSingle();
      check('Inserted screening is present in database', !databaseResult.error && Boolean(databaseResult.data),
        databaseResult.error ? `code=${databaseResult.error.code || 'unknown'}` : 'row_exists');
      if (databaseResult.data) console.log(`DATABASE_TYPE=${databaseResult.data.screening_type}`);

      response = await request(base, 'GET', `/api/screenings/${uid}`, undefined, idToken);
      const ownResult = await response.json();
      check('Authenticated user can read own screenings', response.status === 200,
        `HTTP ${response.status}`);
      check('Own screening list contains created record',
        (ownResult.data || []).some((row) => row.id === created.data.id));
    }

    const invalidCases = [
      ['invalid_type', { screeningType: 'xray', scheduledDate, notes: '' }],
      ['invalid_date', { screeningType: 'screening', scheduledDate: 'not-a-date' }],
      ['notes_over_1000', { screeningType: 'screening', scheduledDate, notes: 'x'.repeat(1001) }],
      ['extra_field', { screeningType: 'screening', scheduledDate, id: 'unexpected' }],
      ['snake_case', { screening_type: 'screening', scheduled_date: scheduledDate }],
      ['type_date', { type: 'screening', date: scheduledDate }],
    ];
    for (const [name, body] of invalidCases) {
      response = await request(base, 'POST', '/api/screenings', body, idToken);
      const result = await response.json();
      const paths = (result.errors || []).map((issue) => issue.path);
      console.log(`CASE_${name.toUpperCase()}_HTTP=${response.status} ERROR_PATHS=${JSON.stringify(paths)}`);
      check(`${name} is rejected with validation detail`, response.status === 400 && paths.length > 0);
    }

    response = await request(base, 'GET', '/api/screenings/another-test-user', undefined, idToken);
    check('Cross-user read is rejected', response.status === 403, `HTTP ${response.status}`);

    console.log(`REGRESSION_RESULT=${failures.length ? 'FAIL' : 'PASS'}`);
    if (failures.length) console.log(`FAILED_CHECKS=${JSON.stringify(failures)}`);
  } catch (error) {
    console.log(`SCREENING_API_TEST_FAILED=${error?.name || 'Error'}`);
    failures.push('test execution');
  } finally {
    if (supabase && uid && scheduledDate) {
      try {
        const cleanup = await supabase.from('screenings').delete()
          .eq('user_id', uid).eq('scheduled_date', scheduledDate);
        console.log(`TEST_ROW_CLEANUP=${cleanup.error ? 'FAILED' : 'done'}`);
        if (cleanup.error) failures.push('test row cleanup');
      } catch {
        console.log('TEST_ROW_CLEANUP=FAILED');
        failures.push('test row cleanup');
      }
    }
    if (admin && uid) {
      try {
        await admin.auth().deleteUser(uid);
        console.log('TEST_FIREBASE_USER_CLEANUP=done');
      } catch {
        console.log('TEST_FIREBASE_USER_CLEANUP=FAILED');
        failures.push('test Firebase user cleanup');
      }
    }
    if (httpServer) httpServer.close();
    if (failures.length) process.exitCode = 1;
  }
}

main();
