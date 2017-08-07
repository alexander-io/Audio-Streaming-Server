var express = require('express'), fs = require('fs'), path = require('path')
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var socket_stream = require('socket.io-stream');

// const {exec} = require('child_process')

/*
 * https://stackoverflow.com/questions/21491091/splitting-an-audio-mp3-file
 * this is a resource for splitting up mp3 files, ffmpeg comes packaged nicely as an npm module
 *
 * ffmpeg -i long.mp3 -acodec copy -ss 00:00:00 -t 00:30:00 half1.mp3
 */

// exec('ffmpeg -i ./music/lofi.mp3 -acodec copy -ss 00:15:00')



// var filename = __dirname + '/penningen.mp3' ;
var filename = __dirname + '/music/lofi.mp3' ;

app.use(express.static(`${__dirname}/html`));

server.listen(8000);

// send the index that contains the <audio> element
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/html/indexmp3.html');
});

app.get('/materialize.min.css', function(req, res) {
  res.sendFile(path.join(__dirname + '/' + 'node_modules/materialize-css/dist/css/materialize.min.css'))
})

app.get('/materialize.js', function(req, res) {
  res.sendFile(path.join(__dirname + '/' + 'node_modules/materialize-css/dist/js/materialize.js'))
})

app.get('/fonts/roboto/Roboto-Regular.woff2', function(req, res) {
  res.sendFile(path.join(__dirname + '/' + 'node_modules/materialize-css/dist/fonts/roboto/Roboto-Regular.woff2'))
})

app.get('/fonts/roboto/Roboto-Regular.woff', function(req, res) {
  res.sendFile(path.join(__dirname + '/' + 'node_modules/materialize-css/dist/fonts/roboto/Roboto-Regular.woff'))
})

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
