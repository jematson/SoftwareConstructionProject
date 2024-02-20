
var http = require('http');
var fs = require('fs');
var url = require('url');
const readline = require('readline');

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const data = fs.readFileSync('users.json');
const jsonData = JSON.parse(data);
console.log(jsonData);

app.set('view engine', 'ejs');

const messageCenter = {
  default: ' ',
  signUpError: 'Error: user already exists',
  signUpSuccess: 'Sign up successful!',
  signInError1: 'Error: user does not exist',
  signInError2: 'Error: username and password do not match',
}

app.use(bodyParser.urlencoded({ extended: true }));

// Sign Up
app.post('/signup', (req,res) => {
  console.log(`User clicked sign up`);

  //Send username and password to json file
  jsonData.users.push({
    uid: `${req.body.uid}`,
    pwd: `${req.body.pwd}`,
  });
  fs.writeFileSync('users.json', JSON.stringify(jsonData));

  // Display successful sign up message
  res.render('pages/page', {
    messageCenter: messageCenter.signUpSuccess
  });
  
  /* Sending username and password to text file
  fs.appendFile('test.txt', `${req.body.uid} ${req.body.pwd}\n`, function (err) {
    if (err) throw err;
    console.log('Saved new uid and pwd');   
  });
  */
  
});

// Sign In
app.post('/signin', (req, res) => {
  console.log(`User clicked sign in`);

  var success = false;

  for(let i=0; i < jsonData.users.length; ++i) {
    console.log(jsonData.users[i].uid);
    if(jsonData.users[i].uid == `${req.body.uid}`) {
      success=true;
    }
  }

  if(success) {
    res.render('pages/success');
  } else {
    res.render('pages/page', {
      messageCenter: messageCenter.signInError1
    });
  }

  /*
  var lineReader = require('readline').createInterface({
    input:require('fs').createReadStream('test.txt')
  });
  lineReader.on('line', function (line) {
    if(line == `${req.body.uid} ${req.body.pwd}`)
      //res.sendFile(__dirname + '/success.html');
      res.render('pages/page', {
        messageCenter: messageCenter
      });
  });
  lineReader.on('close', function() {
    console.log('file closed');
  });
  */
  
});

// Log Out
app.post('/home', (req, res) => {
  console.log(`User logged out`);
  //res.sendFile(__dirname + '/pages/page');
  res.render('pages/page', {
    messageCenter: messageCenter.default
  });
});

const port = 10000;
app.get('/', (req, res) => {
  //res.sendFile(__dirname + '/pages/page');
  res.render('pages/page', {
    messageCenter: messageCenter.default
  });
});
app.listen(port, () => {
  console.log(`Server running on port${port}`);
});
