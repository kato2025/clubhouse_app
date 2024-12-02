const pool = require('../db');

exports.homePage = async (req, res) => {
    try {
        const result = await pool.query('SELECT title, text, created_at FROM messages ORDER BY created_at DESC');
        res.render('home', { messages: result.rows, user: req.user });
    } catch (err) {
        res.status(500).send('Error loading messages');
    }
};

exports.postMessageForm = (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/login');
    res.render('postMessage');
};

exports.postMessage = async (req, res) => {
    const { title, text } = req.body;
    try {
        await pool.query('INSERT INTO messages (user_id, title, text) VALUES ($1, $2, $3)', [
            req.user.id, title, text,
        ]);
        res.redirect('/');
    } catch (error) {
        res.status(500).send('Error posting message');
    }
};
