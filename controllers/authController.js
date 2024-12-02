const bcrypt = require('bcryptjs');
const passport = require('passport');
const pool = require('../db');

// Show signup form
exports.signupForm = (req, res) => res.render('signup');

// Handle signup form submission
exports.signup = async (req, res) => {
    const { username, password, name } = req.body; // Include the name field
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Insert username, hashed password, and name into the database
        await pool.query(
            'INSERT INTO users (username, password, name) VALUES ($1, $2, $3)', 
            [username, hashedPassword, name]
        );
        res.redirect('/auth/login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error signing up');
    }
};

// Show login form
exports.loginForm = (req, res) => res.render('login');

// Handle login submission
exports.login = passport.authenticate('local', {
    successRedirect: '/',  // Redirect to the home page upon successful login
    failureRedirect: '/auth/login',  // Redirect back to the login page if login fails
    failureFlash: true  // Enable flash messages for failed login
});

// Logout and redirect to home page
exports.logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('/');
    });
};