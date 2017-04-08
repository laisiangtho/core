// NOTE: temp
// include web.desktop.default.js
app.nav.menu=function(e){
  document.body.classList.remove('nav');
  app.Toggle.nav(e).style.display = 'none';
};