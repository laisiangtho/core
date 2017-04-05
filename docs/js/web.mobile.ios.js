// NOTE: temp
Object.defineProperties(app.nav,{menu:{value:function(n){app.Toggle.nav(n,function(){document.body.classList.add("nav")},function(){document.body.classList.remove("nav")})}}});