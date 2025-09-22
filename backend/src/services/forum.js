const crypto = require('crypto');
const { forumCategories, forumPosts } = require('../store');

function listCategories() {
  return forumCategories;
}

function listPosts({ categoryId }) {
  if (!categoryId) {
    return forumPosts;
  }
  return forumPosts.filter((post) => post.categoryId === categoryId);
}

function createPost({ authorId, categoryId, title, content, attachments }) {
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
