return route().then(function(e){
  if (e === true)
    return new Promise(function(resolve, reject) {
      app.page[local.name.query.page](resolve, reject);
    }).then(function(){
      return app.Toggle.header().then(function(e){
        try {
          app.dataContent();
        } catch (e) {
          return e;
        }
        return true;
      });
    },function(e){
      return e;
    });
  return e;
});