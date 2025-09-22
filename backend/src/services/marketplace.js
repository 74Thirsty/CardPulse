const crypto = require('crypto');
const { listings, cards } = require('../store');

function listActiveListings(filters = {}) {
  const { game, status = 'active', sellerId } = filters;
  return listings.filter((listing) => {
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
    return true;
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
