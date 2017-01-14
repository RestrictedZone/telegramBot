var fs = require('fs'),
    gm = require('gm');

module.exports.compare = function(targetImagePath, compareImagePath, resolve){
    // fs.chmodSync(targetImagePath, 777);
    // fs.chmodSync(compareImagePath, 777);
    if( fs.existsSync(compareImagePath) ){
        gm.compare(targetImagePath, compareImagePath, function (err, isEqual, equality, raw) {
            if (err) throw err;
            var isDoingWork = equality<0.08;
            // console.log('The images are equal: ', isEqual);
            console.log('Actual equality: ', equality);
            // console.log('Raw output was: ', raw);
            console.log('true?: ', isDoingWork);
            resolve(isDoingWork);
            return isDoingWork;
        });
    } else {
        return false;
    }
};

module.exports.crop = function(originalFilePath, destinationFilePath, width, height, x, y, callback, chatId, language) {
  // console.log("cropImage execute!");
  if(fs.existsSync(originalFilePath)){
    gm(originalFilePath)
    .crop(width, height, x, y)
    .write(destinationFilePath, function (err) {
      fs.chmodSync(originalFilePath, 777);
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