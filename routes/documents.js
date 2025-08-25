const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken } = require('./auth');
const db = require('../config/database');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'));
    }
  }
});

// Ensure uploads directory exists
async function ensureUploadDir() {
  try {
    await fs.mkdir('uploads/documents', { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
  }
}
ensureUploadDir();

// Get all documents with optional filtering
router.get('/', async (req, res) => {
  try {
    const { category, search, featured, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT id, title, description, category, file_name, file_size, 
             download_count, tags, is_featured, created_at, updated_at
      FROM documents
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      query += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount} OR $${paramCount} = ANY(tags))`;
      params.push(`%${search}%`);
    }

    if (featured === 'true') {
      query += ` AND is_featured = true`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM documents WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (category) {
      countParamCount++;
      countQuery += ` AND category = $${countParamCount}`;
      countParams.push(category);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (title ILIKE $${countParamCount} OR description ILIKE $${countParamCount} OR $${countParamCount} = ANY(tags))`;
      countParams.push(`%${search}%`);
    }

    if (featured === 'true') {
      countQuery += ` AND is_featured = true`;
    }

    const countResult = await db.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      documents: result.rows,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasNext: (parseInt(offset) + parseInt(limit)) < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get document categories
router.get('/categories', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT category, COUNT(*) as count 
      FROM documents 
      GROUP BY category 
      ORDER BY count DESC, category ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get single document by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM documents WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Download document
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get document info
    const result = await db.query(
      'SELECT file_path, file_name, title FROM documents WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = result.rows[0];

    // If document has a file, serve it
    if (document.file_path) {
      const filePath = path.join(__dirname, '..', document.file_path);
      
      try {
        await fs.access(filePath);
        
        // Increment download count
        await db.query(
          'UPDATE documents SET download_count = download_count + 1 WHERE id = $1',
          [id]
        );

        res.download(filePath, document.file_name || document.title + '.pdf');
      } catch (fileError) {
        return res.status(404).json({ error: 'File not found on server' });
      }
    } else {
      // Generate a simple PDF placeholder for documents without files
      res.json({ 
        message: 'Document template available',
        title: document.title,
        downloadUrl: `/api/documents/${id}/template`
      });
    }
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// Get document template (for documents without actual files)
router.get('/:id/template', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT title, description, category FROM documents WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = result.rows[0];
    
    // Increment download count
    await db.query(
      'UPDATE documents SET download_count = download_count + 1 WHERE id = $1',
      [id]
    );

    // Return HTML template that can be printed
    const template = `
<!DOCTYPE html>
<html>
<head>
    <title>${document.title}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; color: #4F46E5; }
        .category { color: #666; margin-top: 10px; }
        .content { margin: 30px 0; }
        .footer { margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #666; }
        .form-field { margin: 20px 0; padding: 10px; border: 1px solid #ddd; background: #f9f9f9; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${document.title}</div>
        <div class="category">Category: ${document.category}</div>
    </div>
    
    <div class="content">
        <p><strong>Description:</strong> ${document.description}</p>
        
        <div class="form-field">
            <strong>Instructions:</strong><br>
            This is a template for ${document.title}. Please fill in the required information below and submit to the appropriate office.
        </div>
        
        <div class="form-field">
            <strong>Applicant Information:</strong><br>
            Name: _________________________________<br><br>
            Address: _________________________________<br><br>
            Contact Number: _________________________________<br><br>
            Email: _________________________________<br>
        </div>
        
        <div class="form-field">
            <strong>Purpose of Request:</strong><br>
            _________________________________________<br>
            _________________________________________<br>
            _________________________________________<br>
        </div>
        
        <div class="form-field">
            <strong>Date of Application:</strong> _______________<br><br>
            <strong>Signature:</strong> ______________________________<br>
        </div>
    </div>
    
    <div class="footer">
        <p>Generated from AletheianDocs - Your trusted source for Philippine government forms.</p>
        <p>For more information, visit our website or contact support.</p>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="${document.title}.html"`);
    res.send(template);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

// Upload new document (admin only)
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { title, description, category, tags, isFeatured } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required' });
    }

    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    const filePath = req.file ? `uploads/documents/${req.file.filename}` : null;
    const fileName = req.file ? req.file.originalname : null;
    const fileSize = req.file ? req.file.size : null;

    const result = await db.query(`
      INSERT INTO documents (title, description, category, file_path, file_name, file_size, tags, is_featured)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [title, description, category, filePath, fileName, fileSize, tagsArray, isFeatured === 'true']);

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: result.rows[0]
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Update document (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { title, description, category, tags, isFeatured } = req.body;

    const tagsArray = tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : null;

    const result = await db.query(`
      UPDATE documents 
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          category = COALESCE($3, category),
          tags = COALESCE($4, tags),
          is_featured = COALESCE($5, is_featured),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [title, description, category, tagsArray, isFeatured, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
      message: 'Document updated successfully',
      document: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Delete document (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    // Get document info first to delete file
    const docResult = await db.query('SELECT file_path FROM documents WHERE id = $1', [id]);
    
    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = docResult.rows[0];

    // Delete from database
    await db.query('DELETE FROM documents WHERE id = $1', [id]);

    // Delete file if exists
    if (document.file_path) {
      try {
        const filePath = path.join(__dirname, '..', document.file_path);
        await fs.unlink(filePath);
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
        // Continue even if file deletion fails
      }
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;