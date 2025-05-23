const { createServer } = require('node:http');

const hostname = '127.0.0.1';
const port = 3000;

const server = createServer(async (req, res) => {
  if (req.url === '/api/data' && req.method === 'GET') {
    const response = await fetch('http://ec2-35-90-236-177.us-west-2.compute.amazonaws.com:3000/transactions/filter/pending');

    const responseData = {
      message: 'Here is your f data',
      data: response.json(),
      status: response.status,
      timestamp: new Date().toISOString(),
    };
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(responseData));
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Not Found');
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
