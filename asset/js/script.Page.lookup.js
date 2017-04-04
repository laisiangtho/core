lookup:function(resolve, reject){
  var configuration = app.config, local = app.localStorage, query = local.name.query, ol=document.createElement('ol');
  var lookupBook = JSON.stringify(local.name.lookup.book);
  var lookupQuery;
  var reader={
    container:function(){
      var div = app.Toggle.main();
      // console.log(local.name.lookup.book, configuration.parallel.lookup);
      if (div.children.length) {
        // || local.name.lookup.book !== configuration.parallel.lookup
        // console.log('is',lookupBook != configuration.lookup);
        // console.log(JSON.stringify(lookupBook),configuration.lookup,JSON.stringify(lookupBook) !== configuration.lookupBook);
        if (query.bible != configuration.bible || query.q != configuration.q || lookupBook !== configuration.lookupBook) {
          return div.emptyElement().appendChild(ol);
        }
      } else {
        return div.appendChild(ol);
      }
    },
    initiate:function(){
      if (this.container()){
        // NOTE: is Reference
        lookupObject = new app.Query(query.bible).from(query.q);
        // NOTE: Parallel create
        // configuration.parallel={};
        // configuration.parallel.lookup={};
        configuration.parallel[query.page]={};
        // NOTE: previous
        configuration.lookupBook=lookupBook;
        configuration.bible=query.bible;
        configuration.q=query.q;
        // configuration.chapter=query.chapter;
        // ol.classList='parallel';
        // ol.setAttribute('class','parallel');
        this.bible();
      } else {
        resolve();
      }
    },
    bible:function(){
      var li=document.createElement('li');
      new app.Content(lookupObject || local.name.lookup.book).bible(query.bible,configuration.parallel[query.page]).then(function(e){
        e.lookup(li,lookupObject || query.q).then(function(e){
          // console.log('333');
          // ol.appendChild(li).classList=query.bible;
          ol.appendChild(li);
          ol.setAttribute('class','parallel');
          li.setAttribute('class',query.bible);
          console.log('lookup done');
        },function(e){
          ol.appendChild(li);
          ol.setAttribute('class','main-nomatch');
          if (query.q){
            // NOTE: Query Provided but
            var keyword=document.createElement('span');
            keyword.setAttribute('class','keyword');
            keyword.innerHTML=query.q;
            var h1=document.createElement('h1');
            h1.innerHTML=app.bible.lang('noMatchFor').replace(/{for}/,keyword.outerHTML);
            li.appendChild(h1);
            var suggestion=document.createElement('p');
            if (local.name.lookup.book.isEmpty()){
              // NOTE: noBookSelected
              suggestion.innerHTML=app.bible.lang('noBookSelected');
            } else {
              // NOTE: noMatchFor
              var booklist = [];
              local.name.lookup.book.each(function(i){
                booklist.push(app.bible.book(i))
              });
              suggestion.innerHTML=booklist.toSentence();
            }
            li.appendChild(suggestion);
          } else {
            // NOTE: No Query Provide
            li.innerHTML=app.bible.lang('Discover');
          }
          
          
        });
      },function(e){
        console.log('bible error',e);
      }).then(function(){
        resolve();
      });
    }
  };
  reader.initiate();
},