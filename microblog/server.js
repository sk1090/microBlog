const express = require('express');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');
const canvas = require('canvas');

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Configuration and Setup
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const app = express();
const PORT = 3000;
let currentpostid = 3;

require('dotenv').config();
const accessToken = process.env.EMOJI_API_KEY;
let ry = ""+accessToken;


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
app.get('/', (req, res) => {
    const posts = getPosts();

    const user = getCurrentUser(req)||findUserById(res.locals.userId) || {};
    //getCurrentUser(req) || {};

    res.render('home', { posts, user });
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


//Adds a new post and redirect to home
app.post('/posts', (req, res) => {
    // TODO: 
   let user2 = findUserById(res.locals.userId);
    let postTitle =  req.body.PostTitle;
    let postContent = req.body.PostBody;
    addPost(postTitle, postContent, user2);
    res.redirect('/');
});



//updates post likes in posts array
app.post('/like/:id', (req, res) => {
    if(res.locals.loggedIn || req.session.loggedIn)
    {
        updatePostLikes(req,res);
        res.send("loggedin");
    }
});

//Renders profile page
app.get('/profile', isAuthenticated, (req, res) => {
    app.use(isAuthenticated);
    renderProfile(req, res);
});

//sends emoji access key to user if they send a fetch request for it
app.get('/getEmojiAccessKey', (req, res) => {
    res.send(accessToken);
});

//Serves the avatar image for the user
app.get('/avatar/:username', (req, res) => {
    handleAvatar(req,res);
});

//Registers a new user
app.post('/register', (req, res) => {
    registerUser(req, res);
    
});

//Logs in a user
app.post('/login', (req, res) => {
    loginUser(req,res);
});

//Logout the user
app.get('/logout', (req, res) => {
    logoutUser(req, res);
});

//Deletes a post if the current user is the owner
app.post('/delete/:id', isAuthenticated, (req, res) => {
    app.use(isAuthenticated);
    for(let i = 0;i<posts.length;i++)
        {
            if(posts[i].id==req.body.id)
                {
                    posts.splice(i,1);
                }
        }
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

// Example data for posts and users
let posts = [
    { id: 1, title: 'Sample Post', content: 'This is a sample post.', username: 'SampleUser', timestamp: '2024-01-01 10:00', likes: 0 },
    { id: 2, title: 'Another Post', content: 'This is another sample post.', username: 'AnotherUser', timestamp: '2024-01-02 12:00', likes: 0 },
];
let postslikedby = [
    {id:1, users: []},
    {id:2, users: []},
];
let users = [
    { id: 1, username: 'SampleUser', avatar_url: undefined, memberSince: '2024-01-01 08:00' },
    { id: 2, username: 'AnotherUser', avatar_url: undefined, memberSince: '2024-01-02 09:00' },
];


// Function to find a user by username
function findUserByUsername(username) {
    for (let i = 0; i < users.length; i++) {
       if(users[i].username === username)
        {
            return users[i];
        }
      }
      return undefined;
    //Returns user object if found, otherwise return undefined
}

// Function to find a user by user ID
function findUserById(userId) {   
    //Returns user object if found, otherwise return undefined
    for (let i = 0; i < users.length; i++) {
        if(users[i].id == userId)
         {
             return users[i];
         }
       }
       return undefined;
}

// Function to add a new user
function addUser(username) {
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
    users.push(currentUser);

    //Creates a new user object and add to users array
}

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) { //, next
    console.log(req.session.id);
    if (req.session.id) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Function to register a user
function registerUser(req, res) {
    let username = req.body.registeredusername;
    if(findUserByUsername(username)!=undefined)
    {
        res.render('loginRegister', { regError: "Please enter an unregistered username" });
        return;
    }else{
        addUser(username);
        res.render('loginRegister');
        return;
    }
    
    //Registers a new user and redirect appropriately
}

// Function to login a user
function loginUser(req, res) {
    let username = req.body.usernameloginentered;
    let user2 = findUserByUsername(username);
    
   if( user2 == undefined)
    {
        res.render('loginRegister', { loginError: "Please enter a registered username" });
        return;
    }else{
        if(user2.avatar_url==undefined)
            {
                user2.avatar_url = generateAvatar(username[0],100,100); //generates avatar for user if one doesn't exist
                for(let i=0;i<users.length;i++)
                    {
                        if(users[i].username==username)
                        {
                            users[i].avatar_url = user2.avatar_url;
                        }
                    }
            }
        res.locals.loggedIn = true;
        req.session.loggedIn  = true;
        req.session.userId = user2.id;
        res.locals.userId = user2.id;
        loggedIn = true;
        const posts = getPosts();
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
    res.redirect('/');
    //Destroys a session and redirect appropriately
}

// Function to render the profile page
function renderProfile(req, res) {
   const user = findUserById(res.locals.userId);
   let posts2 = [];
    for(let i = 0;i<posts.length;i++)
        {
            if(posts[i].username == user.username)
                {
                    posts2.push(posts[i]);
                }
        }
       res.render('profile', { user, posts2});
    //Fetches user posts and render the profile page
}

// Function to update post likes
function updatePostLikes(req, res) {
    let r = req.body.id;
    for(let i = 0;i<posts.length;i++)
        {
            if(posts[i].id == r)
            {
                posts[i].likes = posts[i].likes + 1;
            }
        }
    //Increments post likes if conditions are met
}

// Function to handle avatar generation and serving
function handleAvatar(req, res) {
    let user = findUserByUsername(req.params.username);
    if(user!=undefined){
        let letter = user.username[0];
        if(user.avatar_url==undefined)
        {
            user.avatar_url = generateAvatar(letter, 100,100);
            for(let i=0;i<users.length;i++)
            {
                if(users[i].username==user.username)
                {
                    users[i].avatar_url = user.avatar_url;
                }
            }
            res.send(user.avatar_url);
        }else{
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
function getPosts() {
    return posts.slice().reverse();
}

// Function to add a new post
function addPost(title, content, user) {
    let currentPost = {};
    currentPost.id = currentpostid;
    currentpostid =  currentpostid+1;
    currentPost.title = title;
    currentPost.content = content;
    currentPost.username = user.username; //or user.username? idk?
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    let hours = String(today.getHours()).padStart(2, '0');
    let mins = String(today.getMinutes()).padStart(2, '0');
    let finaldate = yyyy+'-'+mm+'-'+dd+' '+hours+':'+mins;
    currentPost.timestamp = finaldate;
    currentPost.likes = 0;
    posts.push(currentPost);
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
