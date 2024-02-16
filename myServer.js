
var http = require('http');
var fs = require('fs');
var url = require('url');
const readline = require('readline');

const express = require('express');
const bodyParser = require('body-parser');
const app = express();


app.use(bodyParser.urlencoded({ extended: true }));

app.post('/signup', (req,res) => {
  console.log(`User clicked sign up`);
  res.send(`you clicked sign up and your uid is ${req.body.uid}`);

  fs.appendFile('test.txt', `${req.body.uid} ${req.body.pwd}\n`, function (err) {
    if (err) throw err;
    console.log('Saved new uid and pwd');
  });
});

app.post('/signin', (req, res) => {
  console.log(`User clicked sign in`);
  //res.send(`you clicked sign in and your uid is ${req.body.uid}`);

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
  /*
  void (async () => {
    const rl = readline.createInterface({
      input: fs.createReadStream('test.txt'),
      crlfDelay: Infinity,
    });

    rl.on('line', (line) => {
      console.log(line);
      if(`${req.body.uid} ${req.body.pwd}` == line)
        res.send('nice job, you in');
      else
        res.send('wow, you kinda suck');
    });

    await new Promise((res) => rl.once('close', res));
  })();
  */
});

const port = 10000;
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/page.html');
});
app.listen(port, () => {
  console.log(`Server running on port${port}`);
});






/*
http.createServer(function (req, res) {

  fs.readFile('test.txt', 'utf8', (err, data) => {
   if (err) {
    console.error(err);
    return;
   }
   console.log(data);
  });

  fs.readFile('page.html', function(err, data) {
   currentURL = url.parse(req.url,true);
   console.log(currentURL);			
   res.writeHead(200, {'Content-Type': 'text/html'});
   res.write(data);
   return res.end();
  });
	
}).listen(8080);

*/