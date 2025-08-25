const express = require('express');
const { authenticateToken } = require('./auth');
const db = require('../config/database');
const router = express.Router();

// Middleware to check admin access
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get dashboard statistics
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await Promise.all([
      // Total users
      db.query('SELECT COUNT(*) as count FROM users'),
      // Total documents
      db.query('SELECT COUNT(*) as count FROM documents'),
      // Total forum posts
      db.query('SELECT COUNT(*) as count FROM forum_posts'),
      // Total document downloads
      db.query('SELECT SUM(download_count) as total FROM documents'),
      // Recent registrations (last 30 days)
      db.query("SELECT COUNT(*) as count FROM users WHERE created_at > NOW() - INTERVAL '30 days'"),
      // Popular documents (top 5)
      db.query(`
        SELECT title, download_count, category 
        FROM documents 
        ORDER BY download_count DESC 
        LIMIT 5
      `),
      // Recent forum activity
      db.query(`
        SELECT fp.title, fp.created_at, u.username as author, fc.name as category
        FROM forum_posts fp
        JOIN users u ON fp.author_id = u.id
        JOIN forum_categories fc ON fp.category_id = fc.id
        ORDER BY fp.created_at DESC
        LIMIT 5
      `),
      // Recent chat messages
      db.query(`
        SELECT username, message, created_at
        FROM chat_messages
        ORDER BY created_at DESC
        LIMIT 10
      `)
    ]);

    res.json({
      totalUsers: parseInt(stats[0].rows[0].count),
      totalDocuments: parseInt(stats[1].rows[0].count),
      totalPosts: parseInt(stats[2].rows[0].count),
      totalDownloads: parseInt(stats[3].rows[0].total || 0),
      recentRegistrations: parseInt(stats[4].rows[0].count),
      popularDocuments: stats[5].rows,
      recentPosts: stats[6].rows,
      recentChatMessages: stats[7].rows
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get all users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;
    
    let query = `
      SELECT id, username, email, is_admin, avatar_url, created_at,
             (SELECT COUNT(*) FROM forum_posts WHERE author_id = users.id) as post_count
      FROM users
    `;
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` WHERE username ILIKE $${paramCount} OR email ILIKE $${paramCount}`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users';
    const countParams = [];
    if (search) {
      countQuery += ' WHERE username ILIKE $1 OR email ILIKE $1';
      countParams.push(`%${search}%`);
    }

    const countResult = await db.query(countQuery, countParams);

    res.json({
      users: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user admin status
router.patch('/users/:userId/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;

    // Prevent removing admin status from self
    if (req.user.userId === parseInt(userId) && !isAdmin) {
      return res.status(400).json({ error: 'Cannot remove admin status from yourself' });
    }

    await db.query(
      'UPDATE users SET is_admin = $1 WHERE id = $2',
      [isAdmin, userId]
    );

    res.json({ 
      message: isAdmin ? 'User promoted to admin' : 'Admin status removed from user' 
    });
  } catch (error) {
    console.error('Error updating user admin status:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent deleting self
    if (req.user.userId === parseInt(userId)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await db.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all announcements
router.get('/announcements', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM announcements 
      ORDER BY created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Create announcement
router.post('/announcements', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, content, type } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const result = await db.query(`
      INSERT INTO announcements (title, content, type)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [title, content, type || 'info']);

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// Update announcement
router.put('/announcements/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, isActive } = req.body;

    const result = await db.query(`
      UPDATE announcements 
      SET title = COALESCE($1, title),
          content = COALESCE($2, content),
          type = COALESCE($3, type),
          is_active = COALESCE($4, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [title, content, type, isActive, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json({
      message: 'Announcement updated successfully',
      announcement: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// Delete announcement
router.delete('/announcements/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM announcements WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

// Get chat messages for moderation
router.get('/chat-messages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 100, offset = 0, room } = req.query;
    
    let query = `
      SELECT cm.*, u.email as user_email
      FROM chat_messages cm
      LEFT JOIN users u ON cm.user_id = u.id
    `;
    const params = [];
    let paramCount = 0;

    if (room) {
      paramCount++;
      query += ` WHERE cm.room = $${paramCount}`;
      params.push(room);
    }

    query += ` ORDER BY cm.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// Delete chat message
router.delete('/chat-messages/:messageId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    await db.query('DELETE FROM chat_messages WHERE id = $1', [messageId]);
    res.json({ message: 'Chat message deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat message:', error);
    res.status(500).json({ error: 'Failed to delete chat message' });
  }
});

// Get system statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await Promise.all([
      // User registrations over time (last 12 months)
      db.query(`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as registrations
        FROM users 
        WHERE created_at > NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
      `),
      // Document downloads over time (last 12 months)
      db.query(`
        SELECT 
          category,
          SUM(download_count) as total_downloads
        FROM documents 
        GROUP BY category
        ORDER BY total_downloads DESC
      `),
      // Forum activity
      db.query(`
        SELECT 
          fc.name as category,
          COUNT(fp.id) as posts
        FROM forum_categories fc
        LEFT JOIN forum_posts fp ON fc.id = fp.category_id
        GROUP BY fc.name
        ORDER BY posts DESC
      `)
    ]);

    res.json({
      userRegistrations: stats[0].rows,
      documentDownloads: stats[1].rows,
      forumActivity: stats[2].rows
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Failed to fetch system statistics' });
  }
});

module.exports = router;