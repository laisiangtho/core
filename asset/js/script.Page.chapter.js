chapter:function(resolve, reject){
  var configuration = app.config, local = app.localStorage, query = local.name.query, ol=document.createElement('ol');
  var reader={
    query:{
      // 88:{
      //   1:[],
      //   3:[]
      // },
      // 1:{
      //   1:[1],
      //   2:[1,2]
      // },
      // 6:{
      //   1:[],
      //   2:[1,2]
      // }
    },
    parallel:{},
    container:function(){
      var div = app.Toggle.main();
      if (div.children.length) {
        if (query.bible != configuration.bible || query.book != configuration.book || query.chapter != configuration.chapter) {
          return div.emptyElement().appendChild(ol);
        }
      } else {
        return div.appendChild(ol);
      }
    },
    initiate:function(){
      if (this.container()){
        // NOTE: Parallel create
        // configuration.parallel={};
        // configuration.parallel.chapter={};
        configuration.parallel[query.page]={};
        // NOTE: Content query
        this.query[query.book]={};
        this.query[query.book][query.chapter]=[];
        this.parallel = [query.bible].merge(query.parallel);
        // this.parallel = [query.bible].merge(['mcl','tedim']);
        // this.parallel = ['mcl','tedim'];
        // ol.classList='parallel';
        ol.setAttribute('class','parallel');
        // ol.classList.add('b'+this.parallel.length);
        // NOTE: previous
        configuration.bible=query.bible;
        configuration.book=query.book;
        configuration.chapter=query.chapter;
        // NOTE: Process
        this.process();
      } else {
        resolve();
      }
    },
    process:function(){
      if (this.parallel.length){
        this.bible(this.parallel.shift());
      } else {
        resolve();
      }
    },
    bible:function(lId){
      var li=document.createElement('li');
      // configuration.parallel.isEmpty()?true:false
      new app.Content(this.query).bible(lId,configuration.parallel[query.page]).then(function(e){
        e.chapter(li).then(function(e){
          ol.appendChild(li);//.classList=lId;
          li.setAttribute('class',lId);
        },function(e){
          // console.log('reader fail',e);
          // console.log(lId,query.book,query.chapter);
          if (!local.name.todo.hasOwnProperty(lId))local.name.todo[lId]={};
          if (!local.name.todo[lId].hasOwnProperty(query.book))local.name.todo[lId][query.book]={};
          if (!local.name.todo[lId][query.book].hasOwnProperty(query.chapter))local.name.todo[lId][query.book][query.chapter]={};
          if (!local.name.todo[lId][query.book][query.chapter].hasOwnProperty('empty')){
            local.name.todo[lId][query.book][query.chapter].empty='missing';
            local.update('todo');
          }
          reject('lId bId:cId is missing'.replace(/lId/,lId).replace(/bId/,query.book).replace(/cId/,query.chapter));
        });
      },function(e){
        console.log('bible error',e);
      }).then(function(){
        reader.process();
      });
    }
  };
  reader.initiate();
},