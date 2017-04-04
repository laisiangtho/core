book:function(resolve, reject){
  var configuration = app.config, local = app.localStorage, ol=document.createElement('ol');
  // app.Toggle.main(true).appendChild(ol);
  app.Toggle.main(true).appendChild(ol).setAttribute('class','main-book');
  app.bible.catalog.section.each(function(testamentId,sectionlist){
    var liTestament = document.createElement('li'), h2 = document.createElement('h2'), testamentIdElement = 't'+testamentId;
    var olSection = document.createElement('ol');
    olSection.setAttribute('class','section');
    h2.innerHTML = app.bible.testament(testamentId);

    liTestament.appendChild(h2);
    liTestament.appendChild(olSection);
    liTestament.setAttribute('id',testamentIdElement);
    ol.appendChild(liTestament);
    sectionlist.each(function(sectionId,booklist){
      var liSection = document.createElement('li'), h3 = document.createElement('h3'), sectionIdElement = 's'+sectionId;
      var olBook = document.createElement('ol');
      olBook.setAttribute('class','book');
      h3.innerHTML = app.bible.section(sectionId);
      liSection.appendChild(h3);
      liSection.appendChild(olBook);
      liSection.setAttribute('id',sectionIdElement);
      olSection.appendChild(liSection);
      booklist.forEach(function(bookId){
        var liBook=document.createElement('li'), 
        p=document.createElement('p'), 
        a=document.createElement('a'), 
        span=document.createElement('span');
        a.innerHTML = app.bible.book(bookId);
        a.setAttribute('href',{book:bookId}.paramater(['#chapter']));
        a.setAttribute('data-title',app.bible.digit(bookId));
        span.innerHTML = app.bible.digit(app.bible.catalog.book[bookId].c);
        
        span.eventClick(function(event){
          var o = event.target; 
          // console.log(o.parentNode.parentNode);
          if (o.classList.contains("active")){
            // console.log('close');
            o.removeAttribute('class','active');
            // var ol = o.parentNode.parentNode.querySelector('ol');
            var ol = o.parentNode.parentNode;
            // while(ol.firstChild)ol.removeChild(ol.firstChild);
            // console.log(ol);
            // o.parentNode.parentNode.removeChild(ol);
            ol.removeChild(ol.lastChild);
          } else{
            // console.log('open');
            o.setAttribute('class','active');
            var ol = document.createElement('ol');
            // ol.setAttribute('class','chapter');
            liBook.appendChild(ol);
            app.bible.catalog.book[bookId].v.each(function(chapter,verses){
              
              chapter++;
              var li = document.createElement('li'), a = document.createElement('a');
              a.setAttribute('href',{book:bookId,chapter:chapter}.paramater(['#chapter']));
              a.setAttribute('data-title',app.bible.digit(verses));
              a.innerHTML = app.bible.digit(chapter);
              if (bookId == chapter)li.classList.add("active");
              li.appendChild(a); ol.appendChild(li);
            });
            
          }
        },false);

        if (bookId == local.name.query.book){
          liBook.setAttribute('class','active');
          liSection.setAttribute('class','active');
          liTestament.setAttribute('class','active');
        }
        
        // a.insertBefore(sup, a.firstChild);
        p.appendChild(a);
        p.appendChild(span);
        liBook.appendChild(p);
        // liBook.setAttribute('id',bookId);
        olBook.appendChild(liBook);
      });
    });
  }), resolve();
},