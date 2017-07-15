var exportorBible=function(containerBible,callbackVerse){
  return new Promise(function(resolve, reject) {
    // NOTE: no query provided
    if (q.isEmpty()) {
      reject(result);
    } else {
      var fileCSV='0.tsv',bookList = Object.keys(q);
      if (bookList.length == 66){
        var filename = fileCSV.replace(0,lId);
      } else {
        var filename = fileCSV.replace(0,lId+'-'+bookList.join(','));
      }
      q.each(function(bookId,q,o,lastBook){
        var xmlBook = xmlBible.querySelector(selectorBook(bookId));
        if (xmlBook) {
          result.book++;
          var xmlChapters = xmlBook.querySelectorAll(selectorChapter(q));
          if (xmlChapters.length){
            xmlChapters.each(function(i,xmlChapter,queryVerse,lastChapter){
              result.chapter++;
              var chapterId = xmlChapter.getAttribute('id');
              queryVerse = q.isEmpty()?[]:q[chapterId];
  
              var xmlVerses = xmlChapter.querySelectorAll(selectorVerse(queryVerse));
              if (xmlVerses.length){
                xmlVerses.each(function(vId,xmlVerse,o,lastVerse){
                  var verseId = xmlVerse.getAttribute('id'), verseText =xmlVerse.textContent || xmlVerse.innerText;
                  var verseTitle = xmlVerse.getAttribute('title'), verseReference = xmlVerse.getAttribute('ref');
                  if (callbackVerse(xmlVerse,queryVerse)) {
                    result.verse++;
                    // verseText.replace(/"/g, '\\"'), verseText.replace(/"/g, '')
                    if (verseText){
                      containerBible = containerBible + '\n' + [bookId,chapterId,verseId,verseText.replace(/"/g, '\\"'),verseTitle||'',verseReference||''].join("\t");
                    } else {
                      console.log(bookId,chapterId,verseId);
                    }
                  }
                  if (lastBook) {
                    if (lastChapter) {
                      if (lastVerse) {
                        var blob = new Blob([containerBible], { type: 'text/tsv;charset=utf-8;' });
                        if (navigator.msSaveBlob) { 
                            navigator.msSaveBlob(blob, filename);
                        } else {
                            var link = document.createElement("a");
                            if (link.download !== undefined) { // feature detection
                                // Browsers that support HTML5 download attribute
                                var url = URL.createObjectURL(blob);
                                link.setAttribute("href", url);
                                link.setAttribute("download", filename);
                                link.style.visibility = 'hidden';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }
                        }
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