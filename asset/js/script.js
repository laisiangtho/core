(function(o) {
  o.load = function(o) {
    console.log("load 1");
    var test = this.what();
    // console.log(test);
    test.then(function(e){
        // NOTE: when done
        console.log('what',e);
        // return e;
    });
  };
  o.what =function(){
    return new Promise(function(resolve, reject) {
      // resolve('Ok');
      reject('Error');
    }).then(function(e) {
        // NOTE: if success
        console.log('if success',e);
        return e;
    }, function(e) {
        // NOTE: if fail
        console.log('if fail',e);
        return e;
    }).then(function(e){
        // NOTE: when done
        console.log('when done',e);
        return e;
    });
  }
}(scriptive("app")));