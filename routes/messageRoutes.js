const express = require('express');
const router = express.Router();
const pool = require('../db');

// Authentication middleware
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated() && req.user?.is_member) {
        return next();
    }
    req.flash('error', 'You must be a member to perform this action.');
    res.redirect('/login');
}

// Render "Post a Message" page
router.get('/postMessage', ensureAuthenticated, (req, res) => {
    res.render('postMessage');
});

// Handle posting a new message
router.post('/', ensureAuthenticated, async (req, res) => {
    const { title, text } = req.body;
    try {
        await pool.query(
            'INSERT INTO messages (user_id, title, text, created_at) VALUES ($1, $2, $3, NOW())',
            [req.user.id, title, text]
        );
        res.redirect('/');
    } catch (err) {
        console.error('Error posting message:', err);
        res.status(500).send('Error saving message');
    }
});

// Render the "Edit Message" page
router.get('/:id/edit', ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM messages WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).send('Message not found');
        }

        const message = result.rows[0];
        res.render('editMessage', { message });
    } catch (error) {
        console.error('Error fetching message for editing:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Handle updating a message
router.post('/:id/edit', ensureAuthenticated, async (req, res) => {
    const { title, text } = req.body;
    const { id } = req.params;

    try {
        await pool.query(
            'UPDATE messages SET title = $1, text = $2 WHERE id = $3 AND user_id = $4',
            [title, text, id, req.user.id]
        );
        res.redirect('/');
    } catch (err) {
        console.error('Error updating message:', err);
        res.status(500).send('Error updating message');
    }
});

// Handle deleting a message
router.post('/:id/delete', ensureAuthenticated, async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM messages WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        res.redirect('/');
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).send('Error deleting message');
    }
});

module.exports = router;
