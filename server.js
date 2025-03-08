const express = require('express');
const path = require('path');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const chokidar = require('chokidar');
const browserSync = require('browser-sync');
const bcrypt = require('bcrypt');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Set up express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 3600000 } // 1 hour
}));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Use data directory for persistent storage on Render
        const uploadDir = process.env.NODE_ENV === 'production' ? 
            path.join(process.env.RENDER_MOUNT_DIR || '/opt/render/project/src/data', 'uploads') : 
            path.join(__dirname, 'uploads');
            
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Set up file watcher for automatic database updates
const uploadsDir = process.env.NODE_ENV === 'production' ? 
    path.join(process.env.RENDER_MOUNT_DIR || '/opt/render/project/src/data', 'uploads') : 
    path.join(__dirname, 'uploads');
// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Function to check if a file is already in the database
function isFileInDatabase(filename) {
    return new Promise((resolve, reject) => {
        db.get('SELECT id FROM documents WHERE filename = ?', [filename], (err, row) => {
            if (err) reject(err);
            resolve(!!row); // Convert to boolean
        });
    });
}

// Function to add a file to the database
function addFileToDatabase(filepath, filename) {
    return new Promise(async (resolve, reject) => {
        try {
            // Check if file already exists in database
            const exists = await isFileInDatabase(filename);
            if (exists) {
                console.log(`File ${filename} already in database, skipping`);
                return resolve(false);
            }
            
            // Get file stats
            const stats = fs.statSync(filepath);
            const filesize = stats.size;
            const mimetype = path.extname(filename).toLowerCase();
            
            // Add to database with minimal info (can be edited later)
            const query = `INSERT INTO documents 
                          (title, description, filename, filepath, filetype, filesize, category, user_id) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            
            db.run(query, [
                filename, // Use filename as title initially
                'Auto-imported document', 
                filename, 
                filepath, 
                mimetype, 
                filesize, 
                'uncategorized', // Default category
                req.session.userId // Add user_id
            ], function(err) {
                if (err) return reject(err);
                console.log(`Auto-imported document: ${filename} (ID: ${this.lastID})`);
                resolve(true);
            });
        } catch (error) {
            reject(error);
        }
    });
}

// Function to scan uploads directory and update database
async function scanUploadsDirectory() {
    try {
        console.log('Scanning uploads directory for new files...');
        const files = fs.readdirSync(uploadsDir);
        let newFilesCount = 0;
        
        for (const file of files) {
            const filepath = path.join(uploadsDir, file);
            
            // Skip directories and non-files
            if (!fs.statSync(filepath).isFile()) continue;
            
            try {
                const added = await addFileToDatabase(filepath, file);
                if (added) newFilesCount++;
            } catch (error) {
                console.error(`Error adding file ${file} to database:`, error);
            }
        }
        
        console.log(`Scan complete. Added ${newFilesCount} new files to database.`);
    } catch (error) {
        console.error('Error scanning uploads directory:', error);
    }
}

// Scan on server startup
scanUploadsDirectory();

// Set up file watcher to monitor uploads directory
const watcher = chokidar.watch(uploadsDir, {
    ignored: /(^|[\/\\])\../,  // Ignore dot files
    persistent: true
});

// Watch for new files and add them to the database
watcher.on('add', async (filepath) => {
    try {
        const filename = path.basename(filepath);
        console.log(`New file detected: ${filename}`);
        
        // Wait a moment to ensure the file is fully written
        setTimeout(async () => {
            try {
                await addFileToDatabase(filepath, filename);
            } catch (error) {
                console.error(`Error adding new file ${filename} to database:`, error);
            }
        }, 1000); // 1 second delay
    } catch (error) {
        console.error('Error processing new file:', error);
    }
});

// Admin credentials - in a production environment, these should be stored securely
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'portfolio2025';

// Middleware to check if user is authenticated as admin
const isAdmin = (req, res, next) => {
    if (req.session.isAdmin) {
        return next();
    }
    res.redirect('/admin/login');
};

// Middleware to check if any user is authenticated (admin or regular user)
const isAuthenticated = (req, res, next) => {
    if (req.session.userId || req.session.isAdmin) {
        return next();
    }
    res.redirect('/user/login');
};

// Middleware to load authenticated user in every request
app.use(async (req, res, next) => {
    // Make auth state available to templates
    res.locals.isAdmin = req.session.isAdmin || false;

    // Load user data if userId exists in session
    if (req.session.userId) {
        try {
            db.get('SELECT id, username, email, name, join_date FROM users WHERE id = ?', [req.session.userId], (err, user) => {
                if (err) {
                    console.error('Error fetching user', err);
                    res.locals.user = null;
                } else {
                    res.locals.user = user;
                }
                next();
            });
        } catch (error) {
            console.error('Error in user middleware:', error);
            res.locals.user = null;
            next();
        }
    } else {
        res.locals.user = null;
        next();
    }
});

// Database setup
const dbPath = process.env.DB_PATH || path.join(__dirname, 'documents.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
        return;
    }
    console.log('Connected to the SQLite database.');
    
    // Create documents table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        filetype TEXT,
        filesize INTEGER,
        category TEXT,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`, (err) => {
        if (err) {
            console.error('Error creating documents table', err);
        } else {
            console.log('Documents table created or already exists.');
            
            // Check if the user_id column exists, if not add it
            db.all("PRAGMA table_info(documents)", (err, rows) => {
                if (err) {
                    console.error('Error checking table schema', err);
                } else {
                    // Check if user_id column exists in the result
                    const hasUserIdColumn = rows && Array.isArray(rows) && rows.some(row => row.name === 'user_id');
                    
                    if (!hasUserIdColumn) {
                        // Add user_id column if it doesn't exist
                        db.run("ALTER TABLE documents ADD COLUMN user_id INTEGER REFERENCES users(id)", (err) => {
                            if (err) {
                                console.error('Error adding user_id column', err);
                            } else {
                                console.log('Added user_id column to documents table');
                            }
                        });
                    }
                }
            });
        }
    });
    
    // Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT UNIQUE,
        name TEXT,
        join_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating users table', err);
        } else {
            console.log('Users table created or already exists.');
        }
    });
    
    // Create tasks table
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        text TEXT NOT NULL,
        completed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`, (err) => {
        if (err) {
            console.error('Error creating tasks table', err);
        } else {
            console.log('Tasks table created or already exists.');
        }
    });
});

// Routes

// Home page
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'Portfolio Home',
        page: 'home'
    });
});

// Portfolio page
app.get('/portfolio', (req, res) => {
    res.render('portfolio', { 
        title: 'My Projects',
        page: 'portfolio'
    });
});

// Public documents page - modified to respect user permissions
app.get('/documents', (req, res) => {
    // If a regular user tries to access /documents, redirect them to their personal documents
    if (req.session.userId && !req.session.isAdmin) {
        return res.redirect('/user/documents');
    }
    
    const search = req.query.search || '';
    const category = req.query.category || '';
    const showConfirm = req.query.showConfirm === 'true';
    const docId = req.query.id || '';
    
    // Build query based on search and category filters
    let query = 'SELECT * FROM documents';
    let params = [];
    
    // Admin can see all documents, non-logged users only see public documents (without user_id)
    if (!req.session.isAdmin) {
        query += ' WHERE user_id IS NULL';
        
        // Add search conditions
        if (search) {
            query += ' AND (title LIKE ? OR description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }
        
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
    } else {
        // For admin users
        let whereAdded = false;
        
        if (search) {
            query += ' WHERE (title LIKE ? OR description LIKE ?)';
            whereAdded = true;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }
        
        if (category) {
            query += whereAdded ? ' AND category = ?' : ' WHERE category = ?';
            params.push(category);
        }
    }
    
    query += ' ORDER BY upload_date DESC';
    
    // Helper functions for formatting in template
    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    };
    
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };
    
    const getFileTypeDisplay = (mimetype) => {
        const types = {
            'application/pdf': 'PDF',
            'image/jpeg': 'JPEG Image',
            'image/png': 'PNG Image',
            'application/msword': 'Word Doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Doc',
            'application/vnd.ms-excel': 'Excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
            'text/plain': 'Text',
            'text/html': 'HTML'
        };
        
        return types[mimetype] || mimetype;
    };
    
    db.all(query, params, (err, documents) => {
        if (err) {
            console.error('Error fetching documents', err);
            return res.status(500).render('error', { 
                message: 'Error retrieving documents',
                error: err
            });
        }
        
        res.render('admin_documents', { 
            title: req.session.isAdmin ? 'All Documents' : 'Public Documents',
            page: 'documents',
            documents: documents,
            search: search,
            category: category,
            showConfirm: showConfirm,
            docId: docId,
            formatFileSize: formatFileSize,
            formatDate: formatDate,
            getFileTypeDisplay: getFileTypeDisplay,
            userId: req.session.userId || null,
            isAdmin: req.session.isAdmin || false
        });
    });
});

// Document upload page - protected for admin only
app.get('/upload-document', isAdmin, (req, res) => {
    // Explicitly set any category parameter to null to prevent redirection
    const category = null;
    
    res.render('upload', {
        title: 'Upload Document',
        page: 'documents'
    });
});

// Upload document
app.post('/upload', isAdmin, upload.single('document'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).render('error', { 
                message: 'No file uploaded',
                error: { status: 400 }
            });
        }
        
        const { title, description, category } = req.body;
        const { filename, originalname, mimetype, size, path: filepath } = req.file;
        
        // Insert into database
        const query = `INSERT INTO documents 
                      (title, description, filename, filepath, filetype, filesize, category, user_id) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        
        db.run(query, [
            title, 
            description, 
            filename, 
            filepath, 
            mimetype, 
            size, 
            category,
            req.session.userId // Add user_id
        ], function(err) {
            if (err) {
                console.error('Error inserting document', err);
                return res.status(500).render('error', { 
                    message: 'Database error when uploading document',
                    error: err
                });
            }
            
            console.log(`Document uploaded: ${title} (ID: ${this.lastID})`);
            res.redirect('/documents');
        });
    } catch (error) {
        console.error('Error in upload process:', error);
        res.status(500).render('error', { 
            message: 'Server error during upload',
            error: error
        });
    }
});

// Download document
app.get('/download/:id', isAuthenticated, (req, res) => {
    const id = req.params.id;
    const userId = req.session.userId;
    const isAdmin = req.session.isAdmin;
    
    // Build query based on user permission (admin can access all documents)
    let query = 'SELECT * FROM documents WHERE id = ?';
    let params = [id];
    
    if (!isAdmin) {
        // Regular users can only access their own documents
        query += ' AND user_id = ?';
        params.push(userId);
    }
    
    db.get(query, params, (err, document) => {
        if (err) {
            console.error('Error fetching document', err);
            return res.status(500).render('error', { 
                message: 'Database error when downloading document',
                error: err
            });
        }
        
        if (!document) {
            return res.status(404).render('error', { 
                message: 'Document not found or you do not have permission to access it',
                error: { status: 404 }
            });
        }
        
        // Make sure the file exists
        if (!fs.existsSync(document.filepath)) {
            return res.status(404).render('error', { 
                message: 'Document file not found on the server',
                error: { status: 404 }
            });
        }
        
        // Send the file
        res.download(document.filepath, document.filename, (err) => {
            if (err) {
                console.error('Error downloading file', err);
                return res.status(500).render('error', { 
                    message: 'Error downloading document',
                    error: err
                });
            }
        });
    });
});

// Delete document - GET version for direct delete links - protected for admin only
app.get('/delete/:id', isAdmin, (req, res) => {
    const id = req.params.id;
    
    // Redirect to documents page - will show confirmation there
    res.redirect(`/documents?showConfirm=true&id=${id}`);
});

// Delete document - POST version for form submission - protected for admin only
app.post('/delete/:id', isAdmin, (req, res) => {
    const id = req.params.id;
    
    db.get('SELECT * FROM documents WHERE id = ?', [id], (err, document) => {
        if (err) {
            console.error('Error fetching document', err);
            return res.status(500).send('Database error');
        }
        
        if (!document) {
            return res.status(404).send('Document not found');
        }
        
        // Delete file from filesystem
        if (fs.existsSync(document.filepath)) {
            fs.unlinkSync(document.filepath);
        }
        
        // Delete from database
        db.run('DELETE FROM documents WHERE id = ?', [id], function(err) {
            if (err) {
                console.error('Error deleting document', err);
                return res.status(500).send('Database error');
            }
            
            res.redirect('/documents');
        });
    });
});

// Admin login page
app.get('/admin/login', (req, res) => {
    res.render('admin/login', { 
        title: 'Admin Login',
        page: 'admin',
        error: req.query.error || null
    });
});

// Admin login form submission
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.redirect('/admin/dashboard');
    } else {
        res.redirect('/admin/login?error=Invalid credentials');
    }
});

// Admin logout
app.get('/admin/logout', (req, res) => {
    req.session.isAdmin = false;
    res.redirect('/');
});

// User Routes

// User signup page
app.get('/user/signup', (req, res) => {
    // Redirect to profile if already logged in
    if (req.session.userId) {
        return res.redirect('/user/profile');
    }
    
    res.render('user/signup', {
        title: 'Create Account',
        page: 'signup',
        error: req.query.error || null
    });
});

// User signup form submission
app.post('/user/signup', async (req, res) => {
    try {
        const { name, username, email, password, confirmPassword } = req.body;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            return res.redirect('/user/signup?error=Passwords do not match');
        }
        
        // Check if username or email already exists
        db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, existingUser) => {
            if (err) {
                console.error('Database error:', err);
                return res.redirect('/user/signup?error=Database error occurred');
            }
            
            if (existingUser) {
                return res.redirect('/user/signup?error=Username or email already in use');
            }
            
            try {
                // Hash password
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);
                
                // Insert new user
                const query = `INSERT INTO users (username, password, email, name, join_date) 
                               VALUES (?, ?, ?, ?, datetime('now'))`;
                
                db.run(query, [username, hashedPassword, email, name], function(err) {
                    if (err) {
                        console.error('Error creating user:', err);
                        return res.redirect('/user/signup?error=Could not create account');
                    }
                    
                    // Set session and redirect to profile
                    req.session.userId = this.lastID;
                    res.redirect('/user/profile');
                });
            } catch (error) {
                console.error('Error hashing password:', error);
                res.redirect('/user/signup?error=Error creating account');
            }
        });
    } catch (error) {
        console.error('Error in signup process:', error);
        res.redirect('/user/signup?error=An unexpected error occurred');
    }
});

// User login page
app.get('/user/login', (req, res) => {
    // Redirect to profile if already logged in
    if (req.session.userId) {
        return res.redirect('/user/profile');
    }
    
    res.render('user/login', {
        title: 'Login',
        page: 'login',
        error: req.query.error || null
    });
});

// User login form submission
app.post('/user/login', (req, res) => {
    const { username, password } = req.body;
    
    // Find user by username
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.redirect('/user/login?error=Database error occurred');
        }
        
        if (!user) {
            return res.redirect('/user/login?error=Invalid username or password');
        }
        
        try {
            // Compare password
            const match = await bcrypt.compare(password, user.password);
            
            if (match) {
                // Set session and redirect to profile
                req.session.userId = user.id;
                res.redirect('/user/profile');
            } else {
                res.redirect('/user/login?error=Invalid username or password');
            }
        } catch (error) {
            console.error('Error comparing passwords:', error);
            res.redirect('/user/login?error=Login error');
        }
    });
});

// User profile page
app.get('/user/profile', isAuthenticated, (req, res) => {
    if (req.session.isAdmin && !req.session.userId) {
        return res.redirect('/admin/dashboard');
    }
    
    res.render('user/profile', {
        title: 'Your Profile',
        page: 'profile',
        message: req.query.message ? {
            type: req.query.message === 'success' ? 'success' : 'danger',
            text: req.query.text || (req.query.message === 'success' ? 'Profile updated successfully' : 'Error updating profile')
        } : null
    });
});

// Update user profile
app.post('/user/update-profile', isAuthenticated, async (req, res) => {
    try {
        const { name, email, currentPassword, newPassword, confirmNewPassword } = req.body;
        const userId = req.session.userId;
        
        if (!userId) {
            return res.redirect('/user/login');
        }
        
        // Get user from database
        db.get('SELECT * FROM users WHERE id = ?', [userId], async (err, user) => {
            if (err || !user) {
                console.error('Error fetching user:', err);
                return res.redirect('/user/profile?message=error&text=User not found');
            }
            
            try {
                // Verify current password
                const match = await bcrypt.compare(currentPassword, user.password);
                
                if (!match) {
                    return res.redirect('/user/profile?message=error&text=Current password is incorrect');
                }
                
                // Check if we need to update password
                let hashedPassword = user.password;
                if (newPassword && newPassword === confirmNewPassword) {
                    hashedPassword = await bcrypt.hash(newPassword, 10);
                } else if (newPassword) {
                    return res.redirect('/user/profile?message=error&text=New passwords do not match');
                }
                
                // Update profile
                db.run(
                    'UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?',
                    [name, email, hashedPassword, userId],
                    function(err) {
                        if (err) {
                            console.error('Error updating profile:', err);
                            return res.redirect('/user/profile?message=error&text=Could not update profile');
                        }
                        
                        res.redirect('/user/profile?message=success');
                    }
                );
            } catch (error) {
                console.error('Error updating profile:', error);
                res.redirect('/user/profile?message=error&text=Error processing your request');
            }
        });
    } catch (error) {
        console.error('Error in profile update:', error);
        res.redirect('/user/profile?message=error&text=An unexpected error occurred');
    }
});

// User logout
app.get('/user/logout', (req, res) => {
    req.session.userId = null;
    req.session.save(err => {
        if (err) {
            console.error('Error saving session:', err);
        }
        res.redirect('/');
    });
});

// User planning page
app.get('/user/planning', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    
    // Get user's tasks from database
    db.all('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, tasks) => {
        if (err) {
            console.error('Error fetching tasks', err);
            return res.status(500).render('error', { 
                message: 'Error retrieving tasks',
                error: err
            });
        }
        
        // Group tasks by category
        const tasksByCategory = {
            'today-tasks': tasks.filter(task => task.category === 'today'),
            'upcoming-tasks': tasks.filter(task => task.category === 'upcoming'),
            'project-ideas': tasks.filter(task => task.category === 'project')
        };
        
        res.render('user/planning', {
            title: 'Your Planning',
            page: 'planning',
            tasks: tasksByCategory
        });
    });
});

// API Route: Get all tasks
app.get('/api/tasks', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    
    db.all('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, tasks) => {
        if (err) {
            console.error('Error fetching tasks', err);
            return res.status(500).json({ error: 'Failed to fetch tasks' });
        }
        
        res.json(tasks);
    });
});

// API Route: Create new task
app.post('/api/tasks', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const { category, text } = req.body;
    
    if (!category || !text) {
        return res.status(400).json({ error: 'Category and text are required' });
    }
    
    db.run(
        'INSERT INTO tasks (user_id, category, text) VALUES (?, ?, ?)',
        [userId, category, text],
        function(err) {
            if (err) {
                console.error('Error creating task', err);
                return res.status(500).json({ error: 'Failed to create task' });
            }
            
            db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (err, task) => {
                if (err) {
                    console.error('Error fetching created task', err);
                    return res.status(500).json({ error: 'Task created but failed to retrieve it' });
                }
                
                res.status(201).json(task);
            });
        }
    );
});

// API Route: Update task
app.put('/api/tasks/:id', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const taskId = req.params.id;
    const { completed } = req.body;
    
    if (completed === undefined) {
        return res.status(400).json({ error: 'Completed status is required' });
    }
    
    // Make sure the task belongs to the user
    db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId], (err, task) => {
        if (err || !task) {
            console.error('Error fetching task for update or task not found', err);
            return res.status(404).json({ error: 'Task not found or unauthorized' });
        }
        
        db.run(
            'UPDATE tasks SET completed = ? WHERE id = ?',
            [completed ? 1 : 0, taskId],
            function(err) {
                if (err) {
                    console.error('Error updating task', err);
                    return res.status(500).json({ error: 'Failed to update task' });
                }
                
                res.json({ id: taskId, completed: completed });
            }
        );
    });
});

// API Route: Delete task
app.delete('/api/tasks/:id', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const taskId = req.params.id;
    
    // Make sure the task belongs to the user
    db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId], (err, task) => {
        if (err || !task) {
            console.error('Error fetching task for deletion or task not found', err);
            return res.status(404).json({ error: 'Task not found or unauthorized' });
        }
        
        db.run('DELETE FROM tasks WHERE id = ?', [taskId], function(err) {
            if (err) {
                console.error('Error deleting task', err);
                return res.status(500).json({ error: 'Failed to delete task' });
            }
            
            res.json({ id: taskId, deleted: true });
        });
    });
});

// User documents page
app.get('/user/documents', isAuthenticated, (req, res) => {
    const search = req.query.search || '';
    const category = req.query.category || '';
    
    // Build query based on search and category filters
    let query = 'SELECT * FROM documents WHERE user_id = ?';
    let params = [req.session.userId];
    
    if (search) {
        query += ' AND (title LIKE ? OR description LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
    }
    
    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }
    
    query += ' ORDER BY upload_date DESC';
    
    // Helper functions for formatting in template
    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    };
    
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };
    
    const getFileTypeDisplay = (mimetype) => {
        const types = {
            'application/pdf': 'PDF',
            'image/jpeg': 'JPEG Image',
            'image/png': 'PNG Image',
            'application/msword': 'Word Doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Doc',
            'application/vnd.ms-excel': 'Excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
            'text/plain': 'Text',
            'text/html': 'HTML'
        };
        
        return types[mimetype] || mimetype;
    };
    
    db.all(query, params, (err, documents) => {
        if (err) {
            console.error('Error fetching documents', err);
            return res.status(500).render('error', { 
                message: 'Error retrieving documents',
                error: err
            });
        }
        
        res.render('user/documents', { 
            title: 'My Documents',
            page: 'my-documents',
            documents: documents,
            search: search,
            category: category,
            formatFileSize: formatFileSize,
            formatDate: formatDate,
            getFileTypeDisplay: getFileTypeDisplay
        });
    });
});

// User document upload page
app.get('/user/upload-document', isAuthenticated, (req, res) => {
    res.render('user/upload', {
        title: 'Upload Document',
        page: 'my-documents'
    });
});

// User document upload handler
app.post('/user/upload', isAuthenticated, upload.single('document'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).render('error', { 
                message: 'No file uploaded',
                error: { status: 400 }
            });
        }
        
        const { title, description, category } = req.body;
        const { filename, originalname, mimetype, size, path: filepath } = req.file;
        
        // Insert into database
        const query = `INSERT INTO documents 
                      (title, description, filename, filepath, filetype, filesize, category, user_id) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        
        db.run(query, [
            title, 
            description, 
            filename, 
            filepath, 
            mimetype, 
            size, 
            category,
            req.session.userId
        ], function(err) {
            if (err) {
                console.error('Error inserting document', err);
                return res.status(500).render('error', { 
                    message: 'Database error when uploading document',
                    error: err
                });
            }
            
            console.log(`Document uploaded by user ${req.session.userId}: ${title} (ID: ${this.lastID})`);
            res.redirect('/user/documents');
        });
    } catch (error) {
        console.error('Error in upload process:', error);
        res.status(500).render('error', { 
            message: 'Server error during upload',
            error: error
        });
    }
});

// User document deletion (GET version for direct delete links)
app.get('/user/delete/:id', isAuthenticated, (req, res) => {
    const id = req.params.id;
    
    // Redirect to documents page with confirmation
    res.redirect(`/user/documents?showConfirm=true&id=${id}`);
});

// User document deletion (POST version for form submission)
app.post('/user/delete/:id', isAuthenticated, (req, res) => {
    const id = req.params.id;
    const userId = req.session.userId;
    
    // Verify the document belongs to the user
    db.get('SELECT * FROM documents WHERE id = ? AND user_id = ?', [id, userId], (err, document) => {
        if (err) {
            console.error('Error fetching document', err);
            return res.status(500).send('Database error');
        }
        
        if (!document) {
            return res.status(404).send('Document not found or you do not have permission to delete it');
        }
        
        // Delete file from filesystem
        if (fs.existsSync(document.filepath)) {
            fs.unlinkSync(document.filepath);
        }
        
        // Delete from database
        db.run('DELETE FROM documents WHERE id = ? AND user_id = ?', [id, userId], function(err) {
            if (err) {
                console.error('Error deleting document', err);
                return res.status(500).send('Database error');
            }
            
            res.redirect('/user/documents');
        });
    });
});

// Admin dashboard (protected route)
app.get('/admin/dashboard', isAdmin, (req, res) => {
    res.render('admin/dashboard', { 
        title: 'Admin Dashboard',
        page: 'admin'
    });
});

// Database management (protected route)
app.get('/admin/database', isAdmin, (req, res) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
        if (err) {
            console.error('Error fetching tables', err);
            return res.status(500).render('error', { 
                message: 'Error fetching database tables',
                error: err
            });
        }
        
        res.render('admin/database', { 
            title: 'Database Management',
            page: 'admin',
            tables: tables
        });
    });
});

// View table data (protected route)
app.get('/admin/table/:tableName', isAdmin, (req, res) => {
    const tableName = req.params.tableName;
    
    // Basic SQL injection protection
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
        return res.status(400).render('error', { 
            message: 'Invalid table name',
            error: { status: 400 }
        });
    }
    
    db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
        if (err) {
            console.error(`Error fetching data from ${tableName}`, err);
            return res.status(500).render('error', { 
                message: `Error fetching data from ${tableName}`,
                error: err
            });
        }
        
        // Get column names
        db.all(`PRAGMA table_info(${tableName})`, [], (err, columns) => {
            if (err) {
                console.error(`Error fetching columns for ${tableName}`, err);
                return res.status(500).render('error', { 
                    message: `Error fetching columns for ${tableName}`,
                    error: err
                });
            }
            
            res.render('admin/table', { 
                title: `Table: ${tableName}`,
                page: 'admin',
                tableName: tableName,
                columns: columns,
                rows: rows
            });
        });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the portfolio`);
    
    // Initialize Browser-Sync for development
    if (process.env.NODE_ENV !== 'production') {
        // Start BrowserSync
        browserSync.init({
            proxy: `localhost:${PORT}`,
            files: [
                'public/**/*.{js,css}',
                'views/**/*.ejs'
            ],
            notify: false, // Disable notifications in the browser
            open: false, // Don't open browser automatically
            ui: false, // Disable UI
            ghostMode: false // Disable syncing of browser interactions
        });
        console.log(`Browser-Sync running. Access your site at http://localhost:3000 for auto-refreshing.`);
    }
});
