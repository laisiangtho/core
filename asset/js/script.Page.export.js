export:function(resolve, reject){
  var configuration = app.config, local = app.localStorage, ol=document.createElement('ol');
  // app.Toggle.main(true).appendChild(ol);
  app.Toggle.main(true).appendChild(ol).setAttribute('class','main-bible');
  app.bible.all.each(function(bId,bible){
    var li=document.createElement('li'), p=document.createElement('p'), a=document.createElement('a'), download=document.createElement('span'), 
    tsv=document.createElement('span');
    li.setAttribute('id',bId);
    tsv.setAttribute('class','export tsv');
    tsv.setAttribute('title','export TSV');
    tsv.innerHTML="TSV";
    a.innerHTML=bible.id.name;
    a.setAttribute('href',{bible:bId}.paramater(['#book']));
    // download.setAttribute('class','file');
    if (bible.id.hasOwnProperty('local')) {
      download.setAttribute('class','icon-ok offline');
    } else if (app.bible.file.hasOwnProperty(bId)) {
      download.setAttribute('class','icon-attention offline');
    } else {
      download.setAttribute('class','icon-cloud online');
    }
    p.appendChild(download);
    p.appendChild(a);
    p.appendChild(tsv);
    li.setAttribute('class','reorder');
    if (bId == local.name.query.bible)li.classList.add('active');
    
    li.appendChild(p);
    ol.appendChild(li);
    
    download.eventClick(function(event){
      var o = event.target; 
      if (o.classList.contains("offline")){
        app.Toggle.dialog(function(container){
          // NOTE: Open
          var p=document.createElement('p');
          p.innerHTML=app.bible.lang('isLocalRemove').replace('{is}',bible.id.name);
          container.appendChild(p);
        },function(container){
          return new app.xml(bId).delete().then(function(){
            o.setAttribute('class','icon-cloud online');
          });
        });
      } else {
        var temp = o.parentNode.firstElementChild.nextElementSibling;
        new app.xml(bId).download(function(){
          o.setAttribute('class','icon-loading animate-spin');
        }).then(function(e){
          new app.xml(bId).save(e).then(function(){
            o.setAttribute('class','icon-ok offline');
          },function(){
            o.setAttribute('class','icon-attention offline');
          });
        });
      }
    },false);
    tsv.eventClick(function(event){
      // console.log(local.name.lookup.book);
      // console.log(bId);
      // var container ='"book","chapter","verse","text"\n';
      var containerBible ="bid\tcid\tvid\tverse\ttitle\treference";
      new app.Content(local.name.lookup.book).bible(bId).then(
        function(e){
          e.export(containerBible).then(function(e,abc){
            // app.bible.all[bId].id.name
            var id= app.bible.all[bId].id;
            console.log(bId,id.name,id.shortname,id.year,e);
          },function(e){
            console.log('error',e);
          });
        },
        function(e){
        console.log('bible error',e);
      }).then(function(){
        resolve();
      });
      // new app.Content(lookupObject || local.name.lookup.book).bible(query.bible,configuration.parallel[query.page]).then(
      //   function(e){
      //     console.log(e);
      //   },
      //   function(e){
      //   console.log('bible error',e);
      // }).then(function(){
      //   resolve();
      // });

    },false);
  }), resolve();
  
  // if (app.config.Screen =='mobile')
},