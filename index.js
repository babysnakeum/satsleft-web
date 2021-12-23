const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');

const port = 3019;

let sockets = [];

const server = new WebSocket.Server({
  port: port
});

server.on('connection', function(socket, req) {
  console.log('client connected');
  sockets.push(socket);
  console.log(`clients: ${server.clients.size}`);

  const file = fs.readFile('satsleft.log', 'UTF-8', (err, data) => {
    if(err) {
      console.log('error reading the file', err);
    } else {
      if(data != "") {
        lines = data.split(/\r?\n/).filter(n => n);
        lines.forEach((line) => {
          socket.send(line);
        });
      }
    }
  });

  // When you receive a message, send that message to every socket.
  socket.on('message', function(msg) {
    mess = `${msg}`;
    mess = mess.split('/')[2];
    console.log(mess);
    fs.appendFile('satsleft.log', `${mess}\n`, function(err) {
      if(err) console.log("could not write to file", err);
    });
    server.clients.forEach(client => {
      client.send(mess);
      client.send("block found");
    });
  });

  // When a socket closes, or disconnects, remove it from the array.
  socket.on('close', function() {
    console.log("socket closed");
    sockets = sockets.filter((s) => s == socket);

    console.log(`${server.clients.size} clients left`);
  });
});

const new_server = http.createServer((req, res) => {
  console.log("new request coming in");
  console.log(req.headers);

  if(typeof req.headers.authorization === 'undefined' || req.headers.authorization != 'changeme') {
    res.statusCode = 403;
    res.end();
    return;
  }

  let client = websocket_client();
  client.then(value => {
    value.send(req.url);
    value.close();
  });

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('appended!\n');
});

new_server.listen(8080, "127.0.0.1", () => {
  console.log(`Server running at http://server:8080/`);
});

async function websocket_client() {
  let client = new WebSocket(`ws://localhost:${port}`);
  await new Promise(resolve => client.once('open', resolve));
  return client;
}

