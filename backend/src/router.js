const url = require('url');
const { getUserFromToken, loginUser, registerUser, logoutUser } = require('./auth');
const { identifyCard, searchCards, getCardById } = require('./services/cards');
const { getValuation } = require('./services/valuation');
const { listActiveListings, createListing, updateListing, getListingById } = require('./services/marketplace');
const { listCategories, listPosts, createPost } = require('./services/forum');
const { listThreads, createThread, appendMessage, getThreadById } = require('./services/messaging');
const {
  requireEmail,
  requirePassword,
  requireString,
  requireNumber,
  optionalArray,
  optionalString,
  requireEnum,
} = require('./utils/validation');
const { HttpError } = require('./utils/errors');

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
      let token = null;
      if (route.options && route.options.auth) {
        token = this.#extractToken(req.headers['authorization']);
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
          token,
        });
        if (result && !res.writableEnded) {
          const { status = 200, data = null } = result;
          this.#send(res, status, data);
        }
      } catch (error) {
        if (error instanceof HttpError) {
          this.#send(res, error.statusCode, {
            error: error.code,
            message: error.message,
            details: error.details,
          });
        } else {
          console.error('Route handler failed', error);
          this.#send(res, 500, { error: 'SERVER_ERROR', message: error.message });
        }
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
  const email = requireEmail(body?.email, 'email');
  const password = requirePassword(body?.password, 'password');
  const displayName = requireString(body?.displayName, 'displayName', {
    minLength: 2,
    maxLength: 60,
  });
  const user = registerUser({ email, password, displayName });
  return { status: 201, data: { user } };
});

router.register('POST', '/api/auth/login', async ({ body }) => {
  const email = requireEmail(body?.email, 'email');
  const password = requirePassword(body?.password, 'password');
  const { token, user } = loginUser({ email, password });
  return { status: 200, data: { token, user } };
});

router.register(
  'POST',
  '/api/auth/logout',
  async ({ token }) => {
    logoutUser(token);
    return { status: 200, data: { success: true } };
  },
  { auth: true },
);

router.register(
  'GET',
  '/api/auth/session',
  async ({ user }) => ({
    status: 200,
    data: { user },
  }),
  { auth: true },
);

router.register('GET', '/api/cards/search', async ({ query }) => {
  const results = searchCards(query.q || '');
  return { status: 200, data: { results } };
});

router.register('POST', '/api/cards/identify', async ({ body }) => {
  const imageText = optionalString(body?.imageText, 'imageText', { maxLength: 200 }) || '';
  const hints = optionalArray(body?.hints, 'hints', (item, index) =>
    requireString(String(item), `hints[${index}]`, { maxLength: 120 }),
  );
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
    const { game, status, sellerId } = query;
    const data = listActiveListings({ game, status, sellerId });
    return { status: 200, data: { listings: data } };
  },
  { auth: false },
);

router.register(
  'POST',
  '/api/marketplace/listings',
  async ({ body, user }) => {
    const cardId = requireString(body?.cardId, 'cardId', { minLength: 2 });
    if (!getCardById(cardId)) {
      throw new HttpError(404, 'CARD_NOT_FOUND', 'Card does not exist in catalog');
    }
    const price = requireNumber(body?.price, 'price', { min: 0 });
    const currency = requireString(body?.currency || 'USD', 'currency', {
      minLength: 3,
      maxLength: 3,
    }).toUpperCase();
    const condition = requireString(body?.condition || 'Unknown', 'condition', {
      minLength: 2,
      maxLength: 40,
    });
    const description = optionalString(body?.description, 'description', { maxLength: 500 }) || '';
    const photos = optionalArray(body?.photos, 'photos', (item, index) =>
      requireString(String(item), `photos[${index}]`, { maxLength: 400 }),
    );
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
    const patch = {};
    if (body?.status !== undefined) {
      patch.status = requireEnum(body.status, 'status', ['active', 'sold', 'archived']);
    }
    if (body?.price !== undefined) {
      patch.price = requireNumber(body.price, 'price', { min: 0 });
    }
    if (body?.description !== undefined) {
      patch.description = optionalString(body.description, 'description', { maxLength: 500 }) || '';
    }
    if (Object.keys(patch).length === 0) {
      throw new HttpError(400, 'INVALID_PAYLOAD', 'No valid fields provided');
    }
    const listing = updateListing({ listingId: params.id, sellerId: user.id, patch });
    return { status: 200, data: { listing } };
  },
  { auth: true },
);

router.register('GET', '/api/marketplace/listings/:id', async ({ params }) => {
  const listing = getListingById(params.id);
  if (!listing) {
    throw new HttpError(404, 'LISTING_NOT_FOUND', 'Listing not found');
  }
  return { status: 200, data: { listing } };
});

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
    const categoryId = requireString(body?.categoryId, 'categoryId', { minLength: 2 });
    const title = requireString(body?.title, 'title', { minLength: 3, maxLength: 120 });
    const content = requireString(body?.content, 'content', { minLength: 1, maxLength: 2000 });
    const attachments = optionalArray(body?.attachments, 'attachments', (item, index) =>
      requireString(String(item), `attachments[${index}]`, { maxLength: 400 }),
    );
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
    const sellerId = requireString(body?.sellerId, 'sellerId', { minLength: 2 });
    const listingId = requireString(body?.listingId, 'listingId', { minLength: 2 });
    const message = optionalString(body?.message, 'message', { maxLength: 1000 });
    const thread = createThread({ buyerId: user.id, sellerId, listingId, message });
    return { status: 201, data: { thread } };
  },
  { auth: true },
);

router.register(
  'POST',
  '/api/messages/threads/:id/messages',
  async ({ params, body, user }) => {
    const content = requireString(body?.content, 'content', { minLength: 1, maxLength: 1000 });
    const message = appendMessage({ threadId: params.id, senderId: user.id, content });
    return { status: 201, data: { message } };
  },
  { auth: true },
);

router.register(
  'GET',
  '/api/messages/threads/:id',
  async ({ params, user }) => {
    const thread = getThreadById(params.id, user.id);
    return { status: 200, data: { thread } };
  },
  { auth: true },
);

module.exports = {
  router,
};
