const express = require('express');
const path = require('path');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const passport = require('passport');
const pool = require('./db'); // PostgreSQL connection pool
require('./config/passportConfig'); // Passport strategies
const bcrypt = require('bcrypt');
const flash = require('connect-flash');
require('dotenv').config();
const router = require('./routes/messageRoutes');  // Ensure correct path to your messageRoutes file

const app = express();

// Middleware setup
app.set('view engine', 'ejs');

// Middleware
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // For JSON data

// Session setup
app.use(session({
    store: new pgSession({
        pool: pool,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to true if using https
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Use the router for message-related routes
app.use(router);

// Flash messages
app.use(flash());

// Debugging middleware
app.use((req, res, next) => {
    console.log('User:', req.user);
    console.log('Session Data:', req.session);
    next();
});

// Make flash messages available in views
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});

// Ensure authenticated and membership middleware
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated() && req.user?.is_member) {
        return next();
    }
    req.flash('error', 'You must be a member to perform this action.');
    res.redirect('/login');
}

// Routes

// Authentication routes
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

// Message routes
const messageRoutes = require('./routes/messageRoutes');
app.use('/messages', messageRoutes);

// Home page
app.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT messages.*, users.username 
            FROM messages 
            JOIN users ON messages.user_id = users.id 
            ORDER BY created_at DESC
        `);
        res.render('home', { messages: result.rows, user: req.user });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Sign up route
app.get('/signup', (req, res) => {
    res.render('signup', { messages: req.flash() }); // Pass messages to the signup view
});

app.post('/signup', async (req, res) => {
    const { username, password, name, is_member } = req.body; // Include the name field
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length > 0) {
            req.flash('error', 'Username already taken, please choose another one.');
            return res.render('signup', { messages: { error: req.flash('error') } });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (name, username, password, is_member) VALUES ($1, $2, $3, $4)',
            [name, username, hashedPassword, is_member || false] // Pass name to the query
        );
        req.flash('success', 'Account created successfully. Please log in.');
        res.redirect('/login');
    } catch (error) {
        console.error("Registration error:", error);

        if (error.code === '23502') {
            req.flash(
                'error',
                `Missing required field: ${error.column}. Please fill out all fields and try again.`
            );
        } else {
            req.flash('error', 'An unexpected error occurred. Please try again.');
        }

        res.render('signup', { messages: { error: req.flash('error') } });
    }
});

// Login route
app.get('/login', (req, res) => {
    res.render('login', { error: req.flash('error') });
});

app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            // If the user is not found or credentials are wrong, show an error message
            req.flash('error', 'Invalid username or password');
            return res.redirect('/login');  // Redirect back to login page
        }
        req.logIn(user, (err) => {
            if (err) return next(err);
            res.redirect('/');  // Redirect to the homepage after successful login
        });
    })(req, res, next);
});

// Logout route
app.get('/logout', (req, res) => {
    req.logout(err => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).send("Internal Server Error");
        }
        res.redirect('/');
    });
});

// Get route for posting a message
app.get('/postMessage', ensureAuthenticated, (req, res) => {
    res.render('postMessage'); // Render the form for posting a message
});

// Post route for submitting a message
app.post('/postMessage', ensureAuthenticated, async (req, res) => {
    const { title, text } = req.body;

    try {
        // Ensure user information is available
        if (!req.user || !req.user.id) {
            req.flash('error', 'User not authenticated.');
            return res.redirect('/login');
        }

        // Insert the new message into the database
        await pool.query(
            'INSERT INTO messages (user_id, title, text, created_at) VALUES ($1, $2, $3, NOW())',
            [req.user.id, title, text]
        );

        // Flash a success message
        req.flash('success', 'Message posted successfully.');
        res.redirect('/');
    } catch (error) {
        console.error("Error posting message:", error);

        // Flash an error message and redirect back to the form
        req.flash('error', 'Error posting your message. Please try again.');
        res.redirect('/postMessage');
    }
});


// Edit message routes
router.get('/editMessage/:id', ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM messages WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).send("Message not found");
        }

        const message = result.rows[0];
        res.render('editMessage', { message }); // Renders views/editMessage.ejs
    } catch (error) {
        console.error("Error fetching message for editing:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Update message route
router.post('/messages/:id/edit', ensureAuthenticated, async (req, res) => {
    try {
        const { title, text } = req.body;
        const { id } = req.params;

        await pool.query(
            'UPDATE messages SET title = $1, text = $2 WHERE id = $3 AND user_id = $4',
            [title, text, id, req.user.id]
        );

        res.redirect('/');
    } catch (err) {
        console.error("Error updating message:", err);
        res.status(500).send("Error updating message");
    }
});


// Delete message route
app.post('/messages/:id/delete', ensureAuthenticated, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM messages WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        res.redirect('/');
    } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
