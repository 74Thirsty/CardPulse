const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/server');

async function request(server, path, options = {}) {
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch (error) {
    // ignore
  }
  return { status: response.status, data };
}

test('registration payload validation', async (t) => {
  const server = createApp().listen(0);
  t.after(() => server.close());

  const invalidResponse = await request(server, '/api/auth/register', {
    method: 'POST',
    body: { email: 'not-an-email', password: 'short', displayName: '' },
  });
  assert.strictEqual(invalidResponse.status, 400);
  assert.strictEqual(invalidResponse.data.error, 'INVALID_PAYLOAD');
});

test('authentication lifecycle', async (t) => {
  const server = createApp().listen(0);
  t.after(() => server.close());

  const email = `trainer-${Date.now()}@cardpulse.test`;
  const password = 'test-password';

  const registerResponse = await request(server, '/api/auth/register', {
    method: 'POST',
    body: { email, password, displayName: 'Test Trainer' },
  });
  assert.strictEqual(registerResponse.status, 201);
  assert.ok(registerResponse.data.user.id);

  const loginResponse = await request(server, '/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  assert.strictEqual(loginResponse.status, 200);
  assert.ok(loginResponse.data.token);

  const sessionResponse = await request(server, '/api/auth/session', {
    headers: { Authorization: `Bearer ${loginResponse.data.token}` },
  });
  assert.strictEqual(sessionResponse.status, 200);
  assert.strictEqual(sessionResponse.data.user.email, email);

  const logoutResponse = await request(server, '/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${loginResponse.data.token}` },
  });
  assert.strictEqual(logoutResponse.status, 200);

  const sessionAfterLogout = await request(server, '/api/auth/session', {
    headers: { Authorization: `Bearer ${loginResponse.data.token}` },
  });
  assert.strictEqual(sessionAfterLogout.status, 401);
});

test('card identification and valuation', async (t) => {
  const server = createApp().listen(0);
  t.after(() => server.close());

  const identification = await request(server, '/api/cards/identify', {
    method: 'POST',
    body: { imageText: 'charizard base' },
  });
  assert.strictEqual(identification.status, 200);
  assert.ok(identification.data.result.cardId);

  const valuation = await request(
    server,
    `/api/cards/${identification.data.result.cardId}/valuation`,
  );
  assert.strictEqual(valuation.status, 200);
  assert.ok(Array.isArray(valuation.data.history));
  assert.ok(
    typeof valuation.data.change30d === 'number' || valuation.data.change30d === null,
  );
  assert.ok(
    typeof valuation.data.change7d === 'number' || valuation.data.change7d === null,
  );
  assert.ok(
    Array.isArray(valuation.data.sources) || valuation.data.sources === undefined,
  );
});

test('marketplace listing creation requires auth', async (t) => {
  const server = createApp().listen(0);
  t.after(() => server.close());

  const { data: login } = await request(server, '/api/auth/login', {
    method: 'POST',
    body: { email: 'ash@cardpulse.app', password: 'password123' },
  });

  const invalid = await request(server, '/api/marketplace/listings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${login.token}` },
    body: {
      cardId: 'unknown-card',
      price: 10,
      currency: 'USD',
      condition: 'Test',
    },
  });
  assert.strictEqual(invalid.status, 404);

  const response = await request(server, '/api/marketplace/listings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${login.token}` },
    body: {
      cardId: 'card-pikachu-base',
      price: 38,
      currency: 'USD',
      condition: 'Near Mint',
      description: 'Sleeved and stored in binder.',
      photos: ['https://example.com/pikachu.jpg'],
    },
  });

  assert.strictEqual(response.status, 201);
  assert.strictEqual(response.data.listing.price, 38);
  assert.ok(response.data.listing.card);
  assert.ok(response.data.listing.valuation);

  const detail = await request(
    server,
    `/api/marketplace/listings/${response.data.listing.id}`,
  );
  assert.strictEqual(detail.status, 200);
  assert.strictEqual(detail.data.listing.id, response.data.listing.id);
  assert.ok(detail.data.listing.valuation);

  const listings = await request(server, '/api/marketplace/listings');
  assert.strictEqual(listings.status, 200);
  assert.ok(Array.isArray(listings.data.listings));
  assert.ok(listings.data.listings.every((item) => item.card));
});

test('forum posting and messaging flows', async (t) => {
  const server = createApp().listen(0);
  t.after(() => server.close());

  const { data: login } = await request(server, '/api/auth/login', {
    method: 'POST',
    body: { email: 'ash@cardpulse.app', password: 'password123' },
  });

  const postResponse = await request(server, '/api/forum/posts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${login.token}` },
    body: {
      categoryId: 'category-discussion',
      title: 'Favorite pulls this week',
      content: 'Share your hits!',
    },
  });
  assert.strictEqual(postResponse.status, 201);

  const threadResponse = await request(server, '/api/messages/threads', {
    method: 'POST',
    headers: { Authorization: `Bearer ${login.token}` },
    body: {
      sellerId: 'user-demo-2',
      listingId: 'listing-3',
      message: 'Interested! Can you share more photos?',
    },
  });
  assert.strictEqual(threadResponse.status, 201);
  assert.ok(threadResponse.data.thread.id);
  assert.ok(threadResponse.data.thread.listing);

  const sendResponse = await request(
    server,
    `/api/messages/threads/${threadResponse.data.thread.id}/messages`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${login.token}` },
      body: { content: 'Following up with an offer of $2,750.' },
    },
  );
  assert.strictEqual(sendResponse.status, 201);

  const detailResponse = await request(
    server,
    `/api/messages/threads/${threadResponse.data.thread.id}`,
    {
      headers: { Authorization: `Bearer ${login.token}` },
    },
  );
  assert.strictEqual(detailResponse.status, 200);
  assert.ok(detailResponse.data.thread.messages.length >= 2);

  const intruderEmail = `intruder-${Date.now()}@cardpulse.test`;
  const intruderRegister = await request(server, '/api/auth/register', {
    method: 'POST',
    body: { email: intruderEmail, password: 'strong-pass', displayName: 'Intruder' },
  });
  assert.strictEqual(intruderRegister.status, 201);
  const intruderLogin = await request(server, '/api/auth/login', {
    method: 'POST',
    body: { email: intruderEmail, password: 'strong-pass' },
  });
  assert.strictEqual(intruderLogin.status, 200);

  const unauthorized = await request(
    server,
    `/api/messages/threads/${threadResponse.data.thread.id}/messages`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${intruderLogin.data.token}` },
      body: { content: 'Sneaking into the thread.' },
    },
  );
  assert.strictEqual(unauthorized.status, 403);
});
