var imagemagick = require('imagemagick'),
    Tesseract = require('tesseract.js'),
    Promise = require("bluebird");

// ocr by tesseract
var doTesseract = function(path, endSignal) {
  Tesseract.recognize(path, {
    lang: 'kor'
  })
  // .progress(function (p) { console.log('progress', p);  })
  .catch(err => console.error(err))
  .then(function (result) {
    console.log( '\n\n----- '+path+' -----\n' + result.text );
    if(endSignal){
      process.exit(0);
    }
  });
};

var cropImage = function(originalFilePath, destinationFilePath, width, height, gravity, callback) {
  imagemagick.crop({
    srcPath: originalFilePath,
    dstPath: destinationFilePath,
    width: width,
    height: height,
    quality: 1,
    gravity: gravity 
  }, function(err, stdout, stderr){
    // foo
  });
}


var imagePath = 'images/',
    imageFile = 'testPic.jpg';

// cut image

// image top info
imagemagick.crop({
  srcPath: imagePath + imageFile,
  dstPath: imagePath + 'topInfo.jpg',
  width: 800,
  height: 370,
  quality: 1,
  gravity: "North" 
}, function(err, stdout, stderr){
  imagemagick.crop({
    srcPath: imagePath + 'topInfo.jpg',
    dstPath: imagePath + 'topInfo.jpg',
    width: 800,
    height: 200,
    quality: 1,
    gravity: "South"
  }, function(err, stdout, stderr){
    imagemagick.crop({
      srcPath: imagePath + 'topInfo.jpg',
      dstPath: imagePath + 'topInfo.jpg',
      width: 550,
      height: 200,
      quality: 1,
      gravity: "Center"
    }, function(err, stdout, stderr){
      // foo
    });
  });
});

// image bottom info
imagemagick.crop({
  srcPath: imagePath + imageFile,
  dstPath: imagePath + 'bottomInfo.jpg',
  width: 800,
  height: 450,
  quality: 1,
  gravity: "South"
}, function(err, stdout, stderr){
  imagemagick.crop({
    srcPath: imagePath + 'bottomInfo.jpg',
    dstPath: imagePath + 'bottomInfo.jpg',
    width: 800,
    height: 330,
    quality: 1,
    gravity: "North" 
  }, function(err, stdout, stderr){
    imagemagick.crop({
      srcPath: imagePath + 'bottomInfo.jpg',
      dstPath: imagePath + 'bottomInfo.jpg',
      width: 700,
      height: 330,
      quality: 1,
      gravity: "Center" 
    }, function(err, stdout, stderr){
      // foo
    });
  });
});

new Promise(function(resolve, reject){
  doTesseract(imagePath + "topInfo.jpg");
  resolve(imagePath + "bottomInfo.jpg")
}).then(function(nextPath){
  doTesseract(nextPath, true);
});
