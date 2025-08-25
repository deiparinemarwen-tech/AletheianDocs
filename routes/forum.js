const express = require('express');
const { authenticateToken } = require('./auth');
const db = require('../config/database');
const router = express.Router();

// Get all forum categories
router.get('/categories', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT fc.*, 
             COUNT(fp.id) as post_count,
             MAX(fp.last_reply_at) as last_activity
      FROM forum_categories fc
      LEFT JOIN forum_posts fp ON fc.id = fp.category_id
      GROUP BY fc.id, fc.name, fc.description, fc.color, fc.created_at
      ORDER BY fc.created_at ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching forum categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get posts in a category
router.get('/categories/:categoryId/posts', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    const result = await db.query(`
      SELECT fp.id, fp.title, fp.content, fp.is_pinned, fp.is_locked, 
             fp.view_count, fp.reply_count, fp.last_reply_at, fp.created_at,
             u.username as author_username, u.avatar_url as author_avatar,
             fc.name as category_name, fc.color as category_color
      FROM forum_posts fp
      JOIN users u ON fp.author_id = u.id
      JOIN forum_categories fc ON fp.category_id = fc.id
      WHERE fp.category_id = $1
      ORDER BY fp.is_pinned DESC, fp.last_reply_at DESC
      LIMIT $2 OFFSET $3
    `, [categoryId, parseInt(limit), parseInt(offset)]);

    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) FROM forum_posts WHERE category_id = $1',
      [categoryId]
    );

    res.json({
      posts: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get all recent posts (for homepage)
router.get('/posts/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const result = await db.query(`
      SELECT fp.id, fp.title, fp.content, fp.view_count, fp.reply_count, 
             fp.last_reply_at, fp.created_at,
             u.username as author_username, u.avatar_url as author_avatar,
             fc.name as category_name, fc.color as category_color
      FROM forum_posts fp
      JOIN users u ON fp.author_id = u.id
      JOIN forum_categories fc ON fp.category_id = fc.id
      ORDER BY fp.created_at DESC
      LIMIT $1
    `, [parseInt(limit)]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching recent posts:', error);
    res.status(500).json({ error: 'Failed to fetch recent posts' });
  }
});

// Get single post with replies
router.get('/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Get post details
    const postResult = await db.query(`
      SELECT fp.*, u.username as author_username, u.avatar_url as author_avatar,
             fc.name as category_name, fc.color as category_color
      FROM forum_posts fp
      JOIN users u ON fp.author_id = u.id
      JOIN forum_categories fc ON fp.category_id = fc.id
      WHERE fp.id = $1
    `, [postId]);

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Get replies
    const repliesResult = await db.query(`
      SELECT fr.*, u.username as author_username, u.avatar_url as author_avatar
      FROM forum_replies fr
      JOIN users u ON fr.author_id = u.id
      WHERE fr.post_id = $1
      ORDER BY fr.created_at ASC
    `, [postId]);

    // Increment view count
    await db.query(
      'UPDATE forum_posts SET view_count = view_count + 1 WHERE id = $1',
      [postId]
    );

    res.json({
      post: postResult.rows[0],
      replies: repliesResult.rows
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create new post (authenticated users only)
router.post('/posts', authenticateToken, async (req, res) => {
  try {
    const { title, content, categoryId } = req.body;

    if (!title || !content || !categoryId) {
      return res.status(400).json({ error: 'Title, content, and category are required' });
    }

    const result = await db.query(`
      INSERT INTO forum_posts (title, content, category_id, author_id, last_reply_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING *
    `, [title, content, categoryId, req.user.userId]);

    const post = result.rows[0];

    // Get full post details with author info
    const fullPostResult = await db.query(`
      SELECT fp.*, u.username as author_username, u.avatar_url as author_avatar,
             fc.name as category_name, fc.color as category_color
      FROM forum_posts fp
      JOIN users u ON fp.author_id = u.id
      JOIN forum_categories fc ON fp.category_id = fc.id
      WHERE fp.id = $1
    `, [post.id]);

    res.status(201).json({
      message: 'Post created successfully',
      post: fullPostResult.rows[0]
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Create reply to post (authenticated users only)
router.post('/posts/:postId/replies', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Check if post exists and is not locked
    const postCheck = await db.query(
      'SELECT is_locked FROM forum_posts WHERE id = $1',
      [postId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (postCheck.rows[0].is_locked) {
      return res.status(403).json({ error: 'Post is locked' });
    }

    // Create reply
    const replyResult = await db.query(`
      INSERT INTO forum_replies (content, post_id, author_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [content, postId, req.user.userId]);

    // Update post reply count and last reply time
    await db.query(`
      UPDATE forum_posts 
      SET reply_count = reply_count + 1, 
          last_reply_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `, [postId]);

    // Get full reply details with author info
    const fullReplyResult = await db.query(`
      SELECT fr.*, u.username as author_username, u.avatar_url as author_avatar
      FROM forum_replies fr
      JOIN users u ON fr.author_id = u.id
      WHERE fr.id = $1
    `, [replyResult.rows[0].id]);

    res.status(201).json({
      message: 'Reply created successfully',
      reply: fullReplyResult.rows[0]
    });
  } catch (error) {
    console.error('Error creating reply:', error);
    res.status(500).json({ error: 'Failed to create reply' });
  }
});

// Update post (author or admin only)
router.put('/posts/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content } = req.body;

    // Check if user owns the post or is admin
    const postCheck = await db.query(
      'SELECT author_id FROM forum_posts WHERE id = $1',
      [postId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const isOwner = postCheck.rows[0].author_id === req.user.userId;
    const isAdmin = req.user.isAdmin;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const result = await db.query(`
      UPDATE forum_posts 
      SET title = COALESCE($1, title),
          content = COALESCE($2, content),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [title, content, postId]);

    res.json({
      message: 'Post updated successfully',
      post: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete post (author or admin only)
router.delete('/posts/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    // Check if user owns the post or is admin
    const postCheck = await db.query(
      'SELECT author_id FROM forum_posts WHERE id = $1',
      [postId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const isOwner = postCheck.rows[0].author_id === req.user.userId;
    const isAdmin = req.user.isAdmin;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Delete post (replies will be cascade deleted)
    await db.query('DELETE FROM forum_posts WHERE id = $1', [postId]);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Pin/unpin post (admin only)
router.patch('/posts/:postId/pin', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { postId } = req.params;
    const { isPinned } = req.body;

    await db.query(
      'UPDATE forum_posts SET is_pinned = $1 WHERE id = $2',
      [isPinned, postId]
    );

    res.json({ 
      message: isPinned ? 'Post pinned successfully' : 'Post unpinned successfully' 
    });
  } catch (error) {
    console.error('Error pinning/unpinning post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Lock/unlock post (admin only)
router.patch('/posts/:postId/lock', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { postId } = req.params;
    const { isLocked } = req.body;

    await db.query(
      'UPDATE forum_posts SET is_locked = $1 WHERE id = $2',
      [isLocked, postId]
    );

    res.json({ 
      message: isLocked ? 'Post locked successfully' : 'Post unlocked successfully' 
    });
  } catch (error) {
    console.error('Error locking/unlocking post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

module.exports = router;