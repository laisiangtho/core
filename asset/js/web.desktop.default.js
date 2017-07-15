app.nav.menu=function(e){
  // console.log(app.config);
  app.Toggle.nav(e,function(){
    document.body.classList.add('nav');
  },function(){
    document.body.classList.remove('nav');
  });
};
app.configurations=function(){
  return {
    page:{
      export:{
        class:'icon-database'
      }
    }
  };
};

/*
Object.defineProperties(app.nav,{
menu:{
value:function(e){
app.Toggle.nav(e,function(){
document.body.classList.add('nav');
},function(){
document.body.classList.remove('nav');
});
}
},
});
*/
