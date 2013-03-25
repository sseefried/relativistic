// (function() {
//   var mp3Support, oggSupport;
//   var audio = document.createElement('audio');
//   var mp3Support,oggSupport, sound;
//    if (audio.canPlayType) {
//       // Currently canPlayType() returns: "", "maybe", or "probably"
//       mp3Support = "" != audio.canPlayType('audio/mpeg');
//       oggSupport = "" != audio.canPlayType('audio/ogg; codecs = "vorbis"');
//    } else {
//       //The audio tag is not supported
//       mp3Support = false;
//       oggSupport = false;
//    }
//     // Check for ogg, then mp3, and finally set soundFileExtn to undefined
//    soundFileExtn = oggSupport?".ogg":mp3Support?".mp3":undefined;
// 
//     if(soundFileExtn) {
//       sound = new Audio();
//       sound.addEventListener('canplaythrough', function() {
//         sound.play();
//       });
//      sound.src = "solaris-first-sleep" + soundFileExten;
//     }
// })();

(function() {
  var sound = new Audio();
  sound.addEventListener('canplaythrough', function() {
    sound.play();
  });
//  sound.src = "solaris-first-sleep.wav";
})();
