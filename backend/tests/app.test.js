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

test('card search tokenization and trending valuations', async (t) => {
  const server = createApp().listen(0);
  t.after(() => server.close());

  const searchResponse = await request(server, '/api/cards/search?q=charizard%20base');
  assert.strictEqual(searchResponse.status, 200);
  assert.ok(searchResponse.data.results.length > 0);
  assert.ok(
    searchResponse.data.results.some((card) => card.id === 'card-charizard-holo'),
    'Expected to find Charizard card in tokenized search results',
  );

  const trendingResponse = await request(server, '/api/cards/trending?limit=3&window=10');
  assert.strictEqual(trendingResponse.status, 200);
  assert.ok(Array.isArray(trendingResponse.data.results));
  assert.ok(trendingResponse.data.results.length <= 3);
  if (trendingResponse.data.results.length > 0) {
    const [first] = trendingResponse.data.results;
    assert.ok(typeof first.changePercent === 'number');
    assert.ok(first.sparkline.length > 0);
  }
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

test('marketplace filters by price range and sorts', async (t) => {
  const server = createApp().listen(0);
  t.after(() => server.close());

  const { data: login } = await request(server, '/api/auth/login', {
    method: 'POST',
    body: { email: 'ash@cardpulse.app', password: 'password123' },
  });

  const creationPayloads = [60, 160, 260].map((price) => ({
    method: 'POST',
    headers: { Authorization: `Bearer ${login.token}` },
    body: {
      cardId: 'card-pikachu-base',
      price,
      currency: 'USD',
      condition: 'Mint',
      description: `Test listing at $${price}`,
    },
  }));

  for (const payload of creationPayloads) {
    const createResponse = await request(server, '/api/marketplace/listings', payload);
    assert.strictEqual(createResponse.status, 201);
  }

  const filtered = await request(
    server,
    '/api/marketplace/listings?minPrice=150&maxPrice=265&sortBy=price&sortOrder=asc',
  );

  assert.strictEqual(filtered.status, 200);
  assert.ok(Array.isArray(filtered.data.listings));
  assert.ok(filtered.data.listings.length >= 2);
  const prices = filtered.data.listings.map((listing) => listing.price);
  assert.deepStrictEqual(prices.slice(0, 2), [160, 260]);
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
