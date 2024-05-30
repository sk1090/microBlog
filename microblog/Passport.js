// Import necessary modules
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const dotenv = require('dotenv');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
const crypto = require('crypto');
// Load environment variables from .env file
dotenv.config();

// Express app setup
const app = express();
const PORT = 3000;

// Use environment variables for client ID and secret

const CLIENT_ID =  '20385861370-4q9slsa79fsmlnnd300eq61fj34hg4kt.apps.googleusercontent.com';
//process.env.CLIENT_ID;
const CLIENT_SECRET = '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';
//process.env.CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/auth/google/callback';
const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
// Configure passport
passport.use(new GoogleStrategy({
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackURL: `http://localhost:${PORT}/auth/google/callback`
}, (token, tokenSecret, profile, done) => {
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
/*
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'server.js'));
});
*/

// Redirect to Google's OAuth 2.0 server
app.get('/auth/google', (req, res) => {
    const url = client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
    });
    res.redirect(url);
});

// Handle OAuth 2.0 server response
app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const oauth2 = google.oauth2({
        auth: client,
        version: 'v2',
    });

    const userinfo = await oauth2.userinfo.get();
    res.send(`
        <h1>Hello, ${userinfo.data.name}</h1>
        <p>Email: ${userinfo.data.email}</p>
        <img src="${userinfo.data.picture}" alt="Profile Picture">
        <br>
        <a href="/logout">Logout from App</a>
        <br>
    `);
});



/*
app.get('/auth/google', (req, res) => {
    //res.render('loginRegister', { regError: req.query.error });
    res.redirect('https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=20385861370-4q9slsa79fsmlnnd300eq61fj34hg4kt.apps.googleusercontent.com&redirect_uri=http://localhost:3000/auth/google/callback&scope=https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile&prompt=consent');
});

app.get('/auth/google/callback', (req, res) => {
    let str = "DIE";
   // res.send("DIE");
   // res.send(req.query.id);
   //res.send("mice");
   str = str.concat("mice");
   //res.send(str);
    if(req.query.id!=undefined)
    {
        str = str.concat("rabbits");
        //res.send("rabbits");
    }
    if(req.query.client_id!=undefined)
    {
        str = str.concat("poultry");
        //res.send("poultry");
    }
    if(req.query.id_token!=undefined)
        {
            str = str.concat("rabbits");
            //res.send("rabbits");
        }
    str = str.concat("grapes");
    res.send(str);
    //res.send("grapes");
   // res.send(req.query.client_id);
    //res.redirect('https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=20385861370-4q9slsa79fsmlnnd300eq61fj34hg4kt.apps.googleusercontent.com&redirect_uri=http://localhost:3000/auth/google/callback&scope=https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile&prompt=consent');
    /*console.log("HAPLESS");
    console.log(req.query.id);
    console.log(req.query.client_id);
    console.log("done");*/
    //res.render('loginRegister', { regError: req.query.error });
    //res.redirect('https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=20385861370-4q9slsa79fsmlnnd300eq61fj34hg4kt.apps.googleusercontent.com&redirect_uri=http://localhost:3000/auth/google/callback&scope=https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile&prompt=consent');
//});

/*
function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
   var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
     return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
   }).join(''));
 
   return JSON.parse(jsonPayload);
 };
*/