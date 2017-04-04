var local = app.localStorage;
e.innerHTML = app.bible.digit(local.name.query.chapter);
e.setAttribute('title',app.bible.book(local.name.query.book));
app.Toggle.menu(e,function(container){
  var ol = document.createElement('ol');
  ol.setAttribute('class','list-chapter');
  container.appendChild(ol);
  app.bible.catalog.book[local.name.query.book].v.each(function(chapter,verses){
    chapter++;
    var li = document.createElement('li'), a = document.createElement('a');
    a.setAttribute('href',{book:local.name.query.book,chapter:chapter}.paramater(['#chapter']));
    a.setAttribute('data-title',app.bible.digit(verses));
    a.innerHTML = app.bible.digit(chapter);
    if (local.name.query.chapter == chapter)li.classList.add("active");
    li.appendChild(a); ol.appendChild(li);
  });
});