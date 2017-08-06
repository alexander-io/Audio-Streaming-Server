var express = require('express'), fs = require('fs');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var socket_stream = require('socket.io-stream');

// var filename = __dirname + '/penningen.mp3' ;
var filename = __dirname + '/lofi.mp3' ;

app.use(express.static(`${__dirname}/html`));

server.listen(8000);

// send the index that contains the <audio> element
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/html/indexmp3.html');
});

/*
 * the client will emit the 'connection' event on the io() function call, the call looks like this :
 *  var socket = io('http://localhost:' + window.location.port);
 *
 *
 */
io.on('connection', function (socket) {

  console.log('socket connection established with client');

  // emit start event to client
  socket.emit('start', { hello: 'world' });

  // listen for stream event from client, this indicates that the client is ready to start receiving data
  socket.on('stream', function (data) {
    console.log('data :', data); // log the data that's sent from the client when emitting the 'stream' event

    // create socket.io-stream
    var stream = socket_stream.createStream();

    /*
     * emit the audio-stream event and send two parameters
     *  @param stream, require('socket.io-stream').createStream()
     *  @param obj, {name : <name_of_mp3_file> }
     *
     */
    socket_stream(socket).emit('audio-stream', stream, { name: filename });

    /* read stream from the file, pipe the data to the stream that's established to the client
     *
     * as we read data in from the file, pipe it to the stream
     * for each data chunk that's sent, a 'data' event will be emitted
     */
    fs.createReadStream(filename).pipe(stream);
  });

});
