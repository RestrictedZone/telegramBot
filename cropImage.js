var fs = require('fs'),
    gm = require('gm');

// capture specific area
module.exports = function(originalFilePath, destinationFilePath, width, height, x, y, callback, chatId, language) {
  // console.log("cropImage execute!");
  if(fs.existsSync(originalFilePath)){
    gm(originalFilePath)
    .crop(width, height, x, y)
    .write(destinationFilePath, function (err) {
      if (!err) {
        // console.log(destinationFilePath + ' has arrived');
        if(typeof callback == "function"){
          // console.log(callback.name, "callback is execute!");
          callback(destinationFilePath, chatId, language);
        }
      } else {
        console.log(err);
      }
    });
  } else {
    console.log(originalFilePath+" is not exist!");
  }
};