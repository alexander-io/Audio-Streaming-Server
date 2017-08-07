const {exec} = require('child_process')

// define conversion functions
const hr_to_sec = (hr) => hr*60*60
const min_to_sec = (min) => min*60


let date = new Date()
let hours = date.getHours()
let minutes = date.getMinutes()
let seconds = date.getSeconds()

const start_time_seconds = hr_to_sec(hours) + min_to_sec(minutes) + seconds


// get the start time of the stream
let stream_start_time = function() {
  let d = new Date()
  return hr_to_sec(d.getHours()) + min_to_sec(d.getMinutes()) + d.getSeconds()
}

// setTimeout(function() {
//   let sst = stream_start_time()
//   console.log('stream start time :', sst)
//   console.log('seconds since start :', sst-start_time_seconds);
// }, 3000)



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
let split_audio = function(start_time_in_seconds, path_to_file) {
  exec('ffmpeg -i lofi.mp3 -acodec copy -ss ' + format_seconds(start_time_in_seconds) + ' -t 00:00:30 lofi_split.mp3')
}

split_audio(20)
// exec('ffmpeg -i lofi.mp3 -acodec copy -ss 00:00:15 -t 00:00:15 lofi_half2.mp3')
