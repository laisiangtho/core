// var backgroundPage = chrome.extension.getBackgroundPage();
var app={
  commandEventListener:function(event){
    var e = event.target;
    if (e.dataset.cmd){
      if (app.cmd.hasOwnProperty(e.dataset.cmd))app.cmd[e.dataset.cmd]();
    }
  },
  cmd:{
    openOptions:function(){
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL('options.html'));
      }
    }
  }
};
document.addEventListener("DOMContentLoaded", function(){
  document.querySelector('ul.command').addEventListener('click', app.commandEventListener);  
}, false );
