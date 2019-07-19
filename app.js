var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
var AzureAdOAuth2Strategy = require('passport-azure-ad-oauth2').Strategy;
var db = require('./db');
var graph = require('./msft_graph');

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser((user, cb) => {
    cb(null, user.id);
});

passport.deserializeUser((id, cb) => {
    db.findById(id)
        .then((user) => cb(null, user))
        .catch((err) => cb(err, null));
});

passport.use(new OIDCStrategy({
        identityMetadata: process.env['OAUTH_ID_METADATA'],
        clientID: process.env['OAUTH_APP_ID'],
        responseType: 'id_token code',
        responseMode: 'form_post',
        redirectUrl: process.env['OAUTH_REDIRECT_URI'],
        allowHttpForRedirectUrl: true,
        clientSecret: process.env['OAUTH_APP_SECRET'],
        scope: process.env['OAUTH_SCOPES'].split(' ').filter((p) => p != 'profile'),
        loggingLevel: 'error',
        nonceLifetime: 3600,
        nonceMaxAmount: 5,
        useCookieInsteadOfSession: false,
    },
    function (iss, sub, profile, accessToken, refreshToken, done) {
        graph.getUserDetails(accessToken)
            .then((user) => {
                if (!user)
                    throw new Error("No user found");
                const oid = user.id;
                const email = user.mail ? user.mail : user.userPrincipalName;
                const username = user.displayName;

                return db.findOrCreate(oid, username, email);
            })
            .then((user) => done(null, user))
            .catch((err) => done(err, null));
    }));

// Create a new Express application.
var app = express();

// Configure view engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('body-parser').urlencoded({
    extended: true
}));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(cookieParser());
app.use(session({
    secret: 'toto',
    resave: false,
    saveUninitialized: false,
    unset: 'destroy'
}));
app.use(passport.initialize());
app.use(passport.session());

// Define routes.
app.get('/', (req, res) => {
    res.render('home', {
        user: req.user
    });
});

const authMiddleware = passport.authenticate('azuread-openidconnect', {
    failureRedirect: '/auth/failed',
});

app.get('/auth/azure', authMiddleware);

app.post('/auth/azure/callback',
    (req, res, next) => {
        if (!!req.body['error'])
            return res.status(500).json(req.body);
        next();
    },
    authMiddleware,
    (req, res) => {
        // successfuly auth'ed
        res.redirect('/profile');
    }
);

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        req.logout();
        res.redirect('/');
    });
});

app.get('/profile', authMiddleware, (req, res) => {
    res.render('profile', {
        user: req.user
    });
});

app.listen(3000);