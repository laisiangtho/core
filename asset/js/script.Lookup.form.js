// object.addEventListener("focus", function(){});
var input = e.querySelector('input');
input.eventHandler("focus", function(){
  document.body.classList.add('lookup');
  window.scrollTo(0, 0);
  document.body.scrollTop = 0;
  console.log('focus');
});
input.eventHandler("focusout", function(){
  document.body.classList.remove('lookup');
  console.log('focusout');
});
e.eventHandler('submit', function(o){
  var qN={q:o.target.elements.q.value}, hash = app.config.hash;
  if (qN.q == hash.q && hash.page == o.target.name)qN.i=new Date().getTime();
  window.location.hash = qN.paramater([o.target.name]);
  // window.location.reload(true);
  o.preventDefault();
});
