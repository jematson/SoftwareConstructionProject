var fs = require('fs');
const { MongoClient } = require("mongodb");
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const crypto = require('crypto');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// Display messages for signin/signup page
const messageCenter = {
  default: ' ',
  signUpError: 'Error: user already exists',
  signUpSuccess: 'Sign up successful!',
  signInError0: 'Error: user does not exist',
  signInError1: 'Error: username and password do not match',
  signInError3: 'Error: What just happened?',
  signInError4: 'Error: user banned',
  signInDelay: 'User role not yet assigned. Wait for admin.'
}
const attemptsDisplay = {
  default: ' ',
  attempts: 'Attempts remaining: ',
}

// Sign Up
app.post('/signup', (req,res) => {
  console.log(`User clicked sign up`);

  (async() => {
    // Search database for the given username
    requested_user = await retrieve_user(`${req.body.uid}`);
    // If username is taken in database, display error
    if(requested_user == `${req.body.uid}`) {
      res.render('pages/page', {
        messageCenter: messageCenter.signUpError,
        attemptsDisplay: attemptsDisplay.default
      });
    // If username is free, add new user to database
    } else {
      hashed_pwd = crypto.createHash('sha256').update(`${req.body.pwd}`).digest('hex');
      send_user(`${req.body.uid}`, hashed_pwd).catch(console.dir)
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
    stored_pwd = await check_password(`${req.body.uid}`);
    attempts_left= await check_attempts(`${req.body.uid}`);
    entered_pwd = crypto.createHash('sha256').update(`${req.body.pwd}`).digest('hex');
    
    // If password matches and user not banned, check role and display page
    if(entered_pwd == stored_pwd && attempts_left > 0) {
      reset_attempts(`${req.body.uid}`, 5).catch(console.dir)
      role = await check_role(`${req.body.uid}`);

      list = await get_vids();
      list.sort();

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
    // If user has used up all attempts, display ban message
    } else if(attempts_left <= 0) {
      res.render('pages/page', {
        messageCenter: messageCenter.signInError4,
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
        messageCenter: messageCenter.signInError1,
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
app.get('/playvideo', (req, res) => {
  (async() => {
    link = await retrieve_video(`${req.query.name}`);
    analytics_likes = await get_likes(`${req.query.name}`);
    analytics_dislikes = await get_dislikes(`${req.query.name}`);
    comments = await get_feedback(`${req.query.name}`);
    // Check for video actually exists and link is not undefined
    if (!(link == undefined)){
      res.render('pages/video_player', {
        vid_link: link,
        vid_title: `${req.query.name}`,
        role: `${req.query.current_role}`,
        likes: analytics_likes,
        manager_feedback: comments,
        dislikes: analytics_dislikes
      });
    } 
  })()
});

// Delete Video
app.get('/deletevideo', (req, res) => {
  (async() => {
    delete_video(`${req.query.name}`);
    list = await get_vids();
    list.sort();
    res.render('pages/editor', { titles: list });
  })()
});

// Like Video
app.post('/likevideo', (req, res) => {
  (async() => {
    like_video(`${req.body.name}`).catch(console.dir)
    console.log(`liked video`);
    link = await retrieve_video(`${req.body.name}`);
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
    link = await retrieve_video(`${req.body.name}`);
    analytics = await get_likes(`${req.body.name}`);
    comments = await get_feedback(`${req.body.name}`);
    res.render('pages/video_player', {
      vid_link: link,
      vid_title: `${req.body.name}`,
      role: `${req.body.current_role}`,
      likes: analytics,
      manager_feedback: comments
    });
  })()
});

// Dislike Video
app.post('/dislikevideo', (req, res) => {
  (async() => {
    dislike_video(`${req.body.name}`).catch(console.dir)
    console.log(`disliked video`);
    link = await retrieve_video(`${req.body.name}`);
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

// MongoDB access functions
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

async function send_user(uid, pwd) {
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
    console.log(`A document was inserted with the _id: ${result.insertedId}`);
  } finally {}
}

async function retrieve_user(uid) {
  try {
      console.log("inside run of server")
      const database = client.db("BineData");
      const people = database.collection("users");
      // specify the document field
      const fieldName = "username";
      // specify an optional query document
      const query = { username: uid };
      const distinctValues = await people.distinct(fieldName, query);
      return distinctValues[0];
  } finally {}
}

async function check_password(uid) {
  try {
      console.log("inside run of server")
      const database = client.db("BineData");
      const people = database.collection("users");
      // specify the document field
      const fieldName = "password";
      // specify an optional query document
      const query = { username: uid };
      const distinctValues = await people.distinct(fieldName, query);
      return distinctValues[0];
  } finally {}
}

async function check_role(uid) {
  try {
      console.log("inside run of server")
      const database = client.db("BineData");
      const people = database.collection("users");
      // specify the document field
      const fieldName = "role";
      // specify an optional query document
      const query = { username: uid };
      const distinctValues = await people.distinct(fieldName, query);
      return distinctValues[0];
  } finally {}
}

async function check_attempts(uid) {
  try {
      console.log("inside run of server")
      const database = client.db("BineData");
      const people = database.collection("users");
      // specify the document field
      const fieldName = "attempts";
      // specify an optional query document
      const query = { username: uid };
      const distinctValues = await people.distinct(fieldName, query);
      return distinctValues[0];
  } finally {}
}

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

async function reset_attempts(uid, num) {
  try {
    const mydatabase = client.db("BineData");
    const mycollection = mydatabase.collection("users");
    
    const myquery = { username: uid };
    const newvalue = { $set: {attempts: num}}

    const result = await mycollection.updateOne(myquery, newvalue);
    console.log(uid + ` attempts decremented`);
  } finally {}
}

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
    console.log(`A document was inserted with the _id: ${result.insertedId}`);
  } finally {}
}

async function delete_video(name) {
  try {
    const mydatabase = client.db("BineData");
    const mycollection = mydatabase.collection("videos");
    const myquery = { title: name };
    mycollection.deleteOne(myquery);
  } finally {}
}

async function retrieve_video(name) {
  try {
      console.log("inside run of server")
      const database = client.db("BineData");
      const people = database.collection("videos");
      // specify the document field
      const fieldName = "link";
      // specify an optional query document
      const query = { title: name };
      const distinctValues = await people.distinct(fieldName, query);
      return distinctValues[0];
  } finally {}
}

async function get_vids() {
  try {
      console.log("inside run of server")
      const database = client.db("BineData");
      const vid_collection = database.collection("videos");
      const videos = await vid_collection.find({}, { projection: { title: 1, _id: 0 } }).toArray();
      return videos.map(video => video.title);
  } finally {}
}

async function like_video(name) {
  try {
    const mydatabase = client.db("BineData");
    const mycollection = mydatabase.collection("videos");
    
    const myquery = { title: name };
    const newvalue = { $inc: {likes: 1}}

    const result = await mycollection.updateOne(myquery, newvalue);
    console.log(name + ` likes increased`);
  } finally {}
}


async function add_feedback(name, data) {
    try {
    const mydatabase = client.db("BineData");
    const mycollection = mydatabase.collection("videos");
    
    const myquery = { title: name };
    const newvalue = { $set: {feedback: data}}

    const result = await mycollection.updateOne(myquery, newvalue);
    console.log(name + ` likes increased`);
  } finally {}
}

async function dislike_video(name) {
  try {
    const mydatabase = client.db("BineData");
    const mycollection = mydatabase.collection("videos");
    
    const myquery = { title: name };
    const newvalue = { $inc: {dislikes: 1}}

    const result = await mycollection.updateOne(myquery, newvalue);
    console.log(name + ` dislikes increased`);
  } finally {}
}


async function get_feedback(name) {
  try {
      console.log("inside run of server")
      const database = client.db("BineData");
      const people = database.collection("videos");
      // specify the document field
      const fieldName = "feedback";
      // specify an optional query document
      const query = { title: name };
      const distinctValues = await people.distinct(fieldName, query);
      return distinctValues[0];
  } finally {}
}


async function get_likes(name) {
  try {
      console.log("inside run of server")
      const database = client.db("BineData");
      const people = database.collection("videos");
      // specify the document field
      const fieldName = "likes";
      // specify an optional query document
      const query = { title: name };
      const distinctValues = await people.distinct(fieldName, query);
      return distinctValues[0];
  } finally {}
}

async function get_dislikes(name) {
  try {
      console.log("inside run of server")
      const database = client.db("BineData");
      const people = database.collection("videos");
      // specify the document field
      const fieldName = "dislikes";
      // specify an optional query document
      const query = { title: name };
      const distinctValues = await people.distinct(fieldName, query);
      return distinctValues[0];
  } finally {}
}