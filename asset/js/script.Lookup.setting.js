var local = app.localStorage, configuration = app.config;
var lookupBook=function(element){
  element.classList.toggle("active");
  var id = element.getAttribute('id');
  if (element.classList.contains("active")){
    // NOTE: chapter lookup list can be configurated
    local.name.lookup.book[id]={}; 
  } else {
    delete local.name.lookup.book[id];
  }
};
var lookupSetting=function(element,parent){
  element.classList.toggle("active");
  parent.classList.toggle("active");
  var id = parent.getAttribute('id');
  if (parent.classList.contains("active")){
    local.name.lookup.setting[id]=true; 
  } else {
    delete local.name.lookup.setting[id];
  }
};
app.Toggle.menu(e,function(container){
  var ol = document.createElement('ol');
  ol.setAttribute('class','list-lookup');
  container.appendChild(ol);
  app.bible.catalog.section.each(function(testamentId,sectionlist){
    var liTestament = document.createElement('li'), pTestament = document.createElement('p'), spanTestament = document.createElement('span'), testamentIdElement = 't'+testamentId;
    var olSection = document.createElement('ol');
    olSection.setAttribute('class','section');
    pTestament.innerHTML = app.bible.testament(testamentId);
    spanTestament.innerHTML ='+';
    pTestament.eventClick(function(event){
      var element = event.target, parent = element.parentNode;
      if (element == spanTestament) {
        parent.parentNode.lastElementChild.querySelectorAll('ol.book>li').each(function(i,v){
          lookupBook(v);
        });
      } else {
        lookupSetting(element,parent);
      }
      // switch button
      // if (element == spanTestament) {
      //   lookupSetting(element,parent.parentNode);
      // } else {
      //   parent.lastElementChild.querySelectorAll('ol.book>li').each(function(i,v){
      //     lookupBook(v);
      //   });
      // }
    });
    pTestament.appendChild(spanTestament);
    liTestament.appendChild(pTestament);
    liTestament.appendChild(olSection);
    
    liTestament.setAttribute('class',(local.name.lookup.setting.hasOwnProperty(testamentIdElement)?'active':'testaments'));
    liTestament.setAttribute('id',testamentIdElement);
    ol.appendChild(liTestament);
    sectionlist.each(function(sectionId,booklist){
      var liSection = document.createElement('li'), pSection = document.createElement('p'), spanSection = document.createElement('span'), sectionIdElement = 's'+sectionId;
      var olBook = document.createElement('ol');
      olBook.setAttribute('class','book');
      spanSection.innerHTML ='+';
      pSection.innerHTML = app.bible.section(sectionId);
      pSection.eventClick(function(event){
        var element = event.target, parent = element.parentNode;
        if (element == spanSection) {
          parent.parentNode.lastElementChild.childNodes.each(function(i,v){
            lookupBook(v);
          });
        } else {
          lookupSetting(element,parent);
        }
        // switch button
        // if (element == spanSection) {
        //   lookupSetting(element,parent.parentNode);
        // } else {
        //   parent.lastElementChild.childNodes.each(function(i,v){
        //     lookupBook(v);
        //   });
        // }
      });
      pSection.appendChild(spanSection);
      liSection.appendChild(pSection);
      liSection.appendChild(olBook);
      liSection.setAttribute('class',(local.name.lookup.setting.hasOwnProperty(sectionIdElement))?'active':'section');
      liSection.setAttribute('id',sectionIdElement);
      olSection.appendChild(liSection);
      booklist.forEach(function(bookId){
        var liBook= document.createElement('li');
        liBook.innerHTML = app.bible.book(bookId);
        liBook.setAttribute('id',bookId);
        liBook.setAttribute('class',(local.name.lookup.book.hasOwnProperty(bookId))?'active':'none');
        liBook.eventClick(function(event){
          lookupBook(event.target);
        });
        olBook.appendChild(liBook);
      });
    });
  });
},function(){
  local.update('lookup');
});