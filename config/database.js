const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
pool.on('connect', () => {
  console.log('📦 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

// Initialize database tables
async function initializeTables() {
  const client = await pool.connect();
  
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        avatar_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        file_path VARCHAR(500),
        file_name VARCHAR(255),
        file_size INTEGER,
        download_count INTEGER DEFAULT 0,
        tags TEXT[],
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Forum categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS forum_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#4F46E5',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Forum posts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS forum_posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category_id INTEGER REFERENCES forum_categories(id),
        author_id INTEGER REFERENCES users(id),
        is_pinned BOOLEAN DEFAULT FALSE,
        is_locked BOOLEAN DEFAULT FALSE,
        view_count INTEGER DEFAULT 0,
        reply_count INTEGER DEFAULT 0,
        last_reply_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Forum replies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS forum_replies (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        post_id INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE,
        author_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Chat messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        username VARCHAR(50),
        message TEXT NOT NULL,
        room VARCHAR(50) DEFAULT 'general',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Announcements table
    await client.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(20) DEFAULT 'info',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default admin user (password: admin123)
    await client.query(`
      INSERT INTO users (username, email, password_hash, is_admin)
      SELECT 'admin', 'admin@aletheiandocs.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8lXpPTbQXaHfCr4qXBhUn7vL9vq4KS', true
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin')
    `);

    // Insert default forum categories
    await client.query(`
      INSERT INTO forum_categories (name, description, color)
      SELECT * FROM (VALUES 
        ('General Discussion', 'General topics and discussions', '#4F46E5'),
        ('Document Requests', 'Request for specific documents or forms', '#059669'),
        ('Technical Support', 'Get help with website issues', '#DC2626'),
        ('Suggestions', 'Share your ideas for improvement', '#7C3AED')
      ) AS v(name, description, color)
      WHERE NOT EXISTS (SELECT 1 FROM forum_categories WHERE name = v.name)
    `);

    // Insert sample documents
    await client.query(`
      INSERT INTO documents (title, description, category, tags)
      SELECT * FROM (VALUES 
        ('Birth Certificate Application', 'Official form for requesting birth certificate', 'Civil Registry', ARRAY['birth', 'certificate', 'civil']),
        ('Marriage Certificate Request', 'Form for marriage certificate requests', 'Civil Registry', ARRAY['marriage', 'certificate', 'civil']),
        ('Barangay Clearance Form', 'Community clearance application', 'Barangay Documents', ARRAY['clearance', 'barangay', 'community']),
        ('Business Permit Application', 'Application for business operating permit', 'Business Documents', ARRAY['business', 'permit', 'license']),
        ('ID Replacement Form', 'Form for replacing lost identification cards', 'ID Documents', ARRAY['id', 'replacement', 'identification'])
      ) AS v(title, description, category, tags)
      WHERE NOT EXISTS (SELECT 1 FROM documents WHERE title = v.title)
    `);

    // Insert sample announcement
    await client.query(`
      INSERT INTO announcements (title, content, type)
      SELECT 'Welcome to AletheianDocs!', 'Your trusted source for Philippine government forms and documents. Download, print, and submit with confidence.', 'info'
      WHERE NOT EXISTS (SELECT 1 FROM announcements WHERE title = 'Welcome to AletheianDocs!')
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  initializeTables
};