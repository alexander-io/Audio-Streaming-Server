var express = require('express'), fs = require('fs'), path = require('path')
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var socket_stream = require('socket.io-stream');

const port = 8080


const {execSync} = require('child_process')
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

/*
 * making a live audio stream, not every listener tunes in at the same time, so I need a way of splitting the audio according to the start time that the user tunes in
 *
 * the ffmpeg package has this functionality...
 * ffmpeg -i <file_to_split>.mp3 -acodec copy -ss <start_time_of_split> -t <end_time_of_split> <new_file_name_for_split>.mp3
 *
 * ex :
 *  ffmpeg -i lofi.mp3 -acodec copy -ss 00:00:15 -t 00:00:15 lofi_half2.mp3
 *
 * ... the format of the <start_time_of_split> and <end_time_of_split> is hours:minutes:seconds or 00:00:00
 *
 * so, this is a function to take in a number of seconds and return the a string formatted in this way
 *
 * ex :
 *  30 -> 0:0:30 -> thirty seconds
 *  60 -> 0:1:0 -> one minute
 *  90 -> 0:1:30 -> one minute and thirty seconds
 *  120 -> 0:2:0 -> two minutes
 *  60*60 -> 1:0:0 -> one hour
 */
let format_seconds = function(seconds) {
  let seconds_per_min = 60, seconds_per_hour = 60*60

  // get the number of hours
  let hrs = seconds / seconds_per_hour
  hrs = Math.floor(hrs)

  // the the number of minutes
  let mins = seconds / seconds_per_min
  mins = mins - (hrs*60)
  mins = Math.floor(mins)

  // get the number of seconds
  let secs = seconds - (hrs * seconds_per_hour) - (mins * seconds_per_min)

  return hrs + ':' + mins + ':' + secs
}

/*
 * use ffmpeg to split an audio file starting at some time in seconds that's passed in as a parameter
 *
 */
let split_audio = function(start_time_in_seconds) {
	if (fs.existsSync(__dirname + '/music/lofi_split.mp3')) {
    	fs.unlink(__dirname + '/music/lofi_split.mp3', console.log('unlinked lofi_split.mp3'))		
	}
	let formatted_seconds = format_seconds(start_time_in_seconds)
	console.log('formatted seconds :', formatted_seconds)
  execSync('ffmpeg -i '+__dirname +'/music/lofii.mp3 -acodec copy -ss ' + formatted_seconds + ' -t 01:00:00 '+__dirname +'/music/lofi_split.mp3')

}


// var filename = __dirname + '/penningen.mp3' ;
var filename = __dirname + '/music/lofii.mp3' ;

app.use(express.static(`${__dirname}/html`));

server.listen(port);

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
  
  socket.on('disconnect', function(reason) {
  	console.log('client disconnected :', reason)
  })

  let stream_start_seconds = stream_start_time()
  let seconds_since_server_start = stream_start_seconds - server_start_time_seconds
  console.log('\n\tclient connect\n\tstart time :', stream_start_seconds);
  split_audio(seconds_since_server_start)

  // new Promise(function(resolve, reject) {
  // 	split_audio(stream_start_seconds)
  // })

  filename = __dirname + '/music/lofi_split.mp3'

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
    stream.on('finish', function() {
    	console.log('stream finished	')
    	fs.unlink(__dirname + '/music/lofi_split.mp3', console.log('unlinked lofi_split.mp3'))



    })
  });

});

// io.on('disconnect', function(socket) {
// 	console.log('client has disconnected')
// })
