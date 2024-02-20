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

  var signInCondition = 0;
  for(let i=1; i < jsonData.users.length; ++i) {
    // Condition 2: Correct sign in
    if(jsonData.users[i].uid == `${req.body.uid}` && jsonData.user[i].pwd == `${req.body.pwd}`) {
      signInCondition = 2;
    }
    // Condition 1: Username exists, pwd wrong
    else if(jsonData.users[i].uid == `${req.body.uid}`) {
      signInCondition = 1;
    }
  }

  if(signInCondition == 2) {
    res.render('pages/success');
  } else if (signInCondition == 1) {
    res.render('pages/page', {
      messageCenter: messageCenter.signInError2
    });
  } else if (signInCondition == 0) {
    res.render('pages/page', {
      messageCenter: messageCenter.signInError1
    });
  } else {
    res.render('pages/page', {
      messageCenter: messageCenter.signInError3
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
