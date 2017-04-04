// NOTE: divided into platform,device,view
page: {
  // =require script.Page.bible.js
  // =require script.Page.book.js
  // =require script.Page.chapter.js
  // =require script.Page.lookup.js
  // =require script.Page.note.js
  //require script.Page.help.js
},
xml:function(bId){
  // =require script.XML.js
},
// NOTE: used in device,dataLink, dataContent
lookup: {
  form:function(e){
    // =require script.Lookup.form.js
  },
  setting:function(e){
    // =require script.Lookup.setting.js
  }
},
// NOTE: used in device,dataLink, dataContent
bookmark: {
  menu:function(e){
    // =require script.Bookmark.menu.js
  }
},
// NOTE: used in device,dataLink, dataContent
parallel: {
  menu:function(e){
    // =require script.Parallel.menu.js
  }
},
// NOTE: used as language
bible: {
  // NOTE: all, available
  // NOTE: catalog -> section,book
  // =require script.Bible.catalog.js
  file:{
  },
  active: function(l) {
    return this.all[l ? l : app.localStorage.name.query.bible];
  },
  digit: function(n, l) {
    var digit = this.active(l).digit;
    if (Object.keys(digit).length) {
      return n.toString().replace(/[0-9]/g, function(i) {
        return digit[i];
      });
    }
    return n;
  },
  section: function(n, l) {
    return this.active(l).section[n];
  },
  testament: function(n, l) {
    return this.active(l).testament[n];
  },
  book: function(n, l) {
    return this.active(l).book[n];
  },
  lang: function(n, l) {
    return this.active(l).message[n];
  }
},
// NOTE: used in dataLink, dataContent
chapter: {
  get: {
    previous: function() {
      var bID = parseInt(app.localStorage.name.query.book),
        cID = parseInt(app.localStorage.name.query.chapter) - 1;
      if (cID < 1) {
        bID--;
        bID = (bID < 1) ? 66 : bID;
        cID = app.bible.catalog.book[bID].c;
      }
      return {
        book: bID,
        chapter: cID
      };
    },
    next: function() {
      var bID = parseInt(app.localStorage.name.query.book),
        cID = parseInt(app.localStorage.name.query.chapter) + 1;
      if (app.bible.catalog.book[bID].c < cID) {
        bID++;
        bID = (bID > 66) ? 1 : bID;
        cID = 1;
      }
      return {
        book: bID,
        chapter: cID
      };
    }
  },
  previous:function(){
    window.location.hash = this.get.previous().paramater(['chapter']);
    // clearInterval(this.timeoutNext);
  },
  next:function(e){
    window.location.hash = this.get.next().paramater(['chapter']);
    // var abc = this.get.next().paramater(['chapter']);
    // var timeout = setInterval(sayHi, 100); 
    // var sayHi = function(){
    //   // console.log('say hi');
    //   // abc.click();
    //   window.location.hash = app.chapter.get.next().paramater(['chapter']);
    //   // console.log(e);
    // };
    // var timeout = setTimeout(sayHi, 10000); 
    // var timeout = setInterval(this.timeoutNext, 150); 
    // console.log(e);

    // var myVar = setInterval(function(){ 
    //   window.location.hash = abc;
    // }, 1000);
    
    // function myStopFunction() {
    //     clearInterval(myVar);
    // }
  },
  current:function(e){
    // =require script.Chapter.current.js
  },
  timeoutNext:function(){
    window.location.hash = app.chapter.get.next().paramater(['chapter']);
  }
},
Content: function(q) {
  // =require script.Content.js
},
Query: function(lId) {
  // =require script.Query.js
},
// asdfadsf: function(obj,lId,bId,cId) {
//   // var localName = app.localStorage.name;
//   if (!obj.hasOwnProperty(lId))!local.name.todo[lId]={};
//   if (!obj[lId].hasOwnProperty(bId))local.name.todo[lId][bId]={};
//   // if (!obj[lId][bId].hasOwnProperty(query.chapter))local.name.todo[lId][bId][query.chapter]={};
//   // if (!obj[lId][query.book][query.chapter].hasOwnProperty('empty'))local.name.todo[lId][query.book][query.chapter].empty='?';
// },
// task: function(lId) {
//   // =require script.taskCommand.js
//   return new command;
// }