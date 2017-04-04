var content = function(){
  chrome.tabs.getCurrent(function(){
    console.log(arguments);
  });
};