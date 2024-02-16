var http = require('http');
var fs = require('fs');
var url = require('url');


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