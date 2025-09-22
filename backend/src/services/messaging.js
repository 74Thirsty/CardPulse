const crypto = require('crypto');
const { messageThreads } = require('../store');
const { HttpError } = require('../utils/errors');
const { getListingById } = require('./marketplace');

function listThreads(userId) {
  return messageThreads
    .filter((thread) => thread.buyerId === userId || thread.sellerId === userId)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .map((thread) => hydrateThread(thread));
}

function getThreadById(threadId, userId) {
  const thread = messageThreads.find((item) => item.id === threadId);
  if (!thread) {
    throw new HttpError(404, 'THREAD_NOT_FOUND', 'Thread not found');
  }
  if (!isParticipant(thread, userId)) {
    throw new HttpError(403, 'FORBIDDEN', 'You are not a participant in this thread');
  }
  return hydrateThread(thread);
}

function createThread({ buyerId, sellerId, listingId, message }) {
  if (buyerId === sellerId) {
    throw new HttpError(400, 'INVALID_PARTICIPANTS', 'Cannot message yourself');
  }
  const listing = getListingById(listingId);
  if (!listing) {
    throw new HttpError(404, 'LISTING_NOT_FOUND', 'Listing not found');
  }
  if (listing.sellerId !== sellerId) {
    throw new HttpError(400, 'INVALID_SELLER', 'Seller does not own the listing');
  }
  const existing = messageThreads.find(
    (thread) =>
      thread.listingId === listingId &&
      thread.buyerId === buyerId &&
      thread.sellerId === sellerId,
  );
  const now = new Date().toISOString();
  if (existing) {
    if (message) {
      const newMessage = {
        id: crypto.randomUUID(),
        senderId: buyerId,
        content: message,
        createdAt: now,
      };
      existing.messages.push(newMessage);
      existing.updatedAt = now;
    }
    return hydrateThread(existing);
  }
  const thread = {
    id: crypto.randomUUID(),
    buyerId,
    sellerId,
    listingId,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
  if (message) {
    thread.messages.push({
      id: crypto.randomUUID(),
      senderId: buyerId,
      content: message,
      createdAt: now,
    });
  }
  messageThreads.unshift(thread);
  return hydrateThread(thread);
}

function appendMessage({ threadId, senderId, content }) {
  const thread = messageThreads.find((item) => item.id === threadId);
  if (!thread) {
    throw new HttpError(404, 'THREAD_NOT_FOUND', 'Thread not found');
  }
  if (!isParticipant(thread, senderId)) {
    throw new HttpError(403, 'FORBIDDEN', 'You are not a participant in this thread');
  }
  const message = {
    id: crypto.randomUUID(),
    senderId,
    content,
    createdAt: new Date().toISOString(),
  };
  thread.messages.push(message);
  thread.updatedAt = message.createdAt;
  return message;
}

function hydrateThread(thread) {
  const listing = getListingById(thread.listingId);
  return {
    ...thread,
    messages: thread.messages.map((item) => ({ ...item })),
    listing,
  };
}

function isParticipant(thread, userId) {
  return thread.buyerId === userId || thread.sellerId === userId;
}

module.exports = {
  listThreads,
  createThread,
  appendMessage,
  getThreadById,
};
