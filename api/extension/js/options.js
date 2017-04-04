// filesystem:chrome-extension://lcmknmcmehicpjpipmackdfokokcjkcj/temporary/
// filesystem:chrome-extension://lcmknmcmehicpjpipmackdfokokcjkcj/persistent/
/*
active*
get*
display*
show*
*/
// https://www.bible.com/versions.json
// https://www.bible.com/versions/386.json
// https://www.bible.com/bible/131/mat.5.json
// https://www.bible.com/bible/131/mat.5.1.json
// http://www.bible.is/ENGESV/Gen/1?chapter=1&verse=4

var testScan = 0;
var ApiLanguage= 'https://www.bible.com/versions.json';
var ApiBible = 'https://www.bible.com/versions/lId.json';
var ApiChapter = 'https://www.bible.com/bible/lId/bId.cId.json';
var ApiVerse = 'https://www.bible.com/bible/lId/bId.cId.vId.json';

var urlLocalBible = 'lId.xml';
var urlLocalBook = 'lId/bId.xml';

var working=false, workingStart = new Date().getTime(), workingEnd;
// var seedBibleTotal = 0, actionScanElement;
var seedTotal = 0, seedActionElement;

var savingEach ='bible'; //bible ,book;

var local, file, elementMessage, jsonVersions={};
scriptive({
  initiate:function(){
    seedActionElement=document.querySelector('li.scan');
    local = this.localStorage.select('query');
    this.fileStorage().then(()=>{
      this.process();
    },(e)=>{
      // NOTE: fileStorage error
      this.container('footer').innerHTML='storage Error';
      console.log(e);
    });
  },
  process:function(){
    elementMessage = this.container('footer');
    elementMessage.innerHTML='Getting ready...';
    local = this.localStorage.select('query');
    this.getVersions().then((is)=>{
      if (is){
        var element = document.querySelector('main>div>ol');
        element.eventHandler('click',(i)=>{
          var e = i.target;
          if (e.classList.contains('i01')) {
            if (!working) this.actionOptionIndividual(e.parentNode,e.textContent || e.innerText);
          }
        });
        document.querySelector('ol.command').eventHandler('click',(i)=>{
          var e = i.target;
          if (e.classList.contains('scan')) {
            if (!working) this.actionScan();
          } else if (e.classList.contains('versions')) {
            if (!working) this.actionVersionsRenew();
          } else if (e.classList.contains('stop')) {
            working=false;
          }
        });
      }
    });
  },
  actionScan:function(){
    if (working) return working;
    var ul = this.container('footer',true).appendChild(document.createElement('ul')),
        li = ul.appendChild(document.createElement('li')),
        h1 = li.appendChild(document.createElement('h1')),
        h2 = li.appendChild(document.createElement('h2')),
        div = li.appendChild(document.createElement('div'));
        
    h1.innerHTML = 'Scan';
    li.setAttribute('class','unusable');
    div.innerHTML = '...awaiting USER actions';
    this.getSeeds().then((e)=>{
      var scanEachBibleElement = li.appendChild(document.createElement('p'));
      scanEachBibleElement.innerHTML='Bible';
      scanEachBibleElement.setAttribute('class','bible');
      scanEachBibleElement.eventHandler('click',()=>{
        if (!working){
          if (e.length) {
            working='scanning';
            savingEach='bible';
            workingStart = new Date().getTime();
            h1.innerHTML = new Date(workingStart).toJSON().replace(/-/g,' ').replace('T',' ');
            this.actionScanning(li,h1,h2,div,e);
          } else {
            div.innerHTML = '...no SEED available';
          }
        }
      });

      var scanEachBookElement = li.appendChild(document.createElement('p'));
      scanEachBookElement.innerHTML='Book';
      scanEachBookElement.setAttribute('class','book');
      scanEachBookElement.eventHandler('click',()=>{
        if (!working){
          if (e.length) {
            working='scanning';
            savingEach='book';
            workingStart = new Date().getTime();
            h1.innerHTML = new Date(workingStart).toJSON().replace(/-/g,' ').replace('T',' ');
            this.actionScanning(li,h1,h2,div,e);
          } else {
            div.innerHTML = '...no SEED available';
          }
        }
      });

      var stopScanElement = li.appendChild(document.createElement('p'));
      stopScanElement.innerHTML='Stop';
      stopScanElement.setAttribute('class','stop');
      stopScanElement.eventHandler('click',()=>{
        if (working){
          li.setAttribute('class','unusable');
          working=false;
        } else {
          div.innerHTML = '...has been STOPPED already';
        }
      });
      // this.actionScanning(div,e);
    },()=>{
      // NOTE: no seed
      div.innerHTML = 'there is NOTHING to scan';
    });
  },
  actionScanning:function(eLi, eH1, eH2, eDv, seedBible){
    var seedBook={};
    var currentBible, currentBook, currentChapter, currentVerses;
    var currentBibleName, currentBookName, currentBookShort;
    var currentBibleId, currentBookId, currentChapterId, currentVerseId;
    var xmlDoc, xmlBible, xmlBook, xmlChapter, xmlVerse;
    // var xmlDocEach, xmlBibleEach;
    var saveBible=function(i){
      return new Promise(function(resolve, reject) {
        if (i===true){
          if (savingEach =='bible'){
            if (xmlDoc) {
              return file.save({
                urlLocal: urlLocalBible.replace('lId',currentBibleId),
                fileType: 'application/xml',
                blob:new Blob([getXMLToString()], {type: 'application/xml; charset=utf-8'})
              }).then(function(){
                localBibleAdd(currentBibleId);
                localSeedDelete(currentBibleId);
                var ele = document.getElementById(currentBibleId);
                // ele.setAttribute('class','active');
                ele.classList.add('active');
                ele.classList.remove('seed');
                return '...save...';
              },function(e){
                return e;
              }).then(function(e){
                resolve(e);
              });
            }
          } else if (savingEach == 'book'){
            localSeedDelete(currentBibleId);
            var ele = document.getElementById(currentBibleId);
            // ele.setAttribute('class','active');
            // TODO: last
            ele.classList.remove('seed');
            ele.classList.add('booklist');
            var t = localBookListCheckTotal(currentBibleId);
            if (t >= 66){
              ele.classList.add('booklist');
              ele.classList.remove('booklist-incomplete');
            } else {
              ele.classList.remove('booklist');
              ele.classList.add('booklist-incomplete');
            }
            
            // var tmp = document.getElementById(currentBibleId);
            // if (!tmp.classList.contains('booklist-incomplete')){
            //   tmp.classList.remove('booklist');
            //   tmp.classList.add('booklist-incomplete');
            // }
          }
        }
        resolve();
      }).then(function(e){
        if (e)console.warn(e);
      },function(){
      });
    };
    var saveBook=function(i){
      return new Promise(function(resolve, reject) {
        if (i === true){
          if (savingEach =='book'){
            if (xmlDoc) {
              return file.save({
                urlLocal: urlLocalBook.replace('lId',currentBibleId).replace('bId',currentBookId),
                fileType: 'application/xml',
                blob:new Blob([getXMLToString()], {type: 'application/xml; charset=utf-8'})
              }).then(function(){
                localBookAdd(currentBibleId,currentBookId);
                console.log('...save',currentBookId,currentBookName);
              },function(e){
                console.warn(e);
              }).then(function(){
                var e = xmlDoc.querySelector('bible book');
                e.parentNode.removeChild(e);
                resolve();
              });
            }
          }
        }
        resolve();
      }).then(function(){
      },function(){
      });
    };
    var saveMessage=function(id,msg){
      localMsgAdd(currentBibleId,id,msg);
      console.warn(msg);
    };
    var getBible=function(is){
      eLi.setAttribute('class','active');
      saveBible(is).then(function(){
        // xmlDoc='', xmlBible='', xmlBook='', xmlChapter='', xmlVerse='';
        if (seedBible.length){
          currentBibleId = seedBible.shift();
          seedBook = JSON.parse(JSON.stringify(books));
          file.download({
            url:ApiBible.replace('lId',currentBibleId),
            before:function(e){
              e.overrideMimeType('application/json; charset=utf-8');
            },
            progress:function(e){
              eDv.innerHTML='Processing lId Done%'.replace('lId',currentBibleId).replace('Done',e);
            }
          }).then(function(e){
            currentBible = JSON.parse(e.data)[0];
            currentBibleId = currentBible.id;
            console.log('...',currentBibleId,currentBible.title);
            getXMLFormat(function(){
              // ApiBibleResponse.title
              // ApiBibleResponse.language.name
              // ApiBibleResponse.language.text_direction
              // ApiBibleResponse.language.iso_639_1
              
              // xmlBible.setAttribute('id',currentBibleId);
              var name = xmlBible.appendChild(createInfo('name',currentBible.title));
              name.setAttribute('code',currentBibleId);
              // xmlBible.appendChild(name);
              var language = xmlBible.appendChild(createInfo('language',currentBible.language.name));
              language.setAttribute('shortname',currentBible.language.iso_639_1);
              language.setAttribute('textdirection',currentBible.language.text_direction);
              eH2.innerHTML=currentBible.title;
              eH2.setAttribute('title',currentBibleId);
              // xmlBible.appendChild(language);
              if (currentBible.publisher && currentBible.publisher.hasOwnProperty('name')){
                var publisher = xmlBible.appendChild(createInfo('publisher',currentBible.publisher.description || currentBible.publisher.name));
                if (currentBible.publisher.description && currentBible.publisher.name)publisher.setAttribute('name',currentBible.publisher.name);
                if (currentBible.publisher.url)publisher.setAttribute('url',currentBible.publisher.url);
                // xmlBible.appendChild(publisher);
              }
              // xmlBible.appendChild(createInfo('langauge',currentBible.language.name));
              // xmlBible.appendChild(createInfo('lang',currentBible.language.iso_639_1));
              
              // xmlBible.appendChild(createInfo('copyright','ccc'));
              // xmlBible.appendChild(createInfo('year','0000'));
              getBook(false);
            },function(e){
              // NOTE: XMLFormat Error, and sendback to getBible
              saveMessage('XMLFormat','XMLFormat download Error');
              getBible(false);
            });
          },function(e){
            // NOTE: versions/lId.json download Error, and sendback to getBible
            saveMessage('lId','versions/lId.json download Error');
            getBible(false);
          });
        } else {
          // NOTE: Bible Completed
          eDv.innerHTML='Finish';
          eLi.setAttribute('class','unusable');
          working=false;
        }
      });
    };
    var getBook=function(is){
      if (currentBible.books.length){
        currentBook = currentBible.books.shift();
        currentBookShort = currentBook.usfm.toLowerCase();
        currentBookId = getBookId(currentBookShort);
        currentBookName = (currentBook.human && currentBook.abbreviation && (currentBook.abbreviation.toLowerCase() == currentBookShort || currentBook.human.toLowerCase() != currentBookShort))?currentBook.human:currentBook.human_long;
        var shortName = (currentBookName == currentBook.human)?currentBookShort:currentBook.human;
        if (currentBookId){
          if (savingEach =='bible')console.log(currentBookId,shortName,currentBookName);
          // TODO: check book, if exists sendback to getBook
          if (savingEach == 'book' && localBookCheck(currentBibleId,currentBookId)) {
            eDv.innerHTML='bId was already saved'.replace('bId',currentBookName);
            setTimeout(function(){
              getBook(true);
            }, 300);
          } else {
            createBook(currentBookId,currentBookName,shortName);
            getChapter(false);
          }
        } else {
          // NOTE: No currentBookId, and sendback to getBible
          saveMessage('currentBookId','empty');
          // getBible(false);
          getBook(false);
        }
      } else {
        // NOTE: Completed 'currentBookId' successfully, and sendback to getBible
        getBible(is);
      }
    };
    var getBookId=function(e){
      var y;
      for(var i in names){
          var x=names[i].map(function(value){
              return value.toLowerCase();
          }).indexOf(e.trim().toLowerCase());
          if(x >= 0){ y=i; break; }
      }
      return parseInt(y);
    };
    var getChapter=function(is){
      if (currentBook.chapters.length) {
        currentChapter = currentBook.chapters.shift();
        currentChapterId = parseInt(currentChapter.human);
        if (testScan > 0 && testScan < currentChapterId){
          // NOTE: test ON and sendback to getBook
          currentBook.chapters=[];
          return getChapter(true);
        }
        createChapter(currentChapterId);
        currentVerses=[];
        // NOTE: verseList-->seedBook[currentBookId].v[currentChapterId-1];
        var verseList = seedBook[currentBookId].v.shift();
        for (i = 1; i <= verseList; i++) {
          currentVerses.push(i);
        }
        return getVerse(false);
      }
      // NOTE: Completed 'currentChapterId' successfully, and sendback to getBook
      saveBook(is).then(function(){
        getBook(is);
      });
    };
    var getVerse=function(){
      if (currentVerses.length) {
        currentVerseId = currentVerses.shift();
        if (!working) {
          // NOTE: user STOP/SKIP, and sendback to getBible
          // TODO: stop: this is only for each bible, what about every bible?
          working ='scanning';
          console.log('...','Stop');
          getBible(false);
          return eDv.innerHTML='working again';
        }
        if (testScan > 0 && testScan < currentVerseId){
          // NOTE: test ON and sendback to getChapter
          return getChapter(true);
        }
        var localMessageId = 'bId.cId.vId'.replace('bId',currentBookShort).replace('cId',currentChapterId).replace('vId',currentVerseId);
        var currentStatusMessage = 'bId cId:vId Done%'.replace('bId',currentBookName).replace('cId',currentChapterId).replace('vId',currentVerseId);
        return file.download({
          url:ApiVerse.replace('lId',currentBibleId).replace('bId',currentBookShort).replace('cId',currentChapterId).replace('vId',currentVerseId),
          before:function(e){
            e.overrideMimeType('application/json; charset=utf-8');
          },
          progress:function(n){
            eDv.innerHTML=currentStatusMessage.replace('Done',n);
            eDv.classList.toggle('scanning');
          }
        }).then(function(e){
          try {
            var json = JSON.parse(e.data);
            if (json.hasOwnProperty('reader_html') && json.reader_html) {
              createVerse(currentVerseId,json.reader_html);
            } else {
              saveMessage(localMessageId,'verse Empty');
            }
          } catch (e) {
            saveMessage(localMessageId,'json.parse Error');
          } finally {
            getVerse();
          }
        },function(e){
          // NOTE: bible/lId/bId.cId.vId.json download Error
          eDv.innerHTML='bible/lId/bId.cId.vId.json download Error';
          saveMessage(localMessageId,'download Error');
          getVerse();
        });
      }
      // NOTE: each Chapter 'currentVerseId' completed successfully, and sendback to getChapter to get new chapter of the book
      getChapter(true);
    };
    var getXMLFormat = function(resolve,reject){
      file.download({
        url:'format.xml',
        before:function(e){
          e.overrideMimeType('application/xml; charset=utf-8');
          e.responseType = 'document';
        },
        progress:function(){
        }
      }).then(function(e){
        // xmlDocEach, xmlBibleEach;
        // xmlDocEach = e.data;
        xmlDoc = e.data;
        xmlBible = xmlDoc.querySelector('bible');
        resolve();
      },function(e){
        reject(e);
      });
    };
    var getXMLToString = function(){
      return (new XMLSerializer()).serializeToString(xmlDoc);
      // return (new XMLSerializer()).serializeToString(xmlDoc).replace(' xmlns="http://www.w3.org/1999/xhtml"','');
    };
    /*
    var createXML=function(id){
      return new DOMParser().parseFromString('<?xml version="1.0"?><bible></bible>','application/xml');
    };
    */
    var createInfo=function(id,text){
      var e=xmlDoc.createElement('info');
      e.setAttribute('id',id);
      e.innerHTML=text;
      return e;
      // <info id="name">Lai Siangtho</info>
    };
    var createContent=function(ref,text){
      var e=xmlDoc.createElement('content');
      e.setAttribute('ref',ref);
      e.innerHTML=text;
      return e;
      // <content ref="Gen.3.1">Mawhna leh gimna a kipatna</content>
    };
    /*
    var createBible=function(id){
      // return document.implementation.createDocument('<?xml version="1.0"?>', "bible");
      var e=document.createElement('bible');
      e.setAttribute('id',id);
      xmlDoc.appendChild(e);
      return e;
    };
    */
    var createBook=function(id,name,shortname){
      xmlBook=xmlDoc.createElement('book');
      xmlBook.setAttribute('id',id);
      xmlBook.setAttribute('name',name);
      xmlBook.setAttribute('shortname',shortname);
      xmlBible.appendChild(xmlBook);
    };
    var createChapter=function(id){
      xmlChapter=xmlDoc.createElement('chapter');
      xmlChapter.setAttribute('id',id);
      xmlBook.appendChild(xmlChapter);
    };
    var createVerse=function(id,text){
      xmlVerse=xmlDoc.createElement('verse');
      xmlVerse.setAttribute('id',id);
      xmlVerse.innerHTML=text;
      xmlChapter.appendChild(xmlVerse);
    };
    var createTitle=function(e,title){
      e.setAttribute('title',title);
      return e;
    };
    var createReference=function(e,ref){
      e.setAttribute('ref',ref);
      return e;
    };
    getBible(false);
  },
  // actionWorking:function(e){
  //   working=e;
  // },
  // status:function(){
  // },
  actionOptionIndividual:function(element,title){
    var lId = element.id;
    var ul = this.container('footer',true).appendChild(document.createElement('ul'));
    ul.setAttribute('class','optionIndividual');
    var li = ul.appendChild(document.createElement('li'));
    // NOTE: header
    var h1 = li.appendChild(document.createElement('h1'));
    h1.innerHTML=lId;
    var div = li.appendChild(document.createElement('div'));
    div.innerHTML=title;
    // NOTE: select
    var seedElement = li.appendChild(document.createElement('p'));
    seedElement.innerHTML='Select';
    seedElement.eventHandler('click',()=>{
      if (localSeedCheck(lId)){
        localSeedDelete(lId);
        element.classList.remove('seed');
        div.innerHTML='removed from SCAN list';
      } else {
        localSeedAdd(lId);
        element.classList.add('seed');
        div.innerHTML='added to SCAN list';
      }
    });
    // TODO: each book Download and delete
    // console.log('todo: each book download and delete method when data available');
    var offline = local.name.query.hasOwnProperty(lId) && local.name.query[lId]['active'];
    li.setAttribute('class',offline?'active':'unusable');
    // NOTE: download
    var downloadElement = li.appendChild(document.createElement('p'));
    downloadElement.innerHTML='Download';
    downloadElement.setAttribute('class','download');
    downloadElement.eventHandler('click',()=>{
      if (offline){
        return fileUserDownload(urlLocalBible.replace('lId',lId)).then(function(msg){
          if (msg)div.innerHTML=msg;
        });
      } 
      div.innerHTML='there is NOTHING to download';
    });
    // NOTE: Delete
    var removeElement = li.appendChild(document.createElement('p'));
    removeElement.setAttribute('class','delete');
    removeElement.innerHTML='Delete';
    removeElement.eventHandler('click',()=>{
      if (offline){
        return fileUserDelete(urlLocalBible.replace('lId',lId)).then(function(){
          localBibleDelete(lId);
          var e = document.getElementById(lId);
          e.classList.remove('active');
          li.setAttribute('class','unusable');
          offline=false;
        },function(msg){
          if (msg.constructor === String || msg.constructor === DOMException){
            div.innerHTML=msg;
          } else {
            console.log(msg);
            div.innerHTML='delete Error';
          }
        });
      }
      div.innerHTML='there is NOTHING to delete';
    });
    var savedBooks = localBookListCheck(lId);
    var savedBooksList = [];
    if (savedBooks && !savedBooks.isEmpty()){
      var olBooks = li.appendChild(document.createElement('ul'));
      for (var bId in savedBooks) {
        if (savedBooks.hasOwnProperty(bId)) {
          savedBooksList.push(bId);
          // console.log(bId,savedBooks[bId]);
          var liBooks = olBooks.appendChild(document.createElement('li'));
          liBooks.dataset.bid=bId;
          var downloadBooks = liBooks.appendChild(document.createElement('p'));
          downloadBooks.innerHTML=bId;
          downloadBooks.eventHandler('click',function(evt){
            var e = evt.target.parentNode, bId = e.dataset.bid;
            if (e.classList.contains('missing'))return false;
            fileUserDownload(urlLocalBook.replace('lId',lId).replace('bId',bId)).then(function(msg){
              if (msg)div.innerHTML=msg;
            });
          });
          var deleteBooks = liBooks.appendChild(document.createElement('p'));
          deleteBooks.innerHTML='x';
          deleteBooks.eventHandler('click',function(evt){
            var e = evt.target.parentNode, bId = e.dataset.bid;
            if (e.classList.contains('missing'))return false;
            fileUserDelete(urlLocalBook.replace('lId',lId).replace('bId',bId)).then(function(){
              savedBooksList.remove(bId);
              localBookDelete(lId,bId);
              // NOTE: if needed to remove element e.parentNode.removeChild(e);
              e.classList.add('missing');
              var tmp = document.getElementById(lId);
              if (!tmp.classList.contains('booklist-incomplete')){
                tmp.classList.remove('booklist');
                tmp.classList.add('booklist-incomplete');
              }
            },function(msg){
              if (msg.constructor === String || msg.constructor === DOMException){
                div.innerHTML=msg;
              } else {
                console.log(msg);
                div.innerHTML= 'delete Error';
              }
            });
          });
          if (!localBookCheck(lId,bId))liBooks.classList.add('missing');
        }
      }
      var mergeDownloadElement = li.appendChild(document.createElement('p'));
      mergeDownloadElement.innerHTML='merge & Download';
      mergeDownloadElement.setAttribute('class','download');
      mergeDownloadElement.eventHandler('click',()=>{
        div.innerHTML='last';
        var savedBooksListTmp = JSON.parse(JSON.stringify(savedBooksList));
        xmlDoc='';
        var loadXML=function(){
          var bId = savedBooksListTmp.shift();
          div.innerHTML = 'bId.xml loading..'.replace('bId',bId);
          div.classList.toggle('scanning');
          return file.open({
            urlLocal: urlLocalBook.replace('lId',lId).replace('bId',bId),
            readAs:'readAsText',
            before:function(e){
              // e.setCharacterEncoding("UTF-8");
              e.overrideMimeType('application/xml; charset=utf-8');
            }
          }).then(function(e){
            var xml = new DOMParser().parseFromString(e.fileContent,e.fileType);
            if (xmlDoc){
              xmlBible.appendChild(xml.querySelector('bible book'));
            } else {
              xmlDoc = xml;
              xmlBible = xmlDoc.querySelector('bible');
            }
            return true;
          },function(msg){
            return msg;
          });
        };
        var loadDone=function(){
          div.innerHTML = 'lId.xml Done'.replace('lId',lId);
          var a = document.createElement("a"),
              file = new Blob([(new XMLSerializer()).serializeToString(xmlDoc)], {type: 'text/xml'}),
              url = URL.createObjectURL(file);
              a.href = url;
          a.download = 'lId.xml'.replace('lId',lId);
          a.click();
          setTimeout(function() {
            window.URL.revokeObjectURL(url);  
          }, 0); 
              
        };
        var loadProcess=function(){
          if (savedBooksListTmp.length){
            loadXML().then(function(e){
              setTimeout(function(){
                loadProcess();
              }, 100);
            })
          } else {
            loadDone();
          }
        };
        loadProcess();
        /*
        file.open({
          urlLocal: urlLocalBook.replace('lId',lId).replace('bId',bId),
          readAs:'readAsText',
          before:function(e){
            // e.setCharacterEncoding("UTF-8");
            e.overrideMimeType('application/xml; charset=utf-8');
          }
        }).then(function(e){
          xmlDoc = new DOMParser().parseFromString(e.fileContent,e.fileType);
          // xmlBook = xmlDoc.createElement('book');
          // xmlBook.setAttribute('id','working');
          // xmlBook.innerHTML ='test';
          // xmlDoc.querySelector('bible').appendChild(xmlBook);
          // console.log(xmlDoc);
          // xmlBook=xmlDoc.querySelector('bible book');
          // xmlBook.setAttribute('id','23');
          // xmlDoc.querySelector('bible').appendChild(xmlBook);
          xmlDoc.querySelector('bible').appendChild(xmlDoc.querySelector('bible book'));
          // console.log(xmlBook);
          console.log(xmlDoc);
          // console.log((new XMLSerializer()).serializeToString(xmlDoc));
        },function(msg){
          console.log(msg);
        });
        */
      });
    }
  },
  getSeeds:function(){
    return new Promise(function(resolve, reject) {
      var seedList=[];
      if (local.name.query.isEmpty())reject();
      local.name.query.each((i,v,o,l)=>{
        if (v.hasOwnProperty('seed'))seedList.push(i);
        if (l){
          if (seedList.length) {
            resolve(seedList);
          } else {
            reject();
          }
        }
      });
    });
  },
  getVersionsContent:function(url){
    return file.open({
      urlLocal:'versions.json',
      readAs: 'readAsText'
    });
  },
  getVersions:function(){
    return this.getVersionsContent().then((e)=>{
      jsonVersions=JSON.parse(e.fileContent);
      this.showVersions();
      return true;
    },()=>{
      return this.getVersionsDownload().then((e)=>{
        jsonVersions = e.data;
        this.showVersions();
        return true;
      },(e)=>{
        // console.log('fail',e);
        elementMessage.innerHTML='versions download Error';
      });
    });
  },
  // TODO: delete actionVersionsRenew, getVersionsRenew
  actionVersionsRenew:function(){
    elementMessage = this.container('footer');
    elementMessage.innerHTML='a moment please';

    file.delete({urlLocal:'versions.json',fileNotFound: true}).then(()=>{
      this.process();
    },()=>{
      elementMessage.innerHTML='versions delete Error';
    });
  },
  getVersionsDownload:function(){
    return file.download({
      url: 'https://www.bible.com/versions.json',
      urlLocal:'versions.json',
      // readAs: 'createObjectURL'
      fileOption:{
        create:true
      },
      before: function(xmlHttp){
        xmlHttp.responseType='json';
      },
      progress: function(Percentage){
        // console.log(Percentage);
        elementMessage.innerHTML=Percentage;
      }
    });
  },
  showVersions:function(){
    var scrollbar = this.container('main',true).appendChild(document.createElement('div'));
    var olPrimary= scrollbar.appendChild(document.createElement('ol'));
    for (var l in jsonVersions) {
      if (jsonVersions.hasOwnProperty(l)) {
        jsonVersions[l].forEach(function(i){
          var liPrimary = document.createElement('li');
          var h3 = document.createElement('h3');
          h3.innerHTML=i.name;
          h3.setAttribute('data-title',i.local_name);
          liPrimary.append(h3);
          var olSecondary= liPrimary.appendChild(document.createElement('ol'));
          olPrimary.append(liPrimary);
          i.versions.forEach(function(e){
            var liSecondary = document.createElement('li');
            if (localSeedCheck(e.id)) {
              liSecondary.classList.add('seed');
              seedTotal++;
            }
            if (localBibleCheck(e.id)) liSecondary.classList.add('active');
            // if (localBookListCheck(e.id)) liSecondary.classList.add('booklist');
            if (localBookListCheck(e.id)){
              var tmp = localBookListCheckTotal(e.id);
              liSecondary.classList.add((tmp >= 66)?'booklist':'booklist-incomplete');
              // if (tmp >= 66){
              //   liSecondary.classList.add('booklist');
              // } else {
              //   liSecondary.classList.add('booklist-incomplete');
              // }
            };
            liSecondary.setAttribute('id',e.id);
            var p = document.createElement('p');
            p.setAttribute('data-title',e.abbr);
            p.setAttribute('class','i01');
            p.innerHTML=e.title;
            liSecondary.append(p);
            olSecondary.append(liSecondary);
          });
        });
      }
      seedActionElement.dataset.title=seedTotal;
    }
    elementMessage.innerHTML='...Ready...';
  },
  container:function(i,s){
    var e = document.querySelector(i);
    if (s)while (e.firstChild)e.removeChild(e.firstChild);
    return e;
  },
  fileStorage:function(){
    return new Promise((resolve, reject)=>{
      file = fileStorage({
          Permission: 1,
          objectStore:{
            version:1
          }
        },
        {
          fail: function(status) {
            reject(status);
          },
          success: function(fs) {
            resolve(fs);
          }
        }
      );
    });
  }
}).document({
  config:{
    Meta:{
      script:['filestorage min','books'],
      agent:{
        script:false, link:false
      }
    }
  },
  ready:function(){
    this.config.msg.info = document.querySelector("footer");
  }
});

// NOTE: file
// fileBibleCheck, fileBibleDownload fileBibleDelete
// fileBookCheck, fileBookDownload fileBookDelete save,
var fileUserDownload=function(url){
  return file.open({
    urlLocal: url
  }).then(function(e){
    var a = document.createElement("a");
    a.href = e.fileContent;
    a.download = e.urlLocal;
    a.click();
    window.URL.revokeObjectURL(e.fileContent);
    return false;
  },function(msg){
    // console.log(url);
    if (msg.constructor === String || msg.constructor === DOMException){
      return msg;
    } else {
      console.log(msg);
      return 'download Error';
    }
  });
};
var fileUserDelete=function(url){
  return file.delete({
    urlLocal: url,
    fileNotFound: true
  });
};
// NOTE: local
var localBibleCheck=function(currentBibleId){
  return local.name.query.hasOwnProperty(currentBibleId) && local.name.query[currentBibleId].active;
};
var localBibleAdd=function(currentBibleId){
  if (!local.name.query.hasOwnProperty(currentBibleId))local.name.query[currentBibleId]={};
  if (!local.name.query[currentBibleId].hasOwnProperty('active')) {
    local.name.query[currentBibleId].active=1;
    local.update('query');
  }
};
var localBibleDelete=function(currentBibleId){
  if (local.name.query.hasOwnProperty(currentBibleId) && local.name.query[currentBibleId].hasOwnProperty('active')) {
    delete local.name.query[currentBibleId].active;
    local.update('query');
  }
};
var localMsgAdd=function(currentBibleId,id,msg){
  if (!local.name.query.hasOwnProperty(currentBibleId))local.name.query[currentBibleId]={};
  if (!local.name.query[currentBibleId].hasOwnProperty('msg'))local.name.query[currentBibleId].msg={};
  local.name.query[currentBibleId].msg[id]=msg;
  local.update('query');
};
var localSeedCheck=function(currentBibleId){
  return local.name.query.hasOwnProperty(currentBibleId) && local.name.query[currentBibleId].seed;
};
var localSeedAdd=function(currentBibleId){
  if (!local.name.query.hasOwnProperty(currentBibleId))local.name.query[currentBibleId]={};
  if (!local.name.query[currentBibleId].hasOwnProperty('seed')) {
    local.name.query[currentBibleId].seed=1;
    seedTotal++;
    local.update('query');
    seedActionElement.dataset.title=seedTotal;
  }
}
var localSeedDelete=function(currentBibleId){
  if (local.name.query.hasOwnProperty(currentBibleId) && local.name.query[currentBibleId].hasOwnProperty('seed')) {
    seedTotal--;
    delete local.name.query[currentBibleId].seed;
    local.update('query');
    seedActionElement.dataset.title=seedTotal;
  }
};
var localBookCheck=function(currentBibleId,currentBookId){
  if (local.name.query.hasOwnProperty(currentBibleId) && local.name.query[currentBibleId].hasOwnProperty('book')) {
    return local.name.query[currentBibleId].book[currentBookId] && local.name.query[currentBibleId].book[currentBookId].active;
  }
  return false;
};
var localBookListCheck=function(currentBibleId){
  if (local.name.query.hasOwnProperty(currentBibleId) && local.name.query[currentBibleId].hasOwnProperty('book')) {
    return local.name.query[currentBibleId].book;
  }
};
var localBookListCheckTotal=function(currentBibleId){
  var e = localBookListCheck(currentBibleId);
  var t = 0;
  if (e){
    for (var i in e) {
      if (e.hasOwnProperty(i) && e[i].hasOwnProperty('active')) t++;
    }
  }
  return t;
};
var localBookAdd=function(currentBibleId,currentBookId){
  if (!local.name.query.hasOwnProperty(currentBibleId))local.name.query[currentBibleId]={};
  if (!local.name.query[currentBibleId].hasOwnProperty('book'))local.name.query[currentBibleId].book={};
  if (!local.name.query[currentBibleId].book.hasOwnProperty(currentBookId))local.name.query[currentBibleId].book[currentBookId]={};
  local.name.query[currentBibleId].book[currentBookId].active=1;
  local.update('query');
};
var localBookDelete=function(currentBibleId,currentBookId){
  if (local.name.query.hasOwnProperty(currentBibleId) && local.name.query[currentBibleId].hasOwnProperty('book')) {
    if (local.name.query[currentBibleId].book.hasOwnProperty(currentBookId)){
      delete local.name.query[currentBibleId].book[currentBookId].active;
      local.update('query');
    }
  }
};
var localChange=function(){
  var l = local.name.query;
  var query = {};
  for (var e in l) {
    if (l.hasOwnProperty(e)) {
      query[e]={};
      query[e].msg={};
      var b = l[e];
      for (var i in b) {
        if (b.hasOwnProperty(i)) {
          if (i !== 'active' && i !== 'book' && i !== 'seed' && i !== 'msg') {
            query[e].msg[i]=b[i];
          } else {
            query[e][i]=b[i];
          }
        }
      }
    }
  }
  // local.update('query',query);
  return local.update('query',query);
};