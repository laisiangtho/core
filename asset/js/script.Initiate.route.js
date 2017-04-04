var available=app.bible.available, catalog=app.bible.catalog, localQuery = local.name.query, 
  fO = {
    page: 'bible', bible: available[0], book: 1, testament: 1, catalog: 1, chapter: 1,verses: '',verse: '',q: '',result: '', parallel:[]
  }, 
  fM = {
    page: function(i,n,d,o) {
      o[i] = configuration.page.hasOwnProperty(n.toLowerCase())?n.toLowerCase():d;
    },
    bible: function(i,n,d,o) {
      o[i] = (n && available.indexOf(n.toLowerCase()) >= 0)?n.toLowerCase():d;
    },
    book: function(i,n,d,o) {
      if (n.isNumeric()) {
        o[i] = catalog.book.hasOwnProperty(n)? parseInt(n) : d;
      } else {
        o[i] = d;
        var n = n.replace(new RegExp('-', 'g'), ' ').toLowerCase(), books = app.bible.active().book;
        // books = configuration.bible[localQuery.bible].book;
        for (var k in books) {
          if (books[k].toLowerCase() == n) {
            o[i]= k;
            break;
          }
        }
      }
    },
    testament: function(i,n,d,o) {
      o[i] = catalog.book[o.book].t;
    },
    catalog: function(i,n,d,o) {
        o[i] = catalog.book[o.book].s;
    },
    chapter: function(i,n,d,o) {
      if (n.isNumeric()){
        o[i] = ( n > 0 && catalog.book[o.book].c >= n) ? parseInt(n) : d;
      } else {
        o[i] = d;
      }
    },
    verse: function(i,n,d,o) {
      o[i] = (catalog.book[o.book].v[o.chapter - 1] >= n) ? n : d;
    },
    parallel: function(i,n,d,o) {
      o[i] = n;
    },
    q: function(i,n,d,o) {
      o[i] = decodeURIComponent(n);
    }
    // verses: function(i, o, d) {},
    // q: function(i, o, d) {
    //     if (q.q) {
    //         fO.query.q = q.q;
    //     }
    // },
    // bookmark: function() {}
};
return new Promise(function(resolve, reject) {
  try {
    if (localQuery.isEmpty()){
      localQuery.merge(fO,configuration.hash);
    } else {
      localQuery.merge(configuration.hash);
    }
    localQuery.each(function(i,v,o){if (fM.isFunction(i))fM[i](i,v,fO[i],o);});
    resolve();
  } catch (e) {
    reject(e);
  }
}).then(function() {
  local.update('query');
  return true;
}, function(e) {
  return e;
});