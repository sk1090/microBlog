const express = require('express');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');
const canvas = require('canvas');
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const passport = require('passport')
const dbFileName = 'your_database_file.db';
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();


async function getDBConnection(){
    const db = await sqlite.open({
        filename: 'your_database_file.db', // replace this with your db file name
        driver: sqlite3.Database
    });

    return db;
}

//const db = getDBConnection();
//const db = await getDbConnection();
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Configuration and Setup
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const app = express();
//20385861370-4q9slsa79fsmlnnd300eq61fj34hg4kt.apps.googleusercontent.com
const accessToken = process.env.EMOJI_API_KEY;
let ry = ""+accessToken;
//console.log(accessToken)
//console.log(""+5);
const CLIENT_ID = ""+process.env.CLIENT_ID;
//console.log("HEYITS");
//console.log(CLIENT_ID);
//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
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/auth/google/callback';
const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
const PORT = 3000;
let currentpostid = 3;



let sortbydate=1;


/*
try {
    // error could happen here
    let rows = await db.all('SELECT name FROM pokedex');
    // process the result rows somehow
  } catch (error) {
    // PRO debugging tip
    console.log(error); // ALWAYS delete this before submitting
    res.status(500).send('Error on the server. Please try again later.');
  }
  
*/

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Handlebars Helpers

    Handlebars helpers are custom functions that can be used within the templates 
    to perform specific tasks. They enhance the functionality of templates and 
    help simplify data manipulation directly within the view files.

    In this project, two helpers are provided:
    
    1. toLowerCase:
       - Converts a given string to lowercase.
       - Usage example: {{toLowerCase 'SAMPLE STRING'}} -> 'sample string'

    2. ifCond:
       - Compares two values for equality and returns a block of content based on 
         the comparison result.
       - Usage example: 
            {{#ifCond value1 value2}}
                <!-- Content if value1 equals value2 -->
            {{else}}
                <!-- Content if value1 does not equal value2 -->
            {{/ifCond}}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

// Set up Handlebars view engine with custom helpers
//
app.engine(
    'handlebars',
    expressHandlebars.engine({
        helpers: {
            toLowerCase: function (str) {
                return str.toLowerCase();
            },
            ifCond: function (v1, v2, options) {
                if (v1 === v2) {
                    return options.fn(this);
                }
                return options.inverse(this);
            },
        },
    })
);

app.set('view engine', 'handlebars');
app.set('views', './views');

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Middleware
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.use(
    session({
        secret: 'oneringtorulethemall',     // Secret key to sign the session ID cookie
        resave: false,                      // Don't save session if unmodified
        saveUninitialized: false,           // Don't create session until something stored
        cookie: { secure: false },          // True if using https. Set to false for development without https
    })
);
app.use(passport.initialize());
app.use(passport.session());
// Replace any of these variables below with constants for your application. These variables
// should be used in your template files. 
// 
app.use((req, res, next) => {
    
    res.locals.appName = 'CactiSpikes';
    res.locals.copyrightYear = 2024;
    res.locals.postNeoType = 'Post';
    res.locals.loggedIn = req.session.loggedIn || false;
    res.locals.userId = req.session.userId || '';
    next();
});

app.use(express.static('public'));                  // Serve static files
app.use(express.urlencoded({ extended: true }));    // Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.json());                            // Parse JSON bodies (as sent by API clients)

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Routes
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Home route: render home view with posts and user
// We pass the posts and user variables into the home
// template
//
app.get('/', async function(req, res){
    //let db = getDbConnection();
    /*
    if(sortbydate==1)
    {
        let posts =  await getPosts();
    }else{
        let posts =  await getPosts2();
    }
    */

    const user = await getCurrentUser(req)|| await findUserById(res.locals.userId) || {};
    //getCurrentUser(req) || {};
    //console.log("DIE");
   // console.log(user.username);
    //let posts =  await getPosts();

    //generates an avatar for all users w/o an avatar
    console.log("HELP!");
    console.log(user);
    if(user=={}||getCurrentUser(req)==undefined||user.length==0||user.id==undefined)
    {
        console.log("HELP2!");
        const db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });
        let emptyavatarusers = await db.all('SELECT * FROM users WHERE avatar_url = ?',['']);
        for(let i = 0;i<emptyavatarusers.length;i++)
        {
            let id999 = emptyavatarusers[i].id;
            let plholder5 = generateAvatar((emptyavatarusers[i].username)[0],100,100);
            await db.run('UPDATE users SET avatar_url = ? WHERE id = ?',[plholder5,id999]);
        }
    }

    let posts =  await getPosts();
    if(sortbydate==1)
        {
            //console.log("ch2");
            posts =  await getPosts();
            //console.log(posts);
            res.render('home', { posts, user });
            
        }else{
            //console.log("ch3");
             posts =  await getPosts2();
             //console.log(posts);

             res.render('home', { posts, user });
             
        }
        
    //res.render('home', { posts, user });
});

// Register GET route is used for error response from registration
//
app.get('/register', (req, res) => {
    res.render('loginRegister', { regError: req.query.error });
});

// Login route GET route is used for error response from login
//
app.get('/login', (req, res) => {
    res.render('loginRegister', { loginError: req.query.error });
});

// Error route: render error page
app.get('/error', (req, res) => {
    res.render(error);
});


// Additional routes that you must implement
app.post('/postsort', async function (req, res){
    if(sortbydate==0)
    {
        sortbydate=1;
    }else{
        sortbydate=0;
    }
    
    await res.redirect('/');
    //console.log("DIENOW");
    //console.log(req.body.sorttype);
    req.body.sorttype = "nlikes";
});

app.post('/profilepostsort', async function (req, res){
    if(sortbydate==0)
    {
        sortbydate=1;
    }else{
        sortbydate=0;
    }
    
    await res.redirect('/profile');
   // console.log("DIENOW");
    //console.log(req.body.sorttype);
    req.body.sorttype = "nlikes"; //?
});

//Adds a new post and redirect to home
app.post('/posts', async function(req, res){
    // TODO: 
   let user2 = await findUserById(res.locals.userId);
    let postTitle =  req.body.PostTitle;
    let postContent = req.body.PostBody;
    await addPost(postTitle, postContent, user2);
    /*if(sortbydate==0)
        {
            sortbydate=1;
        }else{
            sortbydate=0;
        }
        */
    res.redirect('/');
});



//updates post likes in posts array
app.post('/like/:id', async function(req, res){
    if(res.locals.loggedIn || req.session.loggedIn)
    {
        await updatePostLikes(req,res);
        res.send("loggedin");
    }
});

//Renders profile page
app.get('/profile', isAuthenticated, async function(req, res){
    app.use(isAuthenticated);
    await renderProfile(req, res);
});

//sends emoji access key to user if they send a fetch request for it
app.get('/getEmojiAccessKey', (req, res) => {
    res.send(accessToken);
});

app.get('/getCurrentSortType', (req, res) => {
    //console.log("hi1333330");
    if(sortbydate==1)
    {
        res.send("dates");
    }else{
        res.send("nlikes");
    }
    
});

app.get('/changeSort', async function(req, res){
    //console.log("MAKINGTHATCHANGE")
    if(sortbydate==0)
    {
        sortbydate=1;
    }else{
        sortbydate=0;
    }
    
    await res.redirect('/');
});

//Serves the avatar image for the user
app.get('/avatar/:username', async function(req, res){
    await handleAvatar(req,res);
});

//Registers a new user
app.post('/register', async function(req, res){
    await registerUser(req, res);
    
});

app.post('/registerUsername', async function(req, res){
    await registerUser(req, res);
    
});

//Logs in a user
app.post('/login', async function(req, res){
    await loginUser(req,res);
});

//Logout the user
app.get('/logout', (req, res) => {
    logoutUser(req, res);
    res.redirect('/googleLogout')
   // res.render('googleLogout', { posts, user });

});

app.get('/googleLogout', (req, res) => {
  //  logoutUser(req, res);
    //res.redirect('/googleLogout')
    res.sendFile(path.join(__dirname, 'iframelogout.html'));
    let user = getCurrentUser(req);
   // res.render('googleLogout', {});

});

app.get('/logoutCallback', (req, res) => {
    res.render('googleLogout', {});
});

app.get('/auth/google', (req, res) => {
    //console.log("inauth1");
    const url = client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
    });
   // console.log("inauth2");
    res.redirect(url);
    //console.log("doneauth3");
});

// Handle OAuth 2.0 server response
app.get('/auth/google/callback', async function(req, res){
   // console.log("incb1");
    const { code } = req.query;
   // console.log("incb2");
    const { tokens } = await client.getToken(code);
   // console.log("incb3");
    //console.log(profile);
    //console.log(tokens);
    client.setCredentials(tokens);

    const oauth2 = google.oauth2({
        auth: client,
        version: 'v2',
    });

    const userinfo = await oauth2.userinfo.get();
    /*
    res.send(`
        <h1>Hello, ${userinfo.data.id}</h1> 
        <p>Email: ${userinfo.data.email}</p>
        <img src="${userinfo.data.picture}" alt="Profile Picture">
        <br>
        <a href="/logout">Logout from App</a>
        <br>
    `);
    */
   
    let user_id = userinfo.data.id; //const
var hashedid = crypto.createHash('sha256').update(user_id).digest('hex');
//console.log(hash);
//hash.update(input);
//console.log(hash.update(input));
//input.pipe(hash).setEncoding('hex').pipe(stdout);
//console.log(input);
//console.log("HEY");
const db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });
//console.log("HEY2");
let user = await db.get('SELECT * FROM users WHERE hashedGoogleId = ?',[hashedid]);
if(user==undefined)
{
   await addUser2(""+hashedid);
    user = await db.get('SELECT * FROM users WHERE hashedGoogleId = ?',[""+hashedid]);
    if(user==undefined)
        {
            //console.log("CTB");
        }
    res.locals.loggedIn = true;
    req.session.loggedIn = true;
    res.locals.userId = user.id;
    req.session.userId = user.id;
    loggedIn = true;
    res.render('registerUsername', { regError: req.query.error });
}else{
    /*
    res.locals.appName = 'CactiSpikes';
    res.locals.copyrightYear = 2024;
    res.locals.postNeoType = 'Post';
    */
    res.locals.loggedIn = true;
    req.session.loggedIn = true;
    res.locals.userId = user.id;
    req.session.userId = user.id;
    loggedIn = true;
    let posts =  await getPosts();
    if(sortbydate==1)
        {
           // console.log("ch2");
            posts =  await getPosts();
            //console.log(posts);
            res.render('home', { posts, user });
            
        }else{
            //console.log("ch3");
             posts =  await getPosts2();
             //console.log(posts);

             res.render('home', { posts, user });
             
        }
}

});










//Deletes a post if the current user is the owner
app.post('/delete/:id', isAuthenticated, async function(req, res){
    const db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });
    app.use(isAuthenticated);
    //console.log("pi7");
    let id7 = req.body.id;
    //console.log("pi8");
    await db.run('DELETE FROM posts WHERE id = ?',[id7]);
/*
    for(let i = 0;i<posts.length;i++)
        {
            if(posts[i].id==req.body.id)
                {
                    posts.splice(i,1);
                }
        }
        */
        res.send("Reload Page");
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Server Activation
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Support Functions and Variables
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~




// Function to find a user by username
async function findUserByUsername(username) {
    const db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });
    let user9 = await db.get('SELECT * FROM users WHERE username = ?',[username]);
    return user9;
    //Returns user object if found, otherwise return undefined
}

// Function to find a user by user ID
async function findUserById(userId) {  
    const db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });
     let user9 = db.get('SELECT * FROM users WHERE id = ?',[userId]);
     return user9;
}
async function addUser2(hashedid) {
    const db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });
    //console.log("hi5");
    let hashedid2 = hashedid;
   /* let currentUser = {};
    currentUser.id = users.length+1;
    currentUser.username = username;
    currentUser.avatar_url = generateAvatar(username[0],100,100);
*/
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    let hours = String(today.getHours()).padStart(2, '0');
    let mins = String(today.getMinutes()).padStart(2, '0');
    let finaldate = yyyy+'-'+mm+'-'+dd+' '+hours+':'+mins;
   // currentUser.memberSince = finaldate;
   // users.push(currentUser);
    
   // console.log("hi6");
   // let plholder = generateAvatar(username[0],100,100);
    
    //console.log("hi7");
    let qry = 'INSERT INTO users ("username","hashedGoogleId","avatar_url", "memberSince") VALUES (?,?,?,?)';
   // console.log("hi8");
   // console.log(username2);
    let p10 = await db.run(qry,[hashedid2,hashedid2,hashedid2,finaldate]);
   // console.log("hi9");
    //Creates a new user object and add to users array
}
// Function to add a new user
async function addUser(username) {
   // console.log("hi5");
    let username2 = username;
    let currentUser = {};
    currentUser.id = users.length+1;
    currentUser.username = username;
    currentUser.avatar_url = generateAvatar(username[0],100,100);

    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    let hours = String(today.getHours()).padStart(2, '0');
    let mins = String(today.getMinutes()).padStart(2, '0');
    let finaldate = yyyy+'-'+mm+'-'+dd+' '+hours+':'+mins;
    currentUser.memberSince = finaldate;
    //users.push(currentUser);
    
    //console.log("hi6");
    let plholder = generateAvatar(username[0],100,100);
    const db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });
    //console.log("hi7");
    let qry = 'INSERT INTO users ("username","hashedGoogleId","avatar_url", "memberSince") VALUES (?,?,?,?)';
   // console.log("hi8");
    //console.log(username2);
    let p10 = await db.run(qry,[username2,username2,plholder,finaldate]);
    //console.log("hi9");
    //Creates a new user object and add to users array
}

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) { //, next
    //console.log(req.session.id);
    if (req.session.id) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Function to register a user
async function registerUser(req, res) {
    //console.log("hi7")
    let uname = req.body.registeredusername;
    const db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });
    //console.log("hi133333");
    id3 = req.session.userId;
    id4 = res.locals.userId;
   // let user7 = await db.get('SELECT * FROM users WHERE username = ?',[uname]);
    let user7 = await db.get('SELECT * FROM users WHERE username = ?',[uname]);   
    if(user7!=undefined)
    {
        //console.log("hi2");
        res.render('registerUsername', { regError: "Please enter an unregistered username" });
        return;
    }else{
        //console.log("hi3");
       // await addUser(uname);
       let plholder = generateAvatar(uname[0],100,100);
       await db.run('UPDATE users SET username = ? WHERE id = ?',[uname,id4]);
       await db.run('UPDATE users SET avatar_url = ? WHERE id = ?',[plholder,id4]);
       //console.log("done666");
       let user7 = await db.get('SELECT * FROM users WHERE id = ?',[id4]);
       
        //console.log("hi5");
        res.redirect('/');
        return;
    }
    
    //Registers a new user and redirect appropriately
}

// Function to login a user
async function loginUser(req, res) {
    let uname = req.body.usernameloginentered;
    let user2 = await findUserByUsername(uname);
    
   if( user2 == undefined)
    {
        res.render('loginRegister', { loginError: "Please enter a registered username" });
        return;
    }else{
        if(user2.avatar_url==undefined)
            {
                let avatar_url2 = generateAvatar(username[0],100,100); //generates avatar for user if one doesn't exist
                const db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });
                //console.log("hi13334");
                await db.run('UPDATE users SET avatar_url = ? WHERE username = ?',[avatar_url2,uname]);
            }
        res.locals.loggedIn = true;
        req.session.loggedIn  = true;
        req.session.userId = user2.id;
        res.locals.userId = user2.id;
        loggedIn = true;
        const posts = await getPosts();
        const user = user2;
        res.render('home', { posts, user });
        return;
    }
    //Logs in a user and redirect appropriately
}

// Function to logout a user
function logoutUser(req, res) {
    res.locals.loggedIn = false;
    req.session.loggedIn  = false;
    loggedIn = false;
    res.locals.userId = undefined;
    req.session.userId  = undefined;
   // res.redirect('/');
    //Destroys a session and redirect appropriately
}

// Function to render the profile page
async function renderProfile(req, res) {
    const db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });
   const user = await findUserById(res.locals.userId);
   let posts2 = await db.all('SELECT * FROM posts WHERE username = ?',[user.username]);
   posts2 = posts2.slice().reverse();
   if(sortbydate==0)
    {
   posts2 = await db.all('SELECT * FROM posts WHERE username = ? ORDER BY likes DESC',[user.username]);
   res.render('profile', { user, posts2});
    }else{
        res.render('profile', { user, posts2});
    }
   /*let posts2 = [];
    for(let i = 0;i<posts.length;i++)
        {
            if(posts[i].username == user.username)
                {
                    posts2.push(posts[i]);
                }
        }
    */
       
    //Fetches user posts and render the profile page
}

// Function to update post likes
async function updatePostLikes(req, res) {
    const db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });
    let r = req.body.id;
    //let user9 = db.all('SELECT * FROM posts WHERE id = ?',[r]);
    let numlikes = await db.get('SELECT * FROM posts WHERE id = ?',[r]);
    if(numlikes!=undefined)
    {
        //console.log(numlikes);
        //console.log("hi13333339");
        let numlikes2 = numlikes.likes; //is this a number idk
        //console.log(numlikes2);
        let numlikes3 = numlikes2+1; //will this work\
        //console.log(numlikes3);
        let user9 = await db.run('UPDATE posts SET likes = ? WHERE id = ?',[numlikes3,r]);
    }else{
        //console.log("die");
    }

    /*
    for(let i = 0;i<posts.length;i++)
        {
            if(posts[i].id == r)
            {
                posts[i].likes = posts[i].likes + 1;
            }
        }
        */
    //Increments post likes if conditions are met
}

// Function to handle avatar generation and serving
async function handleAvatar(req, res) {
    const db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });
    let uname = req.params.username;
     let user = await db.get('SELECT * FROM users WHERE username = ?',[uname]);
   // let user = findUserByUsername(req.params.username);
    if(user!=undefined){
        let letter = uname[0];
        if(user.avatar_url==undefined)
        {
            let plholder = generateAvatar(letter, 100,100);
            let user0 = await db.exec('UPDATE users SET avatar_url = ? WHERE username = ?',[plholder,uname]);
            res.send(plholder);
//user.avatar_url = generateAvatar(letter, 100,100);
        }else{
           // res.send(plholder);
            res.send(user.avatar_url);
        }
    }
    // Generates and serve the user's avatar image as a url
}

// Function to get the current user from session
function getCurrentUser(req) {
    return findUserById(req.session.userId);
}

// Function to get all posts, sorted by latest first
async function getPosts() {
    const db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });

    let posts2 = await db.all('SELECT * FROM posts');
    return posts2.slice().reverse();
}

async function getPosts2() {
    const db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });

    let posts2 = await db.all('SELECT * FROM posts ORDER BY likes');// DESC
    return posts2.slice().reverse();//reverse so don't have to add DESC
}

// Function to add a new post
async function addPost(title, content, user) {
    let user7 = user.username;
    /*let currentPost = {};
    currentPost.id = currentpostid;
    currentpostid =  currentpostid+1;
    currentPost.title = title;
    currentPost.content = content;
    currentPost.username = user.username; //or user.username? idk?*/
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    let hours = String(today.getHours()).padStart(2, '0');
    let mins = String(today.getMinutes()).padStart(2, '0');
    let finaldate = yyyy+'-'+mm+'-'+dd+' '+hours+':'+mins;
   // currentPost.timestamp = finaldate;
    //currentPost.likes = 0;
  //  posts.push(currentPost);
    const db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });
    let qry = 'INSERT INTO posts ("title", "content","username","timestamp","likes") VALUES (?,?,?,?,?)';
    //console.log("bf");
    let o11=0;
    //console.log(user7);
    let o10 = await db.run(qry,[title,content,user7,finaldate,o11]);
    //console.log("af");
    //Creates a new post object and add to posts array
}

// Function to generate an image avatar
function generateAvatar(letter, width = 100, height = 100) {
    // TODO: Generate an avatar image with a letter
    // Steps:
    // 1. Choose a color scheme based on the letter
    // 2. Create a canvas with the specified width and height
    // 3. Draw the background color
    // 4. Draw the letter in the center
    // 5. Return the avatar as a PNG buffer
    

    //creates canvas object
    const { createCanvas } = require("canvas");
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    //gets color for canvas based on username's first letter
    let colorsArr = ["blue", "red", "orange", "yellow", "violet", "indigo", "purple", "cyan", "turquoise", "maroon", "pink", "magenta", "black"
        ,"grey","silver","olive","brown","aquamarine","lime","bronze"];
    let index5 = (letter.charCodeAt(0))%20;

    context.fillStyle = colorsArr[index5];
    context.fillRect(0, 0, width, height);
    context.font  =  "40pt sans-serif";
    context.textAlign  =  "center";
    context.textBaseline  =  "middle";
    context.fillStyle = "#fff";
    context.fillText(letter, width/2, height/2);
    return  canvas.toDataURL("image/png");  //returns avatar url
}
