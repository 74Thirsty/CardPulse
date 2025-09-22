const crypto = require('crypto');
const { forumCategories, forumPosts } = require('../store');
const { HttpError } = require('../utils/errors');

function listCategories() {
  return forumCategories;
}

function listPosts({ categoryId }) {
  const posts = categoryId
    ? forumPosts.filter((post) => post.categoryId === categoryId)
    : forumPosts;
  return [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function createPost({ authorId, categoryId, title, content, attachments }) {
  const category = forumCategories.find((item) => item.id === categoryId);
  if (!category) {
    throw new HttpError(404, 'CATEGORY_NOT_FOUND', 'Forum category not found');
  }
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const post = {
    id,
    authorId,
    categoryId,
    title,
    content,
    attachments: Array.isArray(attachments) ? attachments : [],
    replies: [],
    createdAt: now,
    updatedAt: now,
  };
  forumPosts.unshift(post);
  return post;
}

module.exports = {
  listCategories,
  listPosts,
  createPost,
};
