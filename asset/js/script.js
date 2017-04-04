(function(app) {
  app.merge({
    config:{
      // =require script.Configuration.js
    },
    initiate: function() {
      /*
      * Terminal (checking)
        - [x]version from setting -> 
        - [x]language & bibleAvailable and it's setting (index... etc)
        - [x]query
        - [x]template
        - [ ]setting
      * [ ]template start
      */
      var configuration = app.config, local = app.localStorage;
      delete configuration.Meta;
      delete configuration.DeviceName;
      delete configuration.Execute;
      var process = function() {
        // =require script.Initiate.process.js
      };
      var route = function() {
        // =require script.Initiate.route.js
      };
      var template = function() {
        // =require script.Initiate.template.js
      };
      var terminal = function() {
        // =require script.Initiate.terminal.js
      };
      new Promise(function(resolve, reject) {
        local.select('setting').select('query').select('todo');
        // NOTE: Private
        local.select('lookup').select('bookmark');
        if (local.name.setting.hasOwnProperty('build')) {
          if (local.name.setting.build == configuration.build) {
            // NOTE: ONLOAD
            configuration.requireUpdate = 0;
            // local.insert('bookmark', configuration.bookmark);
          } else {
            // NOTE: ONUPDATE
            configuration.requireUpdate = 2;
          }
        } else {
          // NOTE: ONINSTALL
          configuration.requireUpdate = 1;
          // NOTE: Private
          local.deleteAll();
          local.insert('lookup', configuration.lookup);
          // local.insert('lookup', { setting: {}, book: {} });
          local.insert('bookmark', configuration.bookmark);
        }
        if (configuration.requireUpdate) {
          local.name.setting.version = configuration.version;
          local.name.setting.build = configuration.build;
          local.update('setting');
        }
        process().then(function(e) {
          if (e === true) return template();
          return e;
        }).then(function(e) {
          if (e === true) {
            resolve();
          } else {
            reject(e);
          }
        });
      }).then(function() {
        app.hashChange(function() {
          terminal().then(function(e) {
            // NOTE: if page error
            if (e !== true)console.log('page error',e);
          });
        });
      }, function(e) {
        console.log(e);
        if (typeof e === 'object' && e.hasOwnProperty('message')) {
          app.notification(e.message);
        } else if (typeof e === 'string') {
          app.notification(e);
        }
      });
    },
    // NOTE: <dialog> used in page
    dialog: {
      container:function(){
        return app.elementSelect('div#dialog');
      }
    },
    // NOTE: <nav> used in device, dataLink, dataContent
    nav: {
      container:function(){
        return app.elementSelect('nav');
      },
      // NOTE: Private
      pageName:function(i){
        return app.bible.lang(i);
      }
    },
    // NOTE: <header> used in device, dataLink, dataContent
    header: {
      container:function(){
        return app.elementSelect('header');
      }
    },
    // NOTE: <main> used in page
    main: {
      container:function(){
        return app.elementSelect('main');
      }
    },
    // NOTE: <footer> used in none
    footer: {
      container:function(){
        return app.elementSelect('footer');
      }
    },
    // Toggle:{},
    // NOTE: Common
    // =require script.Common.js
  });
}(scriptive("app")));