var command=function(){
  this.scan=function(){
    var bibleQuery = JSON.parse(JSON.stringify(app.bible.catalog.book));
    var bookQuery={};
    // var chapterQuery={};
    // var verseQuery={};
    var bookList=[];
    var chapterList=[];
    var verseList=[];
    // var bible=app.bible.catalog.book
    console.log(bibleQuery);
    // bibleQuery[1].v
    var url = 'https://www.bible.com/bible/lId/bId.cId.vId.json'.replace('lId',lId);
    var access = function(api,progressCallback){
      // return api;
      return app.fileStorage.download({
        // url: urlreplace('lId',lId).replace('bId',bId).replace('cId',vId).replace('cId',vId),
        // url: url.replace('bId',bId).replace('cId',vId).replace('cId',vId),
        // url: 'https://www.bible.com/bible/131/mat.5.1.json',
        url:api,
        before:function(o){
          // o.setCharacterEncoding("UTF-8");
          // o.overrideMimeType('application/json; charset=utf-8');
          // o.setRequestHeader("Access-Control-Allow-Origin", "*");
          // o.setRequestHeader("Access-Control-Allow-Origin", "https://www.bible.com");
          // o.overrideMimeType('text/json; charset=utf-8');
          
          o.setRequestHeader('Access-Control-Allow-Origin', 'http://www.example.com');
          o.setRequestHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
          o.setRequestHeader('Access-Control-Allow-Headers', 'Content-Type');
        },
        progress: progressCallback
      });
    };
    var process=function(){
      // book,chapter,verse
      // access(url.replace('bId',bId).replace('cId',vId).replace('cId',vId))
      // var chapter = bibleQuery[1].v.shift();
      // var chapter = bibleQuery[1].c;
      // console.log(url,chapter);
      
      // for (i = 0, chapter; i < chapter; ) { 
      //   i++;
      //     // text += cars[i] + "<br>";
      //     console.log(i);
      // }
      // bookLists();//verses(1);
      // var chapter = chapterList.shift();
      // var chapter = chapterList.shift();
      // verseLists(chapter);
      // var verse = verseList.shift();
      
      var book = bookList.shift();
      // chapterLists(book);
      // var chapter = chapterList.shift();
      // verseLists(chapter);
      // var verse = verseList.shift();
      
      // console.log(book,chapter,verse);
      if (book){
        chapterLists(book);
        var chapter = chapterList.shift();
        if (chapter) {
          verseLists(chapter);
          var verse = verseList.shift();
          if (verse) {
            // var urlAPI = url.replace('bId',book).replace('cId',chapter).replace('vId',verse);
            var urlAPI = 'https://www.bible.com/bible/131/mat.5.1.json';
            // console.log(urlAPI);
            access(urlAPI,function(){
              // NOTE: Progess
              console.log('progess');
            }).then(function(){
              // NOTE: Success
              console.log('success');
            },function(e){
              // NOTE: Fail
              console.log('fail',e);
            });
          }
        }
      }
      
      return 'scanning';
    };
    var initiate=function(){
      bookLists();process();
    };
    var bookLists=function(){
      bibleQuery.each(function(i){
        bookList.push(parseInt(i));
      });
    };
    var chapterLists=function(book){
      chapterQuery=bibleQuery[book];
      // chapterQuery=bookQuery.c;
      var chapter=chapterQuery.c;
      for (i = 0, chapter; i < chapter; ) { 
        i++;
        chapterList.push(i);
      }
    };
    var verseLists=function(chapter){
      var v=chapterQuery.v[chapter-1];
      for (i = 0, v; i < v; ) { 
        i++;
        verseList.push(i);
      }
    };
    return initiate();
  };
}