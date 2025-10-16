const url = require('url');
const { getUserFromToken } = require('./auth');
const { identifyCard, searchCards } = require('./services/cards');
const { getValuation, getTrendingValuations } = require('./services/valuation');
const { listActiveListings, createListing, updateListingStatus } = require('./services/marketplace');
const { listCategories, listPosts, createPost } = require('./services/forum');
const { listThreads, createThread, appendMessage } = require('./services/messaging');
const { loginUser, registerUser } = require('./auth');

class Router {
  constructor() {
    this.routes = [];
  }

  register(method, path, handler, options = {}) {
    const tokens = path
      .split('/')
      .filter(Boolean);
    const params = tokens
      .map((token, index) => (token.startsWith(':') ? { key: token.slice(1), index } : null))
      .filter(Boolean);
    this.routes.push({ method: method.toUpperCase(), tokens, params, handler, options });
  }

  async handle(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method.toUpperCase();

    if (method === 'OPTIONS') {
      this.#applyCors(res);
      res.writeHead(204);
      res.end();
      return;
    }

    for (const route of this.routes) {
      if (route.method !== method) {
        continue;
      }
      const params = {};
      const requestTokens = parsedUrl.pathname.split('/').filter(Boolean);
      if (requestTokens.length !== route.tokens.length) {
        continue;
      }
      let matched = true;
      for (let i = 0; i < route.tokens.length; i += 1) {
        const expected = route.tokens[i];
        const actual = requestTokens[i];
        if (expected.startsWith(':')) {
          params[expected.slice(1)] = decodeURIComponent(actual);
        } else if (expected !== actual) {
          matched = false;
          break;
        }
      }
      if (!matched) {
        continue;
      }

      let body = null;
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
          body = await this.#parseBody(req);
        } catch (error) {
          this.#send(res, 400, { error: 'INVALID_JSON' });
          return;
        }
      }

      let user = null;
      if (route.options && route.options.auth) {
        const token = this.#extractToken(req.headers['authorization']);
        user = getUserFromToken(token);
        if (!user) {
          this.#send(res, 401, { error: 'UNAUTHORIZED' });
          return;
        }
      }

      try {
        const result = await route.handler({
          req,
          res,
          params,
          query: parsedUrl.query,
          body,
          user,
        });
        if (result && !res.writableEnded) {
          const { status = 200, data = null } = result;
          this.#send(res, status, data);
        }
      } catch (error) {
        console.error('Route handler failed', error);
        this.#send(res, 500, { error: 'SERVER_ERROR', message: error.message });
      }
      return;
    }

    this.#send(res, 404, { error: 'NOT_FOUND' });
  }

  async #parseBody(req) {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    if (chunks.length === 0) {
      return null;
    }
    const buffer = Buffer.concat(chunks);
    if (!buffer.length) {
      return null;
    }
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      return JSON.parse(buffer.toString('utf-8') || '{}');
    }
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const searchParams = new url.URLSearchParams(buffer.toString('utf-8'));
      const body = {};
      for (const [key, value] of searchParams.entries()) {
        body[key] = value;
      }
      return body;
    }
    return buffer.toString('utf-8');
  }

  #send(res, statusCode, data) {
    if (res.writableEnded) {
      return;
    }
    this.#applyCors(res);
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  #applyCors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  #extractToken(header) {
    if (!header) {
      return null;
    }
    const parts = header.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    }
    return header;
  }
}

const router = new Router();

router.register('POST', '/api/auth/register', async ({ body }) => {
  const { email, password, displayName } = body || {};
  if (!email || !password || !displayName) {
    return { status: 400, data: { error: 'INVALID_PAYLOAD' } };
  }
  const user = registerUser({ email, password, displayName });
  return { status: 201, data: { user } };
});

router.register('POST', '/api/auth/login', async ({ body }) => {
  const { email, password } = body || {};
  if (!email || !password) {
    return { status: 400, data: { error: 'INVALID_PAYLOAD' } };
  }
  const { token, user } = loginUser({ email, password });
  return { status: 200, data: { token, user } };
});

router.register('GET', '/api/cards/search', async ({ query }) => {
  const results = searchCards(query.q || '');
  return { status: 200, data: { results } };
});

router.register('POST', '/api/cards/identify', async ({ body }) => {
  const { imageText = '', hints = [] } = body || {};
  const result = identifyCard({ imageText, hints });
  return { status: 200, data: { result } };
});

router.register('GET', '/api/cards/:cardId/valuation', async ({ params }) => {
  const valuation = getValuation(params.cardId);
  if (!valuation) {
    return { status: 404, data: { error: 'CARD_NOT_FOUND' } };
  }
  return { status: 200, data: valuation };
});

router.register(
  'GET',
  '/api/marketplace/listings',
  async ({ query }) => {
    const { game, status, sellerId, minPrice, maxPrice, sortBy, sortOrder } = query;
    const parsedMinPrice = minPrice !== undefined ? Number.parseFloat(minPrice) : undefined;
    const parsedMaxPrice = maxPrice !== undefined ? Number.parseFloat(maxPrice) : undefined;
    const data = listActiveListings({
      game,
      status,
      sellerId,
      minPrice: Number.isFinite(parsedMinPrice) ? parsedMinPrice : undefined,
      maxPrice: Number.isFinite(parsedMaxPrice) ? parsedMaxPrice : undefined,
      sortBy,
      sortOrder,
    });
    return { status: 200, data: { listings: data } };
  },
  { auth: false },
);

router.register(
  'POST',
  '/api/marketplace/listings',
  async ({ body, user }) => {
    const { cardId, price, currency, condition, description, photos } = body || {};
    if (!cardId || typeof price !== 'number') {
      return { status: 400, data: { error: 'INVALID_PAYLOAD' } };
    }
    const listing = createListing({
      sellerId: user.id,
      cardId,
      price,
      currency,
      condition,
      description,
      photos,
    });
    return { status: 201, data: { listing } };
  },
  { auth: true },
);

router.register(
  'PATCH',
  '/api/marketplace/listings/:id',
  async ({ params, body, user }) => {
    const { status } = body || {};
    if (!status) {
      return { status: 400, data: { error: 'INVALID_PAYLOAD' } };
    }
    const listing = updateListingStatus({ listingId: params.id, sellerId: user.id, status });
    return { status: 200, data: { listing } };
  },
  { auth: true },
);

router.register('GET', '/api/forum/categories', async () => ({
  status: 200,
  data: { categories: listCategories() },
}));

router.register('GET', '/api/forum/posts', async ({ query }) => {
  const posts = listPosts({ categoryId: query.categoryId });
  return { status: 200, data: { posts } };
});

router.register(
  'POST',
  '/api/forum/posts',
  async ({ body, user }) => {
    const { categoryId, title, content, attachments } = body || {};
    if (!categoryId || !title || !content) {
      return { status: 400, data: { error: 'INVALID_PAYLOAD' } };
    }
    const post = createPost({
      authorId: user.id,
      categoryId,
      title,
      content,
      attachments,
    });
    return { status: 201, data: { post } };
  },
  { auth: true },
);

router.register(
  'GET',
  '/api/messages/threads',
  async ({ user }) => {
    const threads = listThreads(user.id);
    return { status: 200, data: { threads } };
  },
  { auth: true },
);

router.register(
  'POST',
  '/api/messages/threads',
  async ({ body, user }) => {
    const { sellerId, listingId, message } = body || {};
    if (!sellerId || !listingId) {
      return { status: 400, data: { error: 'INVALID_PAYLOAD' } };
    }
    const thread = createThread({ buyerId: user.id, sellerId, listingId, message });
    return { status: 201, data: { thread } };
  },
  { auth: true },
);

router.register(
  'POST',
  '/api/messages/threads/:id/messages',
  async ({ params, body, user }) => {
    const { content } = body || {};
    if (!content) {
      return { status: 400, data: { error: 'INVALID_PAYLOAD' } };
    }
    const message = appendMessage({ threadId: params.id, senderId: user.id, content });
    return { status: 201, data: { message } };
  },
  { auth: true },
);

router.register('GET', '/api/cards/trending', async ({ query }) => {
  const limit = query.limit !== undefined ? Number.parseInt(query.limit, 10) : undefined;
  const window = query.window !== undefined ? Number.parseInt(query.window, 10) : undefined;
  const results = getTrendingValuations({
    limit: Number.isFinite(limit) ? limit : undefined,
    window: Number.isFinite(window) ? window : undefined,
  });
  return { status: 200, data: { results } };
});

module.exports = {
  router,
};
