
'use strict';

if (!navigator.getUserMedia) {
  navigator.getUserMedia = (navigator.mozGetUserMedia && navigator.mozGetUserMedia.bind(navigator)) ||
                           (navigator.webkitGetUserMedia && navigator.webkitGetUserMedia.bind(navigator));
}

/*global ColorThief, ServiceFinder, chrome, console*/

var colorThief = new ColorThief();

var socketId = null;

chrome.sockets.udp.create({ name: 'holiday-udp' }, function(socketInfo) {
  console.log('created socket', socketInfo);
  chrome.sockets.udp.bind(socketInfo.socketId, '0.0.0.0', 0, function(result) {
    if (result < 0) {
      console.error('Unable to bind socket', result);
      return;
    }
    socketId = socketInfo.socketId;
  });
});

// var holidays = [];

// var serviceDb = {
//   _iotas: 'Internet of Things Access Server'
// };

// var finder;

// var refresh = function() {
//   if (finder) {
//     finder.shutdown();
//   }
//   finder = new ServiceFinder(function(error) {
//     if (error) {
//       console.error('Error!', error);
//     } else {
//       var outer = finder.services,
//           inner = finder.ips;

//       console.log('outer', outer, 'inner', inner);

//     }
//   });
// };

// refresh();

chrome.desktopCapture.chooseDesktopMedia(['screen'], null, function(sourceId) {

  navigator.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: sourceId
      }
    }
  },
    function(stream) {
      var videoTag = document.createElement('video');
      videoTag.src = window.URL.createObjectURL(stream);
      videoTag.play();

      function draw() {

        try {
          var colors = colorThief.getPaletteFromVideo(videoTag, 10, 10);
          var output = [];
          for(var i = 0; i < 50; i++) { output[i] = colors[i % colors.length]; }
          // console.log('color', output);
          // post('/colors', {colors: output });

          if (socketId) {
            var bytes = new Uint8Array(160);
            for (var idx = 0; idx < 50; idx++) {
                var colour = output[idx],
                    offset = 10 + (idx * 3);
                if (colour && colour.length) {
                    bytes[offset++] = colour[0] || 0;
                    bytes[offset++] = colour[1] || 0;
                    bytes[offset] = colour[2] || 0;
                }
            }

            chrome.sockets.udp.send(socketId, bytes.buffer, '10.150.1.100', 9988, function(result, sendInfo) {
              if (typeof result === 'number' && result < 0 || result.result < 0) {
                console.error('Failed to send bytes', result);
              } else {
                console.log('sent', sendInfo || result.bytesSent);
              }
            });
          }

        } catch (err) {
          console.error('Error?', err);
        }

      }

      setInterval(draw, 1000);

    },
    function(err) {
      console.log('getUserMedia Failed!', err);
    }
  );

});
