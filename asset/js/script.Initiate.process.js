// NOTE: bible.json change requireUpdate
var localBible = local.select('bible').name.bible;
return new Promise(function(resolve, reject) {
  app.fileStorage = fileStorage(configuration.fileStorage, {
    done: function() {
      app.fileStorage.download({
        url:configuration.file.lang
      }).then(function(e){
        app.bible.all = JSON.parse(e.data);
        if (!localBible.isObject())localBible={};
        if (!localBible.isEmpty())app.bible.all=JSON.parse(JSON.stringify(localBible)).merge(app.bible.all);
        if (configuration.requireUpdate || localBible.isEmpty()){
          for (var i in app.bible.all) {
            if (app.bible.all.hasOwnProperty(i)) {
              if (!localBible.hasOwnProperty(i))localBible[i]={};
              if (!localBible[i].hasOwnProperty('id'))localBible[i].id={};
            }
          }
          local.update('bible');
        }
        resolve();
      },function(e){
        reject(e);
      });
    }
  }
 );
}).then(function(){
  // console.log('initiateBible');
  // NOTE: language -> message,section,testament,book,name,digit
  // =require script.Language.js
  app.bible.available = Object.keys(app.bible.all);
  app.bible.all.each(function(i,v){
    v.merge(true,language).name.merge(v.book);
  });
  return true;
},function(e){
  return e;
});