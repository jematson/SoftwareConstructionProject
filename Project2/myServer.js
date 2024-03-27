var fs = require('fs');
const { MongoClient } = require("mongodb");
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const crypto = require('crypto');

/*
const data = fs.readFileSync('users.json');
const jsonData = JSON.parse(data);
console.log(jsonData);
*/

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

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
    // If username is within database, display error
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
    // Search database for the given username
    stored_pwd = await check_password(`${req.body.uid}`);
    entered_pwd = crypto.createHash('sha256').update(`${req.body.pwd}`).digest('hex');
    attempts_left= await check_attempts(`${req.body.uid}`);
    
    // If password matches, check role and display page
    if(entered_pwd == stored_pwd && attempts_left > 0) {
      role = await check_role(`${req.body.uid}`);
      if (role == "viewer"){
        res.render('pages/viewer');
      } else if (role == "editor"){
        res.render('pages/editor');
      } else if (role == "manager") {
        res.render('pages/manager');
      } else {
        res.render('pages/page', {
          messageCenter: messageCenter.signInDelay,
          attemptsDisplay: attemptsDisplay.default
        });
      }
    // If password does not match, display mismatch error
    } else {
      res.render('pages/page', {
        messageCenter: messageCenter.signInError1,
        attemptsDisplay: attemptsDisplay.default
      });
    }
  })()

  /*
  // Sign in Conditions
  // 0 = user does not exist
  // 1 = username and password do not match
  // 2 = username and password match, success
  // 4 = user banned

  let signInCondition = 0;
  var currUser = -1;
  for(let i=0; i < jsonData.users.length; ++i) {
    // Condition 2: Correct sign in
    if((jsonData.users[i].uid == `${req.body.uid}`) && (jsonData.users[i].pwd == `${req.body.pwd}`) && jsonData.users[i].banned == false) {
      signInCondition = 2;
      jsonData.users[i].attempts = 5;
      fs.writeFileSync('users.json', JSON.stringify(jsonData));
    } 
    else if((jsonData.users[i].uid == `${req.body.uid}`) && (jsonData.users[i].pwd == `${req.body.pwd}`) && jsonData.users[i].banned == true) {
      signInCondition = 4;
    }
    // Condition 1: Username exists, pwd wrong
    else if((jsonData.users[i].uid == `${req.body.uid}`) && (jsonData.users[i].pwd != `${req.body.pwd}`)) {
      signInCondition = 1;
      currUser = i;
      jsonData.users[i].attempts -= 1;
      if(jsonData.users[i].attempts < 0){
        jsonData.users[i].attempts = 0;
      }
      if(jsonData.users[i].attempts == 0) {
        jsonData.users[i].banned = true;
      }
      fs.writeFileSync('users.json', JSON.stringify(jsonData));
    }
  }

  if(signInCondition == 2) {
    res.render('pages/success');
  } else if (signInCondition == 1){
    if(jsonData.users[currUser].attempts == 0) {
      res.render('pages/page', {
        messageCenter: messageCenter.signInError4,
        attemptsDisplay: attemptsDisplay.default
      });
    }
    else {
      res.render('pages/page', {
        messageCenter: messageCenter.signInError1,
        attemptsDisplay: attemptsDisplay.attempts + jsonData.users[currUser].attempts
      });
    }
  } else if (signInCondition == 0) {
    res.render('pages/page', {
      messageCenter: messageCenter.signInError0,
      attemptsDisplay: attemptsDisplay.default
    });
  } else if (signInCondition == 4) {
    res.render('pages/page', {
      messageCenter: messageCenter.signInError4,
      attemptsDisplay: attemptsDisplay.default
    });
  } else {
    res.render('pages/page', {
      messageCenter: messageCenter.signInError3,
      attemptsDisplay: attemptsDisplay.default
    });
  }
  */
});

// Add Video
app.post('/addvideo', (req, res) => {
  add_video(`${req.body.url}`, `${req.body.name}`).catch(console.dir);
  res.render('pages/editor');
});

// Play Video
app.get('/playvideo', (req, res) => {
  (async() => {
    link = await retrieve_video(`${req.query.name}`);
    res.render('pages/video_player', {
      vid_link: link,
      vid_title: `${req.query.name}`
    });
  })()
});

// Like Video
app.post('/likevideo', (req, res) => {
  (async() => {
    //link = await retrieve_video(`${req.body.name}`);
    like_video(`${req.body.name}`).catch(console.dir)
    console.log(`liked video`);
    res.redirect(`/playvideo?name=${req.body.name}`);
    //res.render('pages/video_player', {
    //  vid_link: `${req.body.curr_vid}`
    //});
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

/*
// Return to Home from video player
app.post('/home', (req, res) => {
  console.log(`User returned to home page`);
  res.render('pages/success');
});
*/

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

async function add_video(url, name) {
  try {
    const mydatabase = client.db("BineData");
    const mycollection = mydatabase.collection("videos");
    // create a document to insert
    const doc = {
        title: name,
        link: url,
        likes: 0
    }
    const result = await mycollection.insertOne(doc);
    console.log(`A document was inserted with the _id: ${result.insertedId}`);
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
