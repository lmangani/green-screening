(function() {
  // The width and height of the captured photo. We will set the
  // width to the value defined here, but the height will be
  // calculated based on the aspect ratio of the input stream.

  var width = 320;    // We will scale the photo width to this
  var height = 0;     // This will be computed based on the input stream

  // |streaming| indicates whether or not we're currently streaming
  // video from the camera. Obviously, we start at false.

  var streaming = false;

  // The various HTML elements we need to configure or control. These
  // will be set by the startup() function.

  var video = null;
  var canvas = null;
  var photo = null; 
  var bgphoto = null;
  var startbutton = null;
  var startvideobutton = null;
  var startback = null;
  
  var TRANSPARENT = true;
  var BACKGROUND = "https://cdn.glitch.com/8c5d9ab0-7199-4750-83e8-f320de24817a%2FETVkEhJUcAAVaqe.jpg?v=1590230221622"
  var VIDEOSWITCH = false;
  
  if (BACKGROUND){
    var background_img = new Image();
    background_img.crossOrigin = "Anonymous";
    background_img.src = BACKGROUND;
    background_img.onload = function(){ TRANSPARENT = false; }  
  }

  window.videoswitch = function(){
    VIDEOSWITCH = !VIDEOSWITCH;
    console.log('video',VIDEOSWITCH);
  }
  
  function startup() {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    photo = document.getElementById('photo');
    bgphoto = document.getElementById('bgphoto');
    startbutton = document.getElementById('startbutton');
    startvideobutton = document.getElementById('startvideobutton');
    startback = document.getElementById('startback');
    

    navigator.mediaDevices.getUserMedia({video: true, audio: false})
    .then(function(stream) {
      video.srcObject = stream;
      video.play();
      
      var canvas = document.getElementById('copy');
      var ctx    = canvas.getContext('2d');
      video.addEventListener('loadedmetadata', function() {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
      });
      video.addEventListener('play', function () {
        console.log('video on');
        var $this = this; //cache
        (function loop() {
          if (!$this.paused && !$this.ended) {
              if (VIDEOSWITCH) {
                    //ctx.drawImage($this, 0, 0);
                    takepicture();
              }
              setTimeout(loop, 1000 / 10); // drawing at 30fps
          }
        })();
      }, 0);
    })
    .catch(function(err) {
      console.log("An error occurred: " + err);
    });

    video.addEventListener('canplay', function(ev){
      if (!streaming) {
        height = video.videoHeight / (video.videoWidth/width);
      
        // Firefox currently has a bug where the height can't be read from
        // the video, so we will make assumptions if this happens.
      
        if (isNaN(height)) {
          height = width / (4/3);
        }
      
        video.setAttribute('width', width);
        video.setAttribute('height', height);
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        streaming = true;
      }
    }, false);

    startbutton.addEventListener('click', function(ev){
      takepicture();
      ev.preventDefault();
    }, false);
    startback.addEventListener('click', function(ev){
      takebackground();
      ev.preventDefault();
    }, false);
    
    clearphoto();
  }

  // Fill the photo with an indication that none has been
  // captured.

  function clearphoto() {
    var context = canvas.getContext('2d');
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);

    var data = canvas.toDataURL('image/png');
    photo.setAttribute('src', data);
  }
  
  // Capture a photo by fetching the current contents of the video
  
  function convertImageToCanvas(image) {
    var canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext("2d").drawImage(image, 0, 0, width, height);
    return canvas;
  }
  
  async function loadImages(id){
      const src = document.createElement('canvas')
      const srcctx = src.getContext('2d')
      srcctx.drawImage(id, 0, 0, width, height)
      srcctx.filter = 'blur(12px)'
      return srcctx.getImageData(0, 0, width, height)
  }
  
  async function greenScreen(){
          
      // read background + picture
      var data1 = await loadImages(bgphoto);
      var data2 = await loadImages(photo);
      var data0 = await loadImages(background_img);
            
      const canvas = document.getElementById('result');
      const ctx = canvas.getContext('2d')
      ctx.rect(0, 0, width, height)
      ctx.fill()
      var data3 = ctx.getImageData(0, 0, width, height)
            
      for (var i = 0; i < data1.data.length; i += 4) {
        var ir = data1.data[i]
        var ig = data1.data[i + 1]
        var ib = data1.data[i + 2]

        var fr = data2.data[i]
        var fg = data2.data[i + 1]
        var fb = data2.data[i + 2]

        const dr = Math.abs(ir - fr) > 5 ? fr : 0
        const dg = Math.abs(ig - fg) > 5 ? fg : 0
        const db = Math.abs(ib - fb) > 5 ? fb : 0

        const pxchanged = (dr > 0 && dg > 0 && db > 0)
        var state = false;
        if (!pxchanged){
           // TRANSPARENT MODE 
           if (TRANSPARENT){
             data3.data[i] = 0
             data3.data[i + 1] = 0
             data3.data[i + 2] = 0
             data3.data[i + 3] = 0
           } else {
           // BACKGROUND MODE
             data3.data[i] = data0.data[i]
             data3.data[i + 1] = data0.data[i+1]
             data3.data[i + 2] = data0.data[i+2]
           }
        } else {
           
           data3.data[i] = data2.data[i]
           data3.data[i + 1] = data2.data[i+1]
           data3.data[i + 2] = data2.data[i+2]
           //data3.data[i + 3] = 255
           state = true;
        }
      }
      /// Return new canvas
      //ctx.filter = 'blur(4px)'
      ctx.putImageData(data3, 0, 0)
    
  }
  
  
  function takepicture() {
    var canvas = document.getElementById('canvas');
    var back = document.getElementById('bgphoto');
    var context = canvas.getContext('2d');
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);
      
      var data = canvas.toDataURL('image/png');
      photo.setAttribute('src', data);
      
      greenScreen();
      
    } else {
      clearphoto();
    }
  }
  function takebackground() {
    var canvas = document.getElementById('canvas');
    var front = document.getElementById('photo');
    var context = canvas.getContext('2d');
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);
      var data = canvas.toDataURL('image/png');
      bgphoto.setAttribute('src', data);
      startbutton.disabled = false;
      startvideobutton.disabled = false;
    } else {
      clearphoto();
    }
  }

  // Set up our event listener to run the startup process
  // once loading is complete.
  window.addEventListener('load', startup, false);
})();
