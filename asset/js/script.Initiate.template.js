return app.fileStorage.download({
  url:configuration.file.template.replace(/z/, configuration.DeviceTemplate.join('.')),
  before:function(e){
    e.overrideMimeType('text/html; charset=utf-8');
    e.responseType = 'document';
  }
}).then(function(e){
  try {
    var html = e.data.body;
    while(html.firstChild)document.body.appendChild(html.firstChild);
    return terminal().then(function(e) {
      if (e === true)document.querySelector('div#screen').remove();
      return e;
    });
  } catch (e) {
    return e;
  }
},function(e){
  return e;
});