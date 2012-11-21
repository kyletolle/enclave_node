var http = require('http'),
    fs = require('fs'),
    index;

fs.readFile('./index.html', function (err, data) {
  if (err) throw err;
  index = data;
});

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(index);
}).listen(3000, '127.0.0.1');

console.log('Server running at http://127.0.0.1:3000/');