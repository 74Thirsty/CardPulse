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
});

test('marketplace listing creation requires auth', async (t) => {
  const server = createApp().listen(0);
  t.after(() => server.close());

  const { data: login } = await request(server, '/api/auth/login', {
    method: 'POST',
    body: { email: 'ash@cardpulse.app', password: 'password123' },
  });

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
      sellerId: 'user-demo-1',
      listingId: 'listing-1',
      message: 'Interested! Can you share more photos?',
    },
  });
  assert.strictEqual(threadResponse.status, 201);
  assert.ok(threadResponse.data.thread.id);
});
