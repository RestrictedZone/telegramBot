var fs = require('fs'),
    gm = require('gm');

module.exports = function(targetImagePath, compareImagePath, resolve){
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