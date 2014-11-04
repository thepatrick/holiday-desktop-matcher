/* Do some fun stuff with Javascript via UDP
   Eventually we will implement the SecretAPI here.  Eventually. */

// Constructor method for the holiday using SecretAPI
// Requires a string 'address' (i.e. IP address 192.168.0.20) or resolvable name (i.e. 'light.local')
//
function Holiday(address) {
  this.address = address;
  console.log("Address set to ", this.address)
  
  this.NUM_GLOBES = 50;
  this.FRAME_SIZE = 160;      // Secret API rame size
  this.FRAME_IGNORE = 10;     // Ignore the first 10 bytes of frame
  socketId = null;         // No socket number just yet

  this.closeSocket = closeSocket;
  this.setglobe = setglobe;
  this.getglobe = getglobe;
  this.render = render;

  var globes = new Uint8Array(160);
  this.globes = globes;
  console.log('Array created');

  // Fill the header of the array with zeroes
  for (i=0; i < this.FRAME_IGNORE; i++) {
    this.globes[i] = 0x00;
  }

  // Create the socket we'll use to communicate with the Holiday
  chrome.socket.create('udp', {},
   function(socketInfo) {           // Callback when creation is complete
      // The socket is created, now we want to connect to the service
      socketId = socketInfo.socketId;
      console.log('socket created ', socketInfo.socketId);
    }
  );
 
  function closeSocket() {
    chrome.socket.destroy(socketId);
    console.log("Socket destroyed");
  }

  function setglobe(globenum, r, g, b) {
    // Sets a globe's color
    if ((globenum < 0) || (globenum >= this.NUM_GLOBES)) {
      return;
    }

    baseptr = this.FRAME_IGNORE + 3*globenum;
    globes[baseptr] = r;
    globes[baseptr+1] = g;
    globes[baseptr+2] = b; 

    return;
  }

  function getglobe() {
    // Sets a globe's color
    if ((globenum < 0) || (globenum >= this.NUM_GLOBES)) {
      return;
    }

    baseptr = this.FRAME_IGNORE + 3*globenum;
    r = globes[baseptr];
    g = globes[baseptr+1];
    b = globes[baseptr+2];
    return [r,g,b];
  }


  function render() {
    console.log("Holiday.render");
    //var locaddr = this.address;
    var glbs = this.globes;
    var sid = socketId;
    if (sid == null) {
      console.log("No socket abort render");
      return;
    }

    // Connect via the socket
    chrome.socket.connect(socketId, this.address, 9988, function(result) {

       // We are now connected to the socket so send it some data
      chrome.socket.write(socketId, glbs.buffer,
       function(sendInfo) {
         console.log("wrote " + sendInfo.bytesWritten);
      });
    });
    return;
  }
}

// Start Demo 
function demoStart() {
  
  console.log("demoStart");
  //var addr = 'http://' + $('#selector').val() + '/';
  var iotasURL = 'http://' + $('#selector').val() + '/iotas/0.1/device/moorescloud.holiday/localhost/hostname' 
  //window.open(addr/*, /*"popupWindow", "width=500,height=300,scrollbars=yes"*/);
  //copyToClipboard($('#selector').val());
  $.getJSON(iotasURL, function( data ) {
    var aName = data.hostname;
    console.log("Hostname is ", aName);
  });
  return;
}

function doNamer() {
  var iotasURL = 'http://' + $('#selector').val() + '/iotas/0.1/device/moorescloud.holiday/localhost/hostname' 
  window.open(iotasURL, "popupWindow", "width=500,height=200,scrollbars=yes");
  return;
}

function doRefresh() {
  $("#thebutton").val('Scanning...');
  refresher();
}

// Lordy, this is one of the reasons I hate Javascript
// And it's not Javascript's fault.  It's the DOM.
$( document ).ready( function() {
  console.log("Doing the ready");
  // And here's the stuff we do.
  $("#thebutton").click(function () {
    doRefresh();
  });
  $("#namer").click(function () {
    doNamer();
  });
});
