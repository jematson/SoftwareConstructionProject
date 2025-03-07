var fs = require('fs');
const { MongoClient } = require("mongodb");
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Include for encryting passwords
const crypto = require('crypto');

// Include for dynamically updated html pages
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// Display messages for signin/signup page
const messageCenter = {
  default: ' ',
  signUpError: 'Error: user already exists',
  signUpSuccess: 'Sign up successful!',
  signInError1: 'Error: user does not exist',
  signInError2: 'Error: user banned',
  signInError3: 'Error: username and password do not match',
  signInDelay: 'User role not yet assigned. Wait for admin.'
}
const attemptsDisplay = {
  default: ' ',
  attempts: 'Attempts remaining: ',
}

// ***********************************
// ********* Website Actions *********
// ***********************************

// Sign Up
app.post('/signup', (req,res) => {
  console.log(`User clicked sign up`);
  (async() => {
    // Search database for the given username
    requested_user = await retrieve_user_data(`${req.body.uid}`, "username");
    // If username is taken in database, display error
    if(requested_user == `${req.body.uid}`) {
      res.render('pages/page', {
        messageCenter: messageCenter.signUpError,
        attemptsDisplay: attemptsDisplay.default
      });
    // If username is free, add new user to database
    } else {
      // Encrypt password with sha256 hash
      hashed_pwd = crypto.createHash('sha256').update(`${req.body.pwd}`).digest('hex');
      add_user(`${req.body.uid}`, hashed_pwd).catch(console.dir)
      res.render('pages/page', {
        messageCenter: messageCenter.signUpSuccess,
        attemptsDisplay: attemptsDisplay.default
      });
    }
  })()
});

// Sign In
app.post('/signin', (req, res) => {
  console.log(`User clicked sign in`);
  (async() => {
    // Search database for the given username and collect data
    stored_pwd = await retrieve_user_data(`${req.body.uid}`, "password");
    attempts_left= await retrieve_user_data(`${req.body.uid}`, "attempts");
    entered_pwd = crypto.createHash('sha256').update(`${req.body.pwd}`).digest('hex');
    
    // If password matches and user not banned, display website view
    if(entered_pwd == stored_pwd && attempts_left > 0) {
      reset_attempts(`${req.body.uid}`, 5).catch(console.dir)
      role = await retrieve_user_data(`${req.body.uid}`, "role");
    
      // Retrieve videos to display
      list = await get_vids();
      list.sort();

      // Check user role and display corresponding website view
      if (role == "viewer"){
        res.render('pages/viewer', { titles: list });
      } else if (role == "editor"){
        res.render('pages/editor', { titles: list });
      } else if (role == "manager") {
        res.render('pages/manager', { titles: list });
      } else {
        res.render('pages/page', {
          messageCenter: messageCenter.signInDelay,
          attemptsDisplay: attemptsDisplay.default
        });
      }
    // If user does not exists, display error
    } else if(stored_pwd == undefined) {
      res.render('pages/page', {
        messageCenter: messageCenter.signInError1,
        attemptsDisplay: attemptsDisplay.default
      });
    // If user has used up all attempts, display ban message
    } else if(attempts_left <= 0) {
      res.render('pages/page', {
        messageCenter: messageCenter.signInError2,
        attemptsDisplay: attemptsDisplay.default
      });
    // If password does not match, display mismatch error
    } else {
      // Decrement attempts remaining, but don't go below 0
      if(attempts_left > 0) {
        dec_attempts(`${req.body.uid}`).catch(console.dir)
      } else {
        reset_attempts(`${req.body.uid}`, 0).catch(console.dir)
      }
      res.render('pages/page', {
        messageCenter: messageCenter.signInError3,
        attemptsDisplay: attemptsDisplay.attempts + attempts_left
      });
    }
  })()
});

// Add Video
app.post('/addvideo', (req, res) => {
  (async() => {
    add_video(`${req.body.url}`, `${req.body.name}`, `${req.body.genre}`).catch(console.dir)
    list = await get_vids();
    list.sort();
    res.render('pages/editor', { titles: list });
  })()
});

// Play Video
app.post('/playvideo', (req, res) => {
  (async() => {
    link = await retrieve_video_data(`${req.body.name}`, "link");
    analytics_likes = await retrieve_video_data(`${req.body.name}`, "likes");
    analytics_dislikes = await retrieve_video_data(`${req.body.name}`, "dislikes");
    comments = await retrieve_video_data(`${req.body.name}`, "feedback");
    // Check for video actually exists and link is not undefined
    if (!(link == undefined)){
      res.render('pages/video_player', {
        vid_link: link,
        vid_title: `${req.body.name}`,
        role: `${req.body.current_role}`,
        likes: analytics_likes,
        manager_feedback: comments,
        dislikes: analytics_dislikes
      });
    } 
  })()
});

// Delete Video
app.post('/deletevideo', (req, res) => {
  (async() => {
    delete_video(`${req.body.name}`);
    list = await get_vids();
    list.sort();
    res.render('pages/editor', { titles: list });
  })()
});

// Like Video
app.post('/likevideo', (req, res) => {
  (async() => {
    increment_field(`${req.body.name}`, "likes").catch(console.dir)
    console.log(`liked video`);
    link = await retrieve_video_data(`${req.body.name}`, "link");
    res.render('pages/video_player', {
      vid_link: link,
      vid_title: `${req.body.name}`,
      role: `${req.body.current_role}`
    });
  })()
});

// Add Feedback
app.post('/addfeedback', (req, res) => {
  (async() => {
    add_feedback(`${req.body.name}`,`${req.body.vid_feedback}`).catch(console.dir)
    console.log(`video feedback added`);
    link = await retrieve_video_data(`${req.body.name}`, "link");
    analytics_likes = await retrieve_video_data(`${req.query.name}`, "likes");
    analytics_dislikes = await retrieve_video_data(`${req.query.name}`, "dislikes");
    comments = await retrieve_video_data(`${req.body.name}`, "feedback");
    res.render('pages/video_player', {
      vid_link: link,
      vid_title: `${req.body.name}`,
      role: `${req.body.current_role}`,
      likes: analytics_likes,
      dislikes: analytics_dislikes,
      manager_feedback: comments
    });
  })()
});

// Dislike Video
app.post('/dislikevideo', (req, res) => {
  (async() => {
    increment_field(`${req.body.name}`, "dislikes").catch(console.dir)
    console.log(`disliked video`);
    link = await retrieve_video_data(`${req.body.name}`, "link");
    res.render('pages/video_player', {
      vid_link: link,
      vid_title: `${req.body.name}`,
      role: `${req.body.current_role}`,
    });
  })()
});

// Log Out
app.post('/', (req, res) => {
  console.log(`User logged out`);
  res.render('pages/page', {
    messageCenter: messageCenter.default,
    attemptsDisplay: attemptsDisplay.default
  });
});

// Return to Home from video player
app.post('/home', (req, res) => {
  console.log(`User returned to home page`);
  if(`${req.body.current_role}` == "viewer") {
    res.render('pages/viewer', { titles: list });
  } else if (`${req.body.current_role}` == "editor") {
    res.render('pages/editor', { titles: list });
  } else if (`${req.body.current_role}` == "manager") {
    res.render('pages/manager', { titles: list });
  }
});

// Search based on title
app.post('/searchtitle', (req, res) => {
  (async() => {
    console.log(`User searched video database by title`);
    vid_titles = await search_by_title(`${req.body.name}`);
    res.render('pages/search_results', { titles: vid_titles, role: `${req.body.current_role }`});
  })()
});

// Search based on genre
app.post('/searchgenre', (req, res) => {
  (async() => {
    console.log(`User searched video database by genre`);
    vid_titles = await search_by_genre(`${req.body.genre}`);
    res.render('pages/search_results', { titles: vid_titles, role: `${req.body.current_role }`});
  })()
});

const port = 10000;
app.get('/', (req, res) => {
  res.render('pages/page', {
    messageCenter: messageCenter.default,
    attemptsDisplay: attemptsDisplay.default
  });
});
app.listen(port, () => {
  console.log(`Server running on port${port}`);
});

// ********************************************
// ********* MongoDB access functions *********
// ********************************************

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

// Add a given user to the database
async function add_user(uid, pwd) {
  try {
    const mydatabase = client.db("BineData");
    const mycollection = mydatabase.collection("users");
    // create a document to insert
    const doc = {
        username: uid,
        password: pwd,
        attempts: 5,
        role: "temp"
    }
    const result = await mycollection.insertOne(doc);
    console.log(`A user was inserted with the _id: ${result.insertedId}`);
  } finally {}
}

// Add a given video to the database
async function add_video(url, name, genre_cat) {
  try {
    const mydatabase = client.db("BineData");
    const mycollection = mydatabase.collection("videos");
    // create a document to insert
    const doc = {
        title: name,
        link: url,
        likes: 0,
        dislikes: 0,
        genre: genre_cat,
        feedback: ''
    }
    const result = await mycollection.insertOne(doc);
    console.log(`A video was inserted with the _id: ${result.insertedId}`);
  } finally {}
}

// Delete a given video from the database
async function delete_video(name) {
  try {
    const mydatabase = client.db("BineData");
    const mycollection = mydatabase.collection("videos");
    const myquery = { title: name };
    mycollection.deleteOne(myquery);
  } finally {}
}

// Retrieve a given piece of user data from the database
async function retrieve_user_data(uid, data) {
  try {
      const database = client.db("BineData");
      const people = database.collection("users");
      // specify the document field
      const fieldName = data;
      // specify an optional query document
      const query = { username: uid };
      const distinctValues = await people.distinct(fieldName, query);
      return distinctValues[0];
  } finally {}
}

// Retrieve a given piece of video data from the database
async function retrieve_video_data(name, data) {
  try {
      const database = client.db("BineData");
      const people = database.collection("videos");
      // specify the document field
      const fieldName = data;
      // specify an optional query document
      const query = { title: name };
      const distinctValues = await people.distinct(fieldName, query);
      return distinctValues[0];
  } finally {}
}

// Get a list of all videos in the database
async function get_vids() {
  try {
      const database = client.db("BineData");
      const vid_collection = database.collection("videos");
      const videos = await vid_collection.find({}, { projection: { title: 1, _id: 0 } }).toArray();
      return videos.map(video => video.title);
  } finally {}
}

// Increment a given field
async function increment_field(name, field) {
  try {
    const mydatabase = client.db("BineData");
    const mycollection = mydatabase.collection("videos");
    
    const myquery = { title: name };
    const newvalue = { $inc: {[field]: 1}}

    const result = await mycollection.updateOne(myquery, newvalue);
    console.log(name + ` ` + field + ` increased`);
  } finally {}
}

// Decrement the attempts field of the given user
async function dec_attempts(uid) {
  try {
    const mydatabase = client.db("BineData");
    const mycollection = mydatabase.collection("users");
    
    const myquery = { username: uid };
    const newvalue = { $inc: {attempts: -1}}

    const result = await mycollection.updateOne(myquery, newvalue);
    console.log(uid + ` attempts decremented`);
  } finally {}
}

// Reset the attempts field of the given user
async function reset_attempts(uid, num) {
  try {
    const mydatabase = client.db("BineData");
    const mycollection = mydatabase.collection("users");
    
    const myquery = { username: uid };
    const newvalue = { $set: {attempts: num}}

    const result = await mycollection.updateOne(myquery, newvalue);
    console.log(uid + ` attempts reset`);
  } finally {}
}

// Add feedback to the given video
async function add_feedback(name, data) {
    try {
    const mydatabase = client.db("BineData");
    const mycollection = mydatabase.collection("videos");
    
    const myquery = { title: name };
    const existingItem = await mycollection.findOne(myquery);
    const existingFeedback = existingItem.feedback || '';
    const newFeedback = existingFeedback + '\n' + data;

    const newvalue = [{ $set: {feedback: newFeedback}}]
  
    const result = await mycollection.updateOne(myquery, newvalue);
    console.log(`feedback added to ` + name);
  } finally {}
}

// Search for videos with the given title
async function search_by_title(name) {
  try {
    const database = client.db("BineData");
    const vid_collection = database.collection("videos");
    const videos = await vid_collection.find({ title: name }, { projection: { title: 1, _id: 0 } }).toArray();
    return videos.map(video => video.title);
  } finally {}
}

// Search for videos with the given genre tag
async function search_by_genre(name) {
  try {
    const database = client.db("BineData");
    const vid_collection = database.collection("videos");
    const videos = await vid_collection.find({ genre: name }, { projection: { title: 1, _id: 0 } }).toArray();
    return videos.map(video => video.title);
  } finally {}
}