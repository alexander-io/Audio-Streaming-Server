const {exec} = require('child_process')
let date = new Date()

// let timeis = date.toLocaleTimeString()
// console.log('to locale time string :', timeis);

// timeis = date.getUTCSeconds()
// console.log('get utc seconds :', timeis);
let hr_to_sec = (hr) => hr*60*60
let min_to_sec = (min) => min*60


let hours = date.getHours()
let minutes = date.getMinutes()
let seconds = date.getSeconds()


const start_time_seconds = hr_to_sec(hours) + min_to_sec(minutes) + seconds

// console.log('start time in seconds :', start_time_seconds);



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




let format_seconds = function(seconds) {
  let seconds_per_min = 60
  let seconds_per_hour = 60*60

  let hrs = seconds / seconds_per_hour
  hrs = Math.floor(hrs)

  let mins = seconds / seconds_per_min
  mins = mins - (hrs*60)
  mins = Math.floor(mins)

  let secs = seconds - (hrs * seconds_per_hour) - (mins * seconds_per_min)

  return hrs + ':' + mins + ':' + secs
}

// console.log(format_seconds(60*60+60));


let split_audio = function(start_time_in_seconds) {
  exec('ffmpeg -i lofi.mp3 -acodec copy -ss ' + format_seconds(start_time_in_seconds) + ' -t 00:00:30 lofi_half1.mp3')
}

split_audio(20)
// exec('ffmpeg -i lofi.mp3 -acodec copy -ss 00:00:15 -t 00:00:15 lofi_half2.mp3')
