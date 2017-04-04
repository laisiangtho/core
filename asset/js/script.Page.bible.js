bible:function(resolve, reject){
  var configuration = app.config, local = app.localStorage, ol=document.createElement('ol');
  // app.Toggle.main(true).appendChild(ol);
  app.Toggle.main(true).appendChild(ol).setAttribute('class','main-bible');
  app.bible.all.each(function(bId,bible){
    var li=document.createElement('li'), p=document.createElement('p'), a=document.createElement('a'), download=document.createElement('span'), 
    dragable=document.createElement('span');
    li.setAttribute('id',bId);
    dragable.setAttribute('class','drag icon-menu');
    // dragable.innerHTML="drag";
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
    p.appendChild(dragable);
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
  }), resolve();
  // Sortable.create(ol, {
  // handle: '.drag',
  // animation: 150
  // });
  if (window['Slip']){
    // console.log('ues');
    ol.addEventListener('slip:beforereorder', function(e){
      // if (/reorder/.test(e.target.className))e.preventDefault();
    }, false);
    ol.addEventListener('slip:beforeswipe', function(e){
      // e.preventDefault();
      // if (e.target.parentNode.nodeName == 'OL' || e.target.parentNode.nodeName == 'P' )e.preventDefault();
      // if (/reorder/.test(e.target.className))e.preventDefault();
    }, false);
    
    ol.addEventListener('slip:beforewait', function(e){
      if (e.target.className.indexOf('drag') > -1) e.preventDefault();
    }, false);
    
    ol.addEventListener('slip:afterswipe', function(e){
      e.target.parentNode.appendChild(e.target);
      // if (e.target.nodeName == 'INPUT' || /reorder/.test(e.target.className))e.preventDefault();
    }, false);
  
    ol.addEventListener('slip:reorder', function(e){
        e.target.parentNode.insertBefore(e.target, e.detail.insertBefore);
        var bible = app.bible, bibleLocal={},bibleAll={};
        bible.available=[];
        e.target.parentNode.childNodes.forEach(function(el,i){
          var id = el.getAttribute('id');
          bible.available.push(id);
          bibleLocal[id]=local.name.bible[id];
          bibleAll[id]=bible.all[id];
        });
        local.update('bible',bibleLocal);
        bible.all=bibleAll;
        return false;
    }, false);
  
    new Slip(ol);
  } else {
    new Sortable(ol, {
    handle: '.drag',
    animation: 150,
    onUpdate: function (e) {
        var bible = app.bible, bibleLocal={},bibleAll={};
        bible.available=[];
        e.target.childNodes.forEach(function(el,i){
          var id = el.getAttribute('id');
          bible.available.push(id);
          bibleLocal[id]=local.name.bible[id];
          bibleAll[id]=bible.all[id];
        });
        local.update('bible',bibleLocal);
        bible.all=bibleAll;
      },
    });
  }
},