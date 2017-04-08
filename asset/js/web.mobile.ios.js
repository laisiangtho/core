// NOTE: temp
// include web.desktop.default.js
/*
Object.defineProperties(app.nav,{
  menu:{
    value:function(e){
      app.Toggle.nav(e).style.display = 'none';
    }
  }
});
*/
app.nav.menu=function(e){
  document.body.classList.remove('nav');
  app.Toggle.nav(e).style.display = 'none';
};