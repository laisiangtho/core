// NOTE: fO.lang, bible
// var name=fO.lang[q.bible].name,info=bible.info,book,chapter,Start,End, setting={book:";",chapter:",",verse:"-"};
// var name=app.bible.active(lId).name,info=app.bible.catalog.book,book,chapter,Start,End, setting={book:";",chapter:",",verse:"-"};
var name=app.bible.active(lId).name,info=app.bible.catalog.book, book, chapter, setting={book:";",chapter:",",verse:"-"};
// app.bible.active(q.bible).name -> fO.lang[q.bible].name
// app.bible.catalog.book -> bible.info
this.result={};
this.search=function(e){
    var y;
    for(var i in name){
        var x=name[i].map(function(value){
            return value.toLowerCase();
        }).indexOf(e.trim().toLowerCase());
        if(x >= 0){ y=i; break; }
    }
    return parseInt(y);
};

this.process=function(cId,verseStart,verseEnd){
  cId=parseInt(cId); verseStart=parseInt(verseStart); verseEnd=parseInt(verseEnd);
    if(!this.result[book])this.result[book]={};
    if(cId <=info[book].c){
        var Verses=info[book].v[cId-1];
        if(!this.result[book][cId])this.result[book][cId]=[];
        if(verseStart && verseEnd){
            var vs=(verseStart <= Verses)?verseStart:Verses,ve=(verseEnd <= Verses)?verseEnd:Verses;
            for (i = vs; i < ve+1; i++) { this.insert(this.result[book][cId],i); }
        } else if(verseStart){
            this.insert(this.result[book][cId],(verseStart <= Verses)?verseStart:Verses);
        }
    }else if(Object.keys(this.result[book]).length === 0){
        delete this.result[book];
    }
};
// this.process=function(){
//     if(!this.result[book])this.result[book]={};
//     if(chapter <=info[book].c){
//         var Verses=info[book].v[chapter-1];
//         if(!this.result[book][chapter])this.result[book][chapter]=[];
//         if(Start && End){
//             var vs=(Start <= Verses)?Start:Verses,ve=(End <= Verses)?End:Verses;
//             for (i = vs; i < ve+1; i++) { this.insert(this.result[book][chapter],i); }
//         } else if(Start){
//             this.insert(this.result[book][chapter],(Start <= Verses)?Start:Verses);
//         }
//     }else if(Object.keys(this.result[book]).length === 0){
//         delete this.result[book];
//     }
// };
this.insert=function(o,i){
    if(o.indexOf(i) <= 0){
        o.push(i); o.sort( function(a,b) { return a > b ? 1 : a < b ? -1 : 0; } );
    }
};
this.nameVerse=function(e){
    var verse;
    function dashed(str,n){
      // var d=(str.toString().slice(-1)!=setting.verse)?setting.verse:'';
      // return str+d+n;
      if (str.toString().slice(-1)!=setting.verse){
        return str+setting.verse+n;
      } else {
        return str+n;
      }
    };
    e.filter(function(v, k, a){
        var c=parseInt(v), o=parseInt(a[k-1]), n=parseInt(a[k+1]);
        if(k==0){
            verse=c;
        }else if(c>=(o+1)){
            if(c>(o+1)){
                verse=verse+setting.chapter+c;
            }else if((c+1)<n){
                verse=dashed(verse,c);
            }else{
                if(k==a.length-1){
                    if(c>o){
                        verse=dashed(verse,c);
                    }
                }else{
                    verse=dashed(verse,'');
                }
            }
        }
    });
    return verse;
};
//obj, object
this.obj=function(e){
  try {
    for(var b in e) {
        book=b;
        for(var c in e[b]) {
            // chapter=c;
            if (e[b][c].length){
              for(var v in e[b][c]) {
                  var R=e[b][c][v].toString().split(setting.verse);
                  // Start=parseInt(R[0]),End=(R.length>1)?parseInt(R[1]):false;
                  this.process(c,R[0],(R.length>1)?R[1]:0);
              }
            } else {
              this.process(c);
            }
        }
    }
  } catch (e) {
  } finally {
    return this;
  }
};
//ref,reference
this.ref=function(e){
  try {
    if(!Array.isArray(e))e=e.split(setting.book);
    for(var i in e) {
        var R=/(((\w+)\.(\d+)\.(\d+))([\-–]?)?((\w+)\.(\d+)\.(\d+))?)/.exec(e[i]);
        /*
        0:"Deut.2.26-Deut.3.11"
        1:"Deut.2.26-Deut.3.11"
        2:"Deut.2.26"
        3:"Deut"
        4:"2"
        5:"26"
        6:"-"
        7:"Deut.3.11"
        8:"Deut"
        9:"3"
        10:"11"
        */
        /*
        3,8 book
        4,9 chapter
        5,10 verse
        */
        if(Array.isArray(R)){
          // console.log(R);
            book=this.search(R[3]);
            // console.log(book);
            // if(book){ chapter=parseInt(R[4]),Start=parseInt(R[5]),End=parseInt(R[10]); this.process();}
            if(book){ 
              if (R[3] === R[8] || !R[8]) {
                // NOTE: save book
                if (R[4] === R[9] || !R[9]){
                  // NOTE: save chapter
                  // console.log('same book and same chapter');
                  // if (R[4] == R[9]){ }
                  this.process(R[4],R[5],R[10]);
                } else {
                  // NOTE: different chapter
                  // console.log('same book, different chapter');
                  // chapter=parseInt(R[4]);
                  // var Verses=info[book].v[chapter-1];
                  
                  // chapter=parseInt(R[4]),Start=parseInt(R[5]),End=parseInt(200); this.process();
                  // chapter=parseInt(R[4]),Start=parseInt(R[5]),End=parseInt(info[book].v[chapter-1]); this.process();
                  
                  this.process(R[4],R[5],200);
                  
                  // chapter=parseInt(R[9]),Start=parseInt(1),End=parseInt(R[10]); this.process();
                  this.process(R[9],1,R[10]);
                }
              } else {
                // NOTE: different book
                console.log('different book');
              }
            }
        }
    }
  } catch (e) {
  } finally {
    return this;
  }
};
//str, string
this.str=function(e){
  try {
    if(!Array.isArray(e))e=e.split(setting.book);
    for(var i in e) {
        if(e[i]){
            var c=e[i].trim().split(setting.chapter);
            for (var x in c) {
                if(x==0){
                    var R=/(\d?(\w+?)?(\s?)\w+(\s+?)?(\s?)\w+(\s+?))?((\d+)((\s+)?\:?(\s+)?)?)((\d+)([\-–])?(\d+)?)?/.exec(c[x]);
                    if(R && R[1]){
                        book=this.search(R[1]);
                        if(book){
                          chapter=R[8];
                          // chapter=parseInt(R[8]),Start=parseInt(R[13]),End=parseInt(R[15]); this.process();
                          this.process(chapter,R[13],R[15]);
                        }
                        else{ break; }
                    }else{ break; }
                }else if(book){
                    var R=/(\s?(\d+?)(\s+)?\:(\s+)?)?(\s?\d+)?(\s?(\d+?)?([\-–])?(\s?\d+)?)/.exec(c[x]);
                    if(R){ 
                      // chapter=parseInt(R[2])||chapter,Start=parseInt(R[5]), End=parseInt(R[9]); this.process();
                      chapter=R[2]||chapter;
                      this.process(chapter,R[5],R[9]);
                    }
                    else{break;}
                }
            }
        }
    }
  } catch (e) {
  } finally {
    return this;
  }
};
// var abc = new app.Query({bible:local.name.query.bible}).from('Ps 1:2,4');
// var abc = new app.Query(local.name.query.bible).from('12 1:2,4');
// console.log(app.bible.catalog);
// console.log(app.bible.active(lId));
this.from=function(e){
  // var abc = this.str(e);
  // console.log(Object.getOwnPropertyNames(abc.result));
  // console.log(Object.keys(abc.result));
  if(Object.keys(this.str(e).result).length > 0){
    return this.result;
  } else if(Object.keys(this.ref(e).result).length > 0){
    return this.result;
  } else if(typeof e === 'object'){
    return this.obj(e).result;
  }
};