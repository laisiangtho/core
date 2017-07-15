var xmlBible, lId,bibleParallel;
var result={
  book:0,
  chapter:0,
  verse:0
  // parallel:false
};
//lId bId, cId, vId, lName, bName, cName, vName
var html={
  book:function(container,id){
    var li=document.createElement('li'), h2=document.createElement('h2');
    h2.innerHTML=app.bible.book(id,lId);
    li.setAttribute('id',id);
    li.appendChild(h2);
    return container.appendChild(li);
  },
  chapter:function(container,bId,id){
    var li=document.createElement('li'), h3=document.createElement('h3');
    h3.innerHTML=app.bible.digit(id,lId);
    h3.setAttribute('title',app.bible.book(bId,lId));
    li.setAttribute('id',id);
    li.appendChild(h3);
    return container.appendChild(li);
  },
  verse:function(id,text){
    var li=document.createElement('li');
    li.setAttribute('id',id);
    li.setAttribute('data-title',app.bible.digit(id,lId));
    // TODO: delete
    // if (id == 2)li.setAttribute('class','active');
    
    li.innerHTML = text;
    return li;
  },
  title:function(text){
    var li=document.createElement('li'), h4=document.createElement('h4');
    li.setAttribute('class','title');
    h4.innerHTML=text;
    li.appendChild(h4);
    return li;
  },
  ref:function(text){
    text = text.replace(/,/g,';');
    var li=document.createElement('li');
    li.setAttribute('class','ref');
    
    var Query = new app.Query(lId);
    // var lOb = Query.ref('Gen.1.3');
    var lOb = Query.ref(text).result;
    lOb.each(function(bId,bOb){
      var bName = app.bible.book(bId,lId);
      // console.log(bName);
      bOb.each(function(cId, vOb){
        // console.log(bName,cId);
        var p=document.createElement('p');
        var cName = app.bible.digit(cId,lId);
        var vId = Query.nameVerse(vOb);
        // console.log(vId);
        var vName = app.bible.digit(vId,lId);
        p.innerHTML = app.bible.lang('nameVerse',lId).replace(/{b}/,bName).replace(/{c}/,cName).replace(/{v}/,vName);
        li.appendChild(p);
      })
    });
    /*
    try {
      var Query = new app.Query(lId);
      // var lOb = Query.ref('Gen.1.3');
      var lOb = Query.ref(text).result;
      if (lOb){
        lOb.each(function(bId,bOb){
          var bName = app.bible.book(bId,lId);
          console.log(bName);
          bOb.each(function(cId, vOb){
            var p=document.createElement('p');
            var cName = app.bible.digit(cId,lId);
            var vId = Query.nameVerse(vOb);
            var vName = app.bible.digit(vId,lId);
            p.innerHTML = app.bible.lang('nameVerse',lId).replace(/{b}/,bName).replace(/{c}/,cName).replace(/{v}/,vName);
            li.appendChild(p);
          })
        });
      }
    } catch (e) {
      console.log(e);
    } finally {
      
    }
    */
    
    return li;
  },
  ol:function(className){
    var e=document.createElement('ol');
    // e.classList = className;
    e.setAttribute('class',className);
    return e;
  }
};
var selectorBible=function(containerBible,callbackVerse){
  return new Promise(function(resolve, reject) {
    var containerBook;
    // NOTE: no query provided
    if (q.isEmpty()) {
      reject(result);
    } else {
      q.each(function(bookId,q,o,lastBook){
        var xmlBook = xmlBible.querySelector(selectorBook(bookId));
        var containerChapter;
        if (xmlBook) {
          result.book++;
          // result.parallel[bookId]={};
          // var abc = selectorChapter(q);
          // console.log(bookId,abc);
          var xmlChapters = xmlBook.querySelectorAll(selectorChapter(q));
          if (xmlChapters.length){
            xmlChapters.each(function(i,xmlChapter,queryVerse,lastChapter){
              result.chapter++;
              var containerVerse, container = html.ol('verse');
              var chapterId = xmlChapter.getAttribute('id');
              queryVerse = q.isEmpty()?[]:q[chapterId];
  
              var xmlVerses = xmlChapter.querySelectorAll(selectorVerse(queryVerse));
              if (xmlVerses.length){
                // result.parallel[bookId][chapterId]=[];
                xmlVerses.each(function(vId,xmlVerse,o,lastVerse){
                  var verseId = xmlVerse.getAttribute('id');
                  if (callbackVerse(container,xmlVerse,queryVerse)) {
                    result.verse++;
                    if (result.parallel){
                      if (!bibleParallel.hasOwnProperty(bookId))bibleParallel[bookId]={};
                      if (!bibleParallel[bookId].hasOwnProperty(chapterId))bibleParallel[bookId][chapterId]=[];
                      bibleParallel[bookId][chapterId].push(verseId);
                    }
                    
                    if (!containerBook)containerBook = containerBible.appendChild(html.ol('book'));
                    if (!containerChapter)containerChapter = html.book(containerBook,bookId).appendChild(html.ol('chapter'));
                    if (!containerVerse)containerVerse = html.chapter(containerChapter,bookId,chapterId).appendChild(container);
                  }
                  if (lastBook) {
                    if (lastChapter) {
                      if (lastVerse) {
                        if (result.verse) resolve(result); else reject(result);
                      }
                    }
                  }
                });
              } else if (lastChapter) {
                if (result.verse) resolve(result); else reject(result);
              }
            });
          } else if (lastBook) {
            if (result.verse) resolve(result); else reject(result);
          }
        } else if (lastBook) {
          if (result.verse) resolve(result); else reject(result);
        }
      });
    }
  });
};
// =require script.Content.exportor.js
var selectorBook=function(i){
  return 'book[id="0"]'.replace(0,i);
};
var selectorChapter=function(q){
  if (q.isEmpty()) {
    return 'chapter';
  } else {
    var response=[];
    for(var i in q)response.push('chapter[id="0"]'.replace(0,i));
    return response.join(',');
  }
};
var selectorVerse=function(q){
  return 'verse';
};
var searchVerse=function(s,k){
  // /keyword/.test(string)
  // new RegExp(keyword, "i").test(string)
  // return (string.search(new RegExp(keyword, "gi")) > -1)?true:false;
  // string.includes(keyword)
  return new RegExp(k, "gi").test(s);
};
var searchVerseId=function(s,n){
  var i=n.split('-');
  return s.has(i[0]);
};
var searchHighlight=function(s,k){
  return s.replace(new RegExp(k, "i"), '<b>$&</b>');
};
var responseBible={
  chapter:function(container){
    return selectorBible(container,function(container,xml,query){
      var verseId = xml.getAttribute('id'), verseText =xml.textContent || xml.innerText;
      var verseTitle = xml.getAttribute('title');
      var verseRef = xml.getAttribute('ref');
      // NOTE: search, match verse etc....
      // console.log(query);
      if (verseText){
        if (verseTitle) container.appendChild(html.title(verseTitle));
        container.appendChild(html.verse(verseId,verseText));
        if (verseRef) container.appendChild(html.ref(verseRef));
        return true;
      }
    });
  },
  lookup:function(container,paraSearch){
    // var isReference = new app.Query(lId).from(paraSearch);
    return selectorBible(container,function(container,xml,query){
      var verseId = xml.getAttribute('id'), verseText =xml.textContent || xml.innerText;
      // TODO: verseTitle
      // var verseTitle = xml.getAttribute('title');
      // var verseRef = xml.getAttribute('ref');
      // NOTE: search, match verse etc....
      if (query.length){
        if (searchVerseId(query,verseId)){
        // NOTE: get selected verses from current chapter
          container.appendChild(html.verse(verseId,verseText));
          return true;
        }
      } else if (paraSearch.constructor === Object) {
        // NOTE: get All verses from current chapter
        container.appendChild(html.verse(verseId,verseText));
        return true;
      } else if (searchVerse(verseText,paraSearch)){
        // NOTE: Search by keywords
        container.appendChild(html.verse(verseId,searchHighlight(verseText,paraSearch)));
        return true;
      }
    });
  },
  // reference:function(container){
  //   return selectorBible(container,function(container,xml,query){
  //   });
  // },
  // note:function(container){
  //   return selectorBible(container,function(container,xml,query){
  //   });
  // },
  parallel:function(container){
    return selectorBible(container,function(container,xml,query){
      var verseId = xml.getAttribute('id'), verseText =xml.textContent || xml.innerText;
      if (searchVerseId(query,verseId)){
        container.appendChild(html.verse(verseId,verseText));
        return true;
      }
    });
  },
  export:function(container){
    // \n, \t
    // var container = ['book','chapter','verse','text'].join(',')
    // var containerA1 ='"book","chapter","verse","text"\n';
    // var containerA1 ='"book","chapter","verse","text"';
    return exportorBible(container,function(xml,query){
      // var verseId = xml.getAttribute('id'), verseText =xml.textContent || xml.innerText;
      return true;
    });
  }
};
this.bible=function(i,o){
  lId = i;
  // result.parallel=o;
  // if (typeof o ==='object' && o.isEmpty()) result.parallel=o;
  if (typeof o ==='object' && o.isEmpty()) {
    result.parallel=true;
    bibleParallel=o;
  }
  return new Promise(function(resolve, reject) {
    new app.xml(i).request(function(){
      console.log('loading');
    }).then(function(e){
      xmlBible=e;
      resolve(responseBible);
    },function(e){
      reject(e);
    });
  });
};
/*
<ol class="book">
  <li id="tedim">
    <h2>...</h2>
    <ol class="chapter">
      <li id="1">
        <div>
          <h3>1</h3>
        </div>
        <ol class="verse">
          <li class="title">
            <h4>...</h4>
          </li>
          <li id="1" data-title="1">...</li>
          <li class="ref">...</li>
        </ol>
      </li>
    </ol>
  </li>
</ol>
*/