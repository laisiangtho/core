var configuration = app.config, dataSession=app.bible, localId='bible', localSession = app.localStorage.name, self=this;
// var configuration = app.config, dataSession=app.book, localId='book', localSession = app.localStorage.name, self=this;
// new app.xml(bId).open().then();
this.open=function(){
  return app.fileStorage.open({
    urlLocal: configuration.file.urlLocal.replace(/bId/,bId),
    readAs:'readAsText'
  });
};
/*
new app.xml(bId).download(function(){
  o.setAttribute('class','icon-loading animate-spin');
}).then(function(e){
  new app.xml(bId).save(e).then(function(){
    o.setAttribute('class','icon-ok offline');
  },function(){
    o.setAttribute('class','icon-attention offline');
  });
});
*/
// console.log(configuration.file.urlAPI);
this.download=function(progressCallback){
  // https://scriptive.github.io/eba/xml/bId.xml
  var xmlRequest={
    dir:JSON.parse(JSON.stringify(configuration.file.urlAPI)),
    request:function(url){
      return app.fileStorage.download({
        url: url,
        urlLocal: configuration.file.urlLocal.replace(/bId/,bId),
        // requestMethod:'POST',
        readAs: 'blob', 
        before:function(xhr){
          // xhr.setRequestHeader("Access-Control-Allow-Origin", "laisiangtho.com");
          // xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
          // xhr.setRequestHeader("x-goog-meta-Access-Control-Allow-Origin", "*");
          xhr.overrideMimeType('text/xml');
          // xhr.overrideMimeType('application/xml; charset=utf-8');
          // xhr.overrideMimeType('application/octet-stream');
          // xhr.withCredentials = true;
          // xhr.overrideMimeType('text/plain; charset=x-user-defined');
        },
        progress: progressCallback
      });
    },
    process:function(successCallback,failCallback){
      // var url = xmlRequest.dir.shift().replace(/bId/,bId);
      console.log(xmlRequest.dir);
      var url = xmlRequest.dir.shift().replace(/bId/,bId);
      // /touch/.test(click)
      // new RegExp(paraSearch, "i").test(v.innerHTML)
      // url.includes("gId")
      if (/gId/.test(url))url=url.replace(/gId/,dataSession.all[bId].id.gId);
      return xmlRequest.request(url).then(function(e){
        if (!e.xml)e.xml = new DOMParser().parseFromString(e.data,e.fileType);
        dataSession.file[bId]=e.xml;
        successCallback(e);
      },function(e){
        if (xmlRequest.dir.length){
          xmlRequest.process(successCallback,failCallback);
        } else {
          failCallback(e);
        }
      });
    }
  };
  // return new Promise(function(resolve, reject) {
  //   xmlRequest.process(resolve,reject);
  // });
  return new Promise(xmlRequest.process);
};
/*
new app.xml(bId).save({}).then(function(){
  o.setAttribute('class','icon-ok offline');
},function(){
  o.setAttribute('class','icon-attention offline');
});
*/
this.save=function(e){
  return new Promise(function(resolve, reject) {
    app.fileStorage.save(e).then(function(s){
      dataSession.all[bId].id.local=1;
      localSession[localId][bId].id.local=1;
      app.localStorage.update(localId);
      resolve(s);
    },function(e){
      reject(e)
    });
  });
};
/*
new app.xml(bId).delete().then(function(){
  o.setAttribute('class','icon-ok offline');
},function(){
  o.setAttribute('class','icon-attention offline');
});
*/
this.delete=function(){
  return new Promise(function(resolve, reject) {
    app.fileStorage.delete({
      urlLocal: configuration.file.urlLocal.replace(/bId/,bId),
      fileNotFound: true
    }).then(function(e){
      delete dataSession.all[bId].id.local;
      delete localSession[localId][bId].id.local;
      delete dataSession.file[bId];
      app.localStorage.update(localId);
      resolve(e);
    },function(e){
      reject(e)
    });
  });
};
/*
new app.xml(bId).request(function(){
  // NOTE: progressCallback
}).then(function(e){
  xmlBible=e;
  resolve(responseBible);
},function(e){
  reject(e);
});
*/
this.request=function(progressCallback){
  return new Promise(function(resolve, reject) {
    if (dataSession.file.hasOwnProperty(bId)){
      resolve(dataSession.file[bId]);
    } else if (localSession[localId][bId].id.hasOwnProperty('local')){
      self.open().then(function(e){
        e.xml = new DOMParser().parseFromString(e.fileContent,e.fileType);
        dataSession.file[bId]=e.xml;
        resolve(e.xml);
      },function(e){
        console.log('open fail',e);
        self.delete().then(function(){
          reject(e);
        });
      });
      /*
      app.fileStorage.open({
        urlLocal: configuration.file.urlLocal.replace(/bId/,bId),
        readAs:'readAsText'
      }).then(function(e){
        e.xml = new DOMParser().parseFromString(e.fileContent,e.fileType);
        dataSession.file[bId]=e.xml;
        // app.book.file[bId]=e.xml;
        resolve(e.xml);
      },function(e){
        console.log('request local fail',e);
        new app.xml(bId).delete().then(function(){
          reject(e);
        });
      });
      */
    } else {
      // TODO: progressCallback function(){}
      self.download(progressCallback).then(function(e){
        self.save(e).then(function(){
          console.log('save success');
        },function(){
          console.log('save fail');
        }).then(function(){
          resolve(e.xml);
        });
      },function(e){
        reject(e);
      });
      /*
      new app.xml(bId).download(progressCallback).then(function(e){
        new app.xml(bId).save(e).then(function(){
          console.log('saving success');
        },function(){
          console.log('saving fail');
        }).then(function(){
          resolve(e.xml);
        });
      },function(e){
        reject(e);
      });
      */
    }
  });
};