// Num.21.21-Num.21.35,Deut.2.26-Deut.3.11
note:function(resolve, reject){
  console.log('note');
  var local = app.localStorage;
  reject();
  var Query = new app.Query(local.name.query.bible);
  var text = 'Num.21.20-Num.21.35;Deut.2.26-Deut.3.11';
  // var text = 'Deut.2.26-Deut.3.11';
  // var text = 'Deut.2.3-Deut.2.11';
  // var text = 'Deut.2.3';
  // var lOb = Query.ref('Gen.1.3');
  var lOb = Query.ref(text).result;
  console.log(lOb);
},