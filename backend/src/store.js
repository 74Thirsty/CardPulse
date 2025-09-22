const crypto = require('crypto');

const users = [
  {
    id: 'user-demo-1',
    email: 'ash@cardpulse.app',
    displayName: 'Ash Collector',
    passwordHash: '',
    createdAt: new Date().toISOString(),
    rating: 4.8,
    badges: ['founder', 'trusted-seller'],
  },
  {
    id: 'user-demo-2',
    email: 'mia@cardpulse.app',
    displayName: 'Mia Breaks',
    passwordHash: '',
    createdAt: new Date().toISOString(),
    rating: 4.9,
    badges: ['power-seller', 'verified'],
  },
];

const cards = [
  {
    id: 'card-pikachu-base',
    name: 'Pikachu',
    game: 'Pokémon',
    year: 1999,
    edition: 'Base Set',
    variant: 'Unlimited',
    setNumber: '58/102',
    imageUrl:
      'https://images.pokemontcg.io/base1/58_hires.png',
  },
  {
    id: 'card-charizard-holo',
    name: 'Charizard',
    game: 'Pokémon',
    year: 1999,
    edition: 'Base Set',
    variant: 'Holo',
    setNumber: '4/102',
    imageUrl:
      'https://images.pokemontcg.io/base1/4_hires.png',
  },
  {
    id: 'card-lebron-rc',
    name: 'LeBron James Rookie',
    game: 'NBA',
    year: 2003,
    edition: 'Topps Chrome',
    variant: 'Refractor',
    setNumber: '#111',
    imageUrl:
      'https://example.com/lebron-topps.png',
  },
  {
    id: 'card-jordan-fleer',
    name: 'Michael Jordan Rookie',
    game: 'NBA',
    year: 1986,
    edition: 'Fleer',
    variant: 'Base',
    setNumber: '57',
    imageUrl: 'https://example.com/jordan-fleer.png',
  },
  {
    id: 'card-brady-contenders',
    name: 'Tom Brady Rookie',
    game: 'NFL',
    year: 2000,
    edition: 'Playoff Contenders',
    variant: 'Autograph',
    setNumber: '144',
    imageUrl: 'https://example.com/brady-contenders.png',
  },
  {
    id: 'card-mike-trout-rc',
    name: 'Mike Trout Rookie',
    game: 'MLB',
    year: 2011,
    edition: 'Topps Update',
    variant: 'US175',
    setNumber: 'US175',
    imageUrl: 'https://example.com/trout-update.png',
  },
  {
    id: 'card-ohtani-heritage',
    name: 'Shohei Ohtani MVP',
    game: 'MLB',
    year: 2018,
    edition: 'Topps Heritage',
    variant: 'Action Image',
    setNumber: '17',
    imageUrl: 'https://example.com/ohtani-heritage.png',
  },
  {
    id: 'card-acuna-rc',
    name: 'Ronald Acuña Jr. Bat Down',
    game: 'MLB',
    year: 2018,
    edition: 'Topps Series 2',
    variant: 'Short Print',
    setNumber: '698',
    imageUrl: 'https://example.com/acuna-batdown.png',
  },
  {
    id: 'card-mahomes-contenders',
    name: 'Patrick Mahomes Rookie Ticket',
    game: 'NFL',
    year: 2017,
    edition: 'Panini Contenders',
    variant: 'Autograph',
    setNumber: '303',
    imageUrl: 'https://example.com/mahomes-contenders.png',
  },
];

const valuations = {
  'card-pikachu-base': {
    history: generateHistory(120, 20, 55),
    sources: [
      { provider: 'TCGPlayer', url: 'https://www.tcgplayer.com', confidence: 0.78 },
      { provider: 'eBay', url: 'https://www.ebay.com', confidence: 0.71 },
    ],
  },
  'card-charizard-holo': {
    history: generateHistory(120, 250, 480),
    sources: [
      { provider: 'TCGPlayer', url: 'https://www.tcgplayer.com', confidence: 0.8 },
      { provider: 'PWCC', url: 'https://www.pwccmarketplace.com', confidence: 0.74 },
    ],
  },
  'card-lebron-rc': {
    history: generateHistory(120, 1200, 3200),
    sources: [
      { provider: 'CardLadder', url: 'https://www.cardladder.com', confidence: 0.69 },
      { provider: 'Goldin', url: 'https://www.goldin.co', confidence: 0.73 },
    ],
  },
  'card-jordan-fleer': {
    history: generateHistory(120, 15000, 34000),
    sources: [
      { provider: 'Heritage Auctions', url: 'https://www.ha.com', confidence: 0.76 },
      { provider: 'eBay', url: 'https://www.ebay.com', confidence: 0.65 },
    ],
  },
  'card-brady-contenders': {
    history: generateHistory(120, 18000, 52000),
    sources: [
      { provider: 'PWCC', url: 'https://www.pwccmarketplace.com', confidence: 0.72 },
      { provider: 'Goldin', url: 'https://www.goldin.co', confidence: 0.7 },
    ],
  },
  'card-mike-trout-rc': {
    history: generateHistory(120, 650, 1800),
    sources: [
      { provider: 'CardLadder', url: 'https://www.cardladder.com', confidence: 0.68 },
      { provider: 'eBay', url: 'https://www.ebay.com', confidence: 0.6 },
    ],
  },
  'card-ohtani-heritage': {
    history: generateHistory(120, 140, 420),
    sources: [
      { provider: 'eBay', url: 'https://www.ebay.com', confidence: 0.65 },
      { provider: 'COMC', url: 'https://www.comc.com', confidence: 0.58 },
    ],
  },
  'card-acuna-rc': {
    history: generateHistory(120, 180, 520),
    sources: [
      { provider: 'StockX', url: 'https://stockx.com', confidence: 0.63 },
      { provider: 'eBay', url: 'https://www.ebay.com', confidence: 0.61 },
    ],
  },
  'card-mahomes-contenders': {
    history: generateHistory(120, 4500, 12500),
    sources: [
      { provider: 'Goldin', url: 'https://www.goldin.co', confidence: 0.74 },
      { provider: 'Heritage Auctions', url: 'https://www.ha.com', confidence: 0.7 },
    ],
  },
};

const listings = [
  {
    id: 'listing-1',
    cardId: 'card-pikachu-base',
    sellerId: 'user-demo-1',
    price: 35,
    currency: 'USD',
    condition: 'Near Mint',
    description: 'Pulled from a pack, stored sleeved. Includes penny sleeve.',
    photos: [
      'https://images.pokemontcg.io/base1/58.png',
    ],
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'listing-2',
    cardId: 'card-charizard-holo',
    sellerId: 'user-demo-1',
    price: 425,
    currency: 'USD',
    condition: 'Lightly Played',
    description: 'Comes with certificate from PSA. Light surface scratches.',
    photos: [
      'https://images.pokemontcg.io/base1/4.png',
    ],
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'listing-3',
    cardId: 'card-lebron-rc',
    sellerId: 'user-demo-2',
    price: 2850,
    currency: 'USD',
    condition: 'BGS 9.5',
    description: 'Freshly graded refractor with subgrades 9.5/9.5/9/9.5.',
    photos: ['https://example.com/lebron-topps.png'],
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'listing-4',
    cardId: 'card-mike-trout-rc',
    sellerId: 'user-demo-2',
    price: 1450,
    currency: 'USD',
    condition: 'PSA 9',
    description: 'Centered copy with clean corners. Includes slab sleeve.',
    photos: ['https://example.com/trout-update.png'],
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const forumCategories = [
  {
    id: 'category-sale',
    title: 'For Sale',
    description: 'List cards that you are ready to move today.',
  },
  {
    id: 'category-wanted',
    title: 'Wanted',
    description: 'Looking to buy a specific card? Post the details here.',
  },
  {
    id: 'category-trade',
    title: 'Trade',
    description: 'Set up trade offers with the community.',
  },
  {
    id: 'category-discussion',
    title: 'General Discussion',
    description: 'Talk strategy, grading, and hobby news.',
  },
];

const forumPosts = [
  {
    id: 'post-1',
    categoryId: 'category-sale',
    authorId: 'user-demo-1',
    title: 'Selling PSA 8 Charizard Holo',
    content:
      'Freshly graded, comes with certification. Looking for serious offers only.',
    attachments: [
      'https://images.pokemontcg.io/base1/4_hires.png',
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    replies: [
      {
        id: 'reply-1',
        authorId: 'user-demo-1',
        content: 'Price drop to $400 shipped with insurance.',
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
    ],
  },
  {
    id: 'post-2',
    categoryId: 'category-discussion',
    authorId: 'user-demo-2',
    title: 'How are you pricing modern MLB rookies?',
    content:
      'Seeing huge swings on Trout and Ohtani lately. Curious what data sources everyone is leaning on for comps.',
    attachments: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    replies: [
      {
        id: 'reply-2',
        authorId: 'user-demo-1',
        content: 'Mixing Goldin weekly auction summaries with eBay sold listings has worked best for me.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
    ],
  },
  {
    id: 'post-3',
    categoryId: 'category-wanted',
    authorId: 'user-demo-2',
    title: 'WTB Mahomes Contenders Auto PSA 9+',
    content: 'Budget up to $11k for a clean copy. Prefer PSA slab with subgrades if BGS.',
    attachments: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    replies: [],
  },
];

const messageThreads = [
  {
    id: 'thread-1',
    buyerId: 'user-demo-2',
    sellerId: 'user-demo-1',
    listingId: 'listing-1',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    messages: [
      {
        id: 'msg-1',
        senderId: 'user-demo-2',
        content: 'Hi Ash! Can you do $32 shipped on the Pikachu?',
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
      {
        id: 'msg-2',
        senderId: 'user-demo-1',
        content: 'Appreciate the offer. Could meet in the middle at $33?',
        createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      },
      {
        id: 'msg-3',
        senderId: 'user-demo-2',
        content: 'Deal. Please hold for me and I will pay this evening.',
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      },
    ],
  },
  {
    id: 'thread-2',
    buyerId: 'user-demo-1',
    sellerId: 'user-demo-2',
    listingId: 'listing-3',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    messages: [
      {
        id: 'msg-4',
        senderId: 'user-demo-1',
        content: 'Is the LeBron refractor still up? Looking for recent comps.',
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      },
      {
        id: 'msg-5',
        senderId: 'user-demo-2',
        content: 'Yes! Last sale was $2.8k on Goldin two nights ago.',
        createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      },
      {
        id: 'msg-6',
        senderId: 'user-demo-1',
        content: 'Perfect, I will submit an offer shortly.',
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      },
    ],
  },
];

function generateHistory(days, min, max) {
  const history = [];
  let current = randomBetween(min, max);
  for (let i = days; i >= 0; i -= 1) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    current = constrain(
      current + randomBetween(-0.1 * current, 0.1 * current),
      min,
      max,
    );
    history.push({
      date: date.toISOString().split('T')[0],
      average: Number(current.toFixed(2)),
      lowest: Number((current * 0.85).toFixed(2)),
      highest: Number((current * 1.15).toFixed(2)),
      volume: Math.floor(randomBetween(5, 60)),
    });
  }
  return history;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function constrain(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function bootstrapPasswords(password = 'password123') {
  users.forEach((user) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 15000, 64, 'sha512').toString('hex');
    user.passwordHash = `${salt}:${hash}`;
  });
}

bootstrapPasswords();

module.exports = {
  users,
  cards,
  valuations,
  listings,
  forumCategories,
  forumPosts,
  messageThreads,
};
