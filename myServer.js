
var http = require('http');
var fs = require('fs');
var url = require('url');
const readline = require('readline');

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

function uid_good(uid) {
  return (uid.length >= 4);
}

app.use(bodyParser.urlencoded({ extended: true }));

// Sign Up
app.post('/signup', (req,res) => {
  console.log(`User clicked sign up`);
  //res.send(`You clicked sign up. Your username is: ${req.body.uid}`);
  res.redirect('/');

  if(uid_good(`${req.body.uid}`)) {
    fs.appendFile('test.txt', `${req.body.uid} ${req.body.pwd}\n`, function (err) {
      if (err) throw err;
      console.log('Saved new uid and pwd');
      
    });
  } else {
      
  }   
});

// Sign In
app.post('/signin', (req, res) => {
  console.log(`User clicked sign in`);

  var lineReader = require('readline').createInterface({
    input:require('fs').createReadStream('test.txt')
  });
  lineReader.on('line', function (line) {
    if(line == `${req.body.uid} ${req.body.pwd}`)
      res.sendFile(__dirname + '/success.html');
  });
  lineReader.on('close', function() {
    console.log('file closed');
  });
});

// Log Out
app.post('/logout', (req, res) => {
  console.log(`User logged out`);
  res.sendFile(__dirname + '/page.html');
});

const port = 10000;
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/page.html');
});
app.listen(port, () => {
  console.log(`Server running on port${port}`);
});
