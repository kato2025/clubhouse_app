const express = require('express');
const passport = require('passport');
const router = express.Router();

router.post(
    '/login',
    passport.authenticate('local', {
        failureRedirect: '/auth/login',
        failureFlash: true,
    }),
    (req, res) => {
        console.log('User successfully logged in:', req.user);
        res.redirect('/'); // Redirect to the homepage after successful login
    }
);

module.exports = router;
