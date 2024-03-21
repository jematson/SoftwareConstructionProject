var fs = require('fs');
const { MongoClient } = require("mongodb");
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const data = fs.readFileSync('users.json');
const jsonData = JSON.parse(data);
console.log(jsonData);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

const messageCenter = {
  default: ' ',
  signUpError: 'Error: user already exists',
  signUpSuccess: 'Sign up successful!',
  signInError0: 'Error: user does not exist',
  signInError1: 'Error: username and password do not match',
  signInError3: 'Error: What just happened?',
  signInError4: 'Error: user banned'
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
      send_user(`${req.body.uid}`, `${req.body.pwd}`).catch(console.dir)
      res.render('pages/page', {
        messageCenter: messageCenter.signUpSuccess,
        attemptsDisplay: attemptsDisplay.default
      });
    }
  })()

  /*

  // Check if username is already taken
  var taken = false;
  for(let i=0; i < jsonData.users.length; ++i) {
    console.log(jsonData.users[i].uid);
    if(jsonData.users[i].uid == `${req.body.uid}`) {
      taken=true;
    }
  }
  // If username free, send username and password to json file
  if(taken == false) {
    jsonData.users.push({
      uid: `${req.body.uid}`,
      pwd: `${req.body.pwd}`,
      attempts: 5,
      banned: false
    });
    fs.writeFileSync('users.json', JSON.stringify(jsonData));
    // Display successful sign up message
    res.render('pages/page', {
      messageCenter: messageCenter.signUpSuccess,
      attemptsDisplay: attemptsDisplay.default
    });
  } else {
    // Display sign up error
    res.render('pages/page', {
      messageCenter: messageCenter.signUpError,
      attemptsDisplay: attemptsDisplay.default
    });
  }
  */

});


// Sign In
app.post('/signin', (req, res) => {
  console.log(`User clicked sign in`);

  (async() => {
    // Search database for the given username
    stored_pwd = await check_password(`${req.body.uid}`);

    if(`${req.body.pwd}` == stored_pwd) {
      res.render('pages/success');
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
  add_video(`${req.body.url}`).catch(console.dir);

  res.render('pages/success');
});

app.post('/playvideo', (req, res) => {
  res.render('pages/video_player');
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
  res.render('pages/success');
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
        attempts: 5
    }
    const result = await mycollection.insertOne(doc);
    console.log(`A document was inserted with the _id: ${result.insertedId}`);
  } finally {
    await client.close();
  }
}

async function retrieve_user(uid) {
  try {
      console.log("inside run of server")
      // define a database and collection on which to run the method
      const database = client.db("BineData");
      const people = database.collection("users");
      // specify the document field
      const fieldName = "username";
      // specify an optional query document
      const query = { username: uid };
      const distinctValues = await people.distinct(fieldName, query);
      return distinctValues[0];
  } finally {
      //await client.close();
  }
}

async function check_password(uid) {
  try {
      console.log("inside run of server")
      // define a database and collection on which to run the method
      const database = client.db("BineData");
      const people = database.collection("users");
      // specify the document field
      const fieldName = "password";
      // specify an optional query document
      const query = { username: uid };
      const distinctValues = await people.distinct(fieldName, query);
      return distinctValues[0];
  } finally {
      //await client.close();
  }
}

async function add_video(url) {
  try {
    const mydatabase = client.db("BineData");
    const mycollection = mydatabase.collection("videos");
    // create a document to insert
    const doc = {
        link: url
    }
    const result = await mycollection.insertOne(doc);
    console.log(`A document was inserted with the _id: ${result.insertedId}`);
  } finally {
    await client.close();
  }
}