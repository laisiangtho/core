// lId,bId, cId, vId, 
// lOb,bOb, cOb, vOb, 
// lId,bId, cId, vId, 
var local = app.localStorage;
var parallelContainer = app.main.container().querySelector('div.active').querySelector('ol.parallel');
var bookmarkSelector = function(callbackChapter,callbackVerse,activeVerse){
  var resultObject = {bookmark:{}, book:0, chapter:0, verse:0};
  var parallelContainer = app.main.container().querySelector('div.active').querySelector('ol.parallel');
  if (!parallelContainer) return resultObject;
  var verseSelector = 'ol.verse>li[id]';
  if (activeVerse) verseSelector=verseSelector.replace('[id]','[id].active');
  parallelContainer.firstChild.querySelectorAll('ol.book>li').each(function(i,bO){
    var bId = bO.getAttribute('id');
    resultObject.book++;
    bO.querySelectorAll('ol.chapter>li').each(function(i,cO){
      var cId = cO.getAttribute('id'), xmlVerse = cO.querySelectorAll(verseSelector);
      if (callbackChapter(bId,cId,xmlVerse.length)){
        resultObject.chapter++;
        xmlVerse.each(function(i,vO,o,lastVerse){
          var vId = vO.getAttribute('id');
          if (callbackVerse(vO,bId,cId,vId,lastVerse))resultObject.verse++;
        });
      }
    });
  });
  return resultObject;
};
/*
var bookmarkSelector = function(callbackVerse,activeVerse){
  var resultObject = {
    bookmark:{}, book:0, chapter:0, verse:0
  };
  var parallelContainer = app.main.container().querySelector('div.active').querySelector('ol.parallel');
  if (!parallelContainer) return resultObject;
  var verseSelector = 'ol.verse>li[id]';
  if (activeVerse) verseSelector=verseSelector.replace('[id]','[id].active');
  parallelContainer.firstChild.querySelectorAll('ol.book>li').each(function(i,bO){
    var bId = bO.getAttribute('id');
    resultObject.book++;
    bO.querySelectorAll('ol.chapter>li').each(function(i,cO){
      var cId = cO.getAttribute('id');
      resultObject.chapter++;
      // if (typeof activeVerse==='function')activeVerse(cO,bId,cId);
      var xmlVerse = cO.querySelectorAll(verseSelector);
      if (xmlVerse.length) {
        if (typeof activeVerse==='function')activeVerse(cO,bId,cId,false);
        xmlVerse.each(function(i,vO,o,lastVerse){
          var vId = vO.getAttribute('id');
          if (callbackVerse(vO,bId,cId,vId,lastVerse)){
            resultObject.verse++;
            // if (!resultObject.bookmark.hasOwnProperty(bId))resultObject.bookmark[bId]={};
            // if (!resultObject.bookmark[bId].hasOwnProperty(cId))resultObject.bookmark[bId][cId]=[];
            // resultObject.bookmark[bId][cId].push(vId);
          }
        });
      } else {
        if (typeof activeVerse==='function')activeVerse(cO,bId,cId,true);
      }
    });
  });
  return resultObject;
};
*/
var bookmarkCount = function(){
  var rOb = bookmarkSelector(function(){
    // NOTE: callbackChapter
    return true;
  },function(){
    // NOTE: callbackVerse
    return true;
  },true);
  bookmarkActive(rOb.verse);
};
var bookmarkActive = function(totalVerse){
  if (totalVerse > 0){
    e.setAttribute('data-title',app.bible.digit(totalVerse));
  } else {
    e.removeAttribute('data-title');
  }
};
var bookmarkDelete = function(id,bId,cId){
  if (local.name.bookmark[id].book.hasOwnProperty(bId)){
    if (local.name.bookmark[id].book[bId].hasOwnProperty(cId)){
      if (local.name.bookmark[id].book[bId][cId].length == 0){
        delete local.name.bookmark[id].book[bId][cId];
        if (local.name.bookmark[id].book[bId].isEmpty()){
          delete local.name.bookmark[id].book[bId];
        }
      }
    }
  }
};
// unusable, usable
if (parallelContainer) {
  e.classList.remove('unusable');
  parallelContainer.querySelector('ol.book').eventClick(function(event){
    var o = event.target;
    if (o.parentNode.classList.contains('verse')){
      if (o.hasAttribute("id")){
        o.classList.toggle('active');
        bookmarkCount();
        // event.stopPropagation();
      }
    }
  });
  bookmarkCount();
} else {
  // e.classList.add('unusable');
  // e.removeAttribute('data-title');
  e.removeAttr('data-title').addClass('unusable');
}
/*
var lId = local.name.query.bible;
var Query = new app.Query(lId).str('Gen 1:2,5,7-9,20-25').result;
console.log(Query);
*/

app.Toggle.menu(e,function(container){
  // var ol = document.createElement('ol');
  // ol.setAttribute('class','list-bookmark');
  var ol = app.elementCreate('ol').addClass('list-bookmark');
  container.appendChild(ol);
  local.name.bookmark.each(function(id,o){
    var li = document.createElement('li'), 
    highlight = document.createElement('p'), 
    remove = document.createElement('p'),
    add = document.createElement('p');
    highlight.innerHTML = o.name;
    // add.setAttribute('class','add icon-'+id);
    add.setAttribute('class','add icon-check-in');
    remove.setAttribute('class','remove icon-wrong');
    var rOb = bookmarkSelector(function(bId,cId){
      if (local.name.bookmark[id].book.hasOwnProperty(bId)){
        if (local.name.bookmark[id].book[bId].hasOwnProperty(cId)){
          return true;
        }
      }
      return false;
    },function(vO,bId,cId,vId){
      if (local.name.bookmark[id].book[bId][cId].has(vId)){
        return true;
      }
    },false);
    if (rOb.verse > 0 ){  
      li.classList.add('active');
    } else {
      li.classList.remove('active');
    }
    // if (rOb.bookmark.isEmpty()){  
    //   li.classList.remove('active');
    // } else {
    //   li.classList.add('active');
    // }
    li.eventClick(function(event){
      var o = event.target;
      if (o.classList.contains('add')){
        // NOTE: Add
        var verseRequireSplit = false;
        var rOb = bookmarkSelector(function(bId,cId,hasVerse){
          if (!local.name.bookmark[id].book.hasOwnProperty(bId))local.name.bookmark[id].book[bId]={};
          local.name.bookmark[id].book[bId][cId]=[];
          verseRequireSplit=false;
          if (hasVerse) return true;
          bookmarkDelete(id,bId,cId);
        },function(vO,bId,cId,vId,lastVerse){
          // if (!local.name.bookmark[id].book.hasOwnProperty(bId))local.name.bookmark[id].book[bId]={};
          // if (!local.name.bookmark[id].book[bId].hasOwnProperty(cId))local.name.bookmark[id].book[bId][cId]=[];
          // if (!local.name.bookmark[id].book[bId][cId].has(vId))local.name.bookmark[id].book[bId][cId].push(vId);
          // local.name.bookmark[id].book[bId][cId].push(vId);
            // var lId = local.name.query.bible;
            // var Query = new app.Query(lId).nameVerse(vId.split('-'));
            // console.log(Query);
          if (vId.split('-').length>1)verseRequireSplit=true;
          local.name.bookmark[id].book[bId][cId].push(vId);
          if (lastVerse && verseRequireSplit){
            // console.log(local.name.query.bible);
            var lId = local.name.query.bible;
            var Query = new app.Query(lId).obj(local.name.bookmark[id].book).result;
            local.name.bookmark[id].book = Query;
            // console.log('lastVerse',lastVerse,Query);
            // console.log(Query);
          }
          return true;
        },true);
        bookmarkActive(rOb.verse);
        if (rOb.verse > 0 ){  
          li.classList.add('active');
        } else {
          li.classList.remove('active');
        }
      } else if (o.classList.contains('remove')) {
        // NOTE: Remove
        var rOb = bookmarkSelector(function(bId,cId){
          return true;
          // if (local.name.bookmark[id].book.hasOwnProperty(bId)){
          //   if (local.name.bookmark[id].book[bId].hasOwnProperty(cId)){
          //     return true;
          //   }
          // }
        },function(vO,bId,cId,vId){
          if (local.name.bookmark[id].book.hasOwnProperty(bId)){
            if (local.name.bookmark[id].book[bId].hasOwnProperty(cId)){
              if (local.name.bookmark[id].book[bId][cId].has(vId)){
                local.name.bookmark[id].book[bId][cId].remove(vId);
                vO.classList.remove('active');
                if (local.name.bookmark[id].book[bId][cId].length == 0){
                  delete local.name.bookmark[id].book[bId][cId];
                  if (local.name.bookmark[id].book[bId].isEmpty()){
                    delete local.name.bookmark[id].book[bId];
                  }
                }
              }
            }
          }
          // if (local.name.bookmark[id].book[bId][cId].has(vId)){
          //   local.name.bookmark[id].book[bId][cId].remove(vId);
          //   vO.classList.remove('active');
          //   if (local.name.bookmark[id].book[bId][cId].length == 0){
          //     delete local.name.bookmark[id].book[bId][cId];
          //     if (local.name.bookmark[id].book[bId].isEmpty()){
          //       delete local.name.bookmark[id].book[bId];
          //     }
          //   }
          // }
        });
        li.classList.remove('active');
        bookmarkActive(0);
        // bookmarkActive(rOb.verse);
      } else {
        // NOTE: Highlight
        var rOb = bookmarkSelector(function(bId,cId){
          return true;
          // if (local.name.bookmark[id].book.hasOwnProperty(bId)){
          //   if (local.name.bookmark[id].book[bId].hasOwnProperty(cId)){
          //     return true;
          //   }
          // }
        },function(vO,bId,cId,vId){
          if (local.name.bookmark[id].book.hasOwnProperty(bId)){
            if (local.name.bookmark[id].book[bId].hasOwnProperty(cId)){
              // vId.split('-');
              if (local.name.bookmark[id].book[bId][cId].has(vId.split('-')[0])){
                vO.setAttribute('class','active');
                return true;
              }
            }
          }
          // if (local.name.bookmark[id].book[bId][cId].has(vId)){
          //   vO.setAttribute('class','active');
          //   return true;
          // }
          vO.classList.remove('active');
        });
        bookmarkActive(rOb.verse);
      }
    });
    li.appendChild(add); li.appendChild(highlight); li.appendChild(remove); ol.appendChild(li);
  });
},function(){
  local.update('bookmark');
});
// var bookmarkMenu = {
//   bookmarks: {
//     name: "Bookmarks"
//   },
//   note: {
//     name: "Notes"
//   },
//   pin: {
//     name: "Pin"
//   },
//   map: {
//     name: "Map"
//   },
//   message: {
//     name: "Message"
//   }
// };