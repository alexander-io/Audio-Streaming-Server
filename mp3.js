var express = require('express'), fs = require('fs'), path = require('path')
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var socket_stream = require('socket.io-stream');


const {exec} = require('child_process')
let date = new Date()
// define conversion functions
const hr_to_sec = (hr) => hr*60*60
const min_to_sec = (min) => min*60

const server_start_time_seconds = hr_to_sec(date.getHours()) + min_to_sec(date.getMinutes()) + date.getSeconds()
console.log('server start time \t\t:', date.toLocaleTimeString() + '\nserver start time seconds \t:', server_start_time_seconds);

/*
 * define a function to return the start time of a particular stream
 * this is meant to be called on 'connection' event for each connected client
 *
 * the time that is returned is in seconds
 */
let stream_start_time = function() {
  let d = new Date()
  return hr_to_sec(d.getHours()) + min_to_sec(d.getMinutes()) + d.getSeconds()
}


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
  let stream_start_seconds = stream_start_time()
  console.log('\n\tclient connect\n\tstart time :', stream_start_seconds);

  // emit start event to client
  socket.emit('start', { hello: 'world' });

  // listen for stream event from client, this indicates that the client is ready to start receiving data
  socket.on('stream', function (data) {
    console.log('\tstream evnt data from client :', data); // log the data that's sent from the client when emitting the 'stream' event

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
