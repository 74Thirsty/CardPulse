const crypto = require('crypto');
const { messageThreads } = require('../store');

function listThreads(userId) {
  return messageThreads.filter(
    (thread) => thread.buyerId === userId || thread.sellerId === userId,
  );
}

function createThread({ buyerId, sellerId, listingId, message }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const thread = {
    id,
    buyerId,
    sellerId,
    listingId,
    createdAt: now,
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
  return thread;
}

function appendMessage({ threadId, senderId, content }) {
  const thread = messageThreads.find((item) => item.id === threadId);
  if (!thread) {
    throw new Error('THREAD_NOT_FOUND');
  }
  const message = {
    id: crypto.randomUUID(),
    senderId,
    content,
    createdAt: new Date().toISOString(),
  };
  thread.messages.push(message);
  return message;
}

module.exports = {
  listThreads,
  createThread,
  appendMessage,
};
