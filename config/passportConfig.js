const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const pool = require('../db'); // Ensure this correctly connects to your DB

// Local strategy for authentication
passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
            const user = result.rows[0];
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);

// Serialize user to the session
passport.serializeUser((user, done) => {
    console.log("Serializing user:", user);
    done(null, user.id); // Save user ID in the session
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        const user = result.rows[0];
        console.log("Deserializing user:", user);
        done(null, user); // Attach user object to req.user
    } catch (err) {
        console.error("Error deserializing user:", err);
        done(err, null);
    }
});


module.exports = passport;
