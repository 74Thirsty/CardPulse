const crypto = require('crypto');
const { listings, cards } = require('../store');

function listActiveListings(filters = {}) {
  const {
    game,
    status = 'active',
    sellerId,
    minPrice,
    maxPrice,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
  } = filters;

  const normalizedSortBy = ['price', 'updatedAt'].includes(sortBy) ? sortBy : 'updatedAt';
  const normalizedSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

  return listings
    .filter((listing) => {
      if (status && listing.status !== status) {
        return false;
      }
      if (game) {
        const card = cards.find((item) => item.id === listing.cardId);
        if (!card || card.game.toLowerCase() !== game.toLowerCase()) {
          return false;
        }
      }
      if (sellerId && listing.sellerId !== sellerId) {
        return false;
      }
      if (typeof minPrice === 'number' && listing.price < minPrice) {
        return false;
      }
      if (typeof maxPrice === 'number' && listing.price > maxPrice) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (normalizedSortBy === 'price') {
        comparison = a.price - b.price;
      } else {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      return normalizedSortOrder === 'asc' ? comparison : -comparison;
    });
}

function createListing({ sellerId, cardId, price, currency, condition, description, photos }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const listing = {
    id,
    sellerId,
    cardId,
    price,
    currency: currency || 'USD',
    condition,
    description,
    photos: Array.isArray(photos) ? photos : [],
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
  listings.push(listing);
  return listing;
}

function updateListingStatus({ listingId, sellerId, status }) {
  const listing = listings.find((item) => item.id === listingId && item.sellerId === sellerId);
  if (!listing) {
    throw new Error('LISTING_NOT_FOUND');
  }
  listing.status = status;
  listing.updatedAt = new Date().toISOString();
  return listing;
}

module.exports = {
  listActiveListings,
  createListing,
  updateListingStatus,
};
