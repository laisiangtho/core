var parallelContainer = app.main.container().querySelector('div.active').querySelector('ol.parallel');
// unusable, usable
if (parallelContainer) {
  e.classList.remove('unusable');
} else {
  e.classList.add('unusable');
}
app.Toggle.menu(e,function(container){
  var local = app.localStorage, ol = document.createElement('ol');
  var parallel=[];
  var parallelQuery = local.name.query.parallel;
  parallelContainer = app.main.container().querySelector('div.active').querySelector('ol.parallel');
  new Promise(function(resolve, reject) {
    if (parallelContainer) {
      parallelContainer.children.each(function(i,o,t,l){
        parallel.push(o.getAttribute('class'));
        if(l)resolve(parallel);
      });
    } else {
      reject();
    }
  }).then(function(e){
    return e;
  },function(){
    return false;
  }).then(function(status){
    // ol.classList='list-parallel';
    ol.setAttribute('class','list-parallel');
    container.appendChild(ol);
    app.bible.all.each(function(bId,bible){
      var li = document.createElement('li'), primary = document.createElement('p'), p = document.createElement('p');
      primary.setAttribute('class','switch icon-ok');
      if (status && parallel.indexOf(bId) > -1)li.classList.add("active");
      if (local.name.query.bible == bId)li.classList.add("main");
      li.setAttribute('id',bId);
      li.eventClick(function(event){
        if (status && event.target.classList.contains('switch')){
          if (li.classList.contains('active')) {
            if (local.name.query.bible != bId){
              li.classList.remove('active');
              parallelContainer.removeChild(parallelContainer.getElementsByClassName(bId)[0]);
              parallelQuery.remove(bId);
            }
          } else {
            var liBible = document.createElement('li');
            var xyx = new app.Query(bId).from(app.config.parallel[local.name.query.page]);
            new app.Content(xyx).bible(bId).then(function(e){
              e.parallel(liBible).then(function(){
                parallelContainer.appendChild(liBible).classList=bId;
                li.classList.add('active');
                parallelQuery.push(bId);
                parallelQuery.unique();
              },function(e){
                console.log('parallel fail',e);
              });
            },function(e){
              console.log('bible error',e);
            });
          }
        } else {
          // NOTE: No ol.parallel in main
          window.location.hash = ({bible:bId}).paramater([local.name.query.page]);
        }
      });
      p.innerHTML = bible.id.name;
      li.appendChild(primary); li.appendChild(p); ol.appendChild(li);
    });
  });
});