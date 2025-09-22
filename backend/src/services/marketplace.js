const crypto = require('crypto');
const { listings } = require('../store');
const { HttpError } = require('../utils/errors');
const { getCardById } = require('./cards');
const { getValuation } = require('./valuation');

function listActiveListings(filters = {}) {
  const { game, status = 'active', sellerId } = filters;
  return listings
    .filter((listing) => {
      if (status && listing.status !== status) {
        return false;
      }
      if (game) {
        const card = getCardById(listing.cardId);
        if (!card || card.game.toLowerCase() !== game.toLowerCase()) {
          return false;
        }
      }
      if (sellerId && listing.sellerId !== sellerId) {
        return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .map((listing) => hydrateListing(listing));
}

function createListing({ sellerId, cardId, price, currency, condition, description, photos }) {
  const card = getCardById(cardId);
  if (!card) {
    throw new HttpError(404, 'CARD_NOT_FOUND', 'Card does not exist');
  }
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
  return hydrateListing(listing);
}

function updateListing({ listingId, sellerId, patch }) {
  const listing = listings.find((item) => item.id === listingId && item.sellerId === sellerId);
  if (!listing) {
    throw new HttpError(404, 'LISTING_NOT_FOUND', 'Listing not found');
  }
  if (patch.status) {
    listing.status = patch.status;
  }
  if (patch.price !== undefined) {
    listing.price = patch.price;
  }
  if (patch.description !== undefined) {
    listing.description = patch.description;
  }
  listing.updatedAt = new Date().toISOString();
  return hydrateListing(listing);
}

function getListingById(id) {
  const listing = listings.find((item) => item.id === id);
  if (!listing) {
    return null;
  }
  return hydrateListing(listing);
}

function hydrateListing(listing) {
  const card = getCardById(listing.cardId);
  const valuation = getValuation(listing.cardId);
  return {
    ...listing,
    card: card ? { ...card } : null,
    valuation,
  };
}

module.exports = {
  listActiveListings,
  createListing,
  updateListing,
  getListingById,
};
