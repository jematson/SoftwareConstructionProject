var fs = require('fs');
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
  signInError1: 'Error: user does not exist',
  signInError2: 'Error: username and password do not match',
  signInError3: 'Error: What just happened?'
}

// Sign Up
app.post('/signup', (req,res) => {
  console.log(`User clicked sign up`);

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
    });
    fs.writeFileSync('users.json', JSON.stringify(jsonData));
    // Display successful sign up message
    res.render('pages/page', {
      messageCenter: messageCenter.signUpSuccess
    });
  } else {
    // Display sign up error
    res.render('pages/page', {
      messageCenter: messageCenter.signUpError
    });
  }
});

// Sign In
app.post('/signin', (req, res) => {
  console.log(`User clicked sign in`);

  var signInCondition = false;
  for(let i=0; i < jsonData.users.length; ++i) {
    console.log(jsonData.users[i]);
    // Condition 2: Correct sign in
    if(jsonData.users[i].uid == `${req.body.uid}` && jsonData.users[i].pwd == `${req.body.pwd}`) {
      signInCondition = true;
    }
  }

  if(signInCondition) {
    res.render('pages/success');
  } else {
    res.render('pages/page', {
      messageCenter: messageCenter.signInError2
    });
  }
});

// Log Out
app.post('/', (req, res) => {
  console.log(`User logged out`);
  res.render('pages/page', {
    messageCenter: messageCenter.default
  });
});

const port = 10000;
app.get('/', (req, res) => {
  res.render('pages/page', {
    messageCenter: messageCenter.default
  });
});
app.listen(port, () => {
  console.log(`Server running on port${port}`);
});
