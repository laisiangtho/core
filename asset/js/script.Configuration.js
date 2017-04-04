// configuration.merge({});
name: '{application.name} beta',
description:'{application.description}',
developer: '{application.developer}',
// version: '{application.version}',
// build: '{application.build}',
version: '1.2.0',
build: '2.1.18', //2.1.23
id: 'laisiangtho',
idUnique: 'lst:unique',
file: {
  template: 'z.html',
  urlLocal: 'bible/bId.xml',
  lang: 'lang/bible.json',
  urlAPI: [
    'https://drive.google.com/uc?export=download&id=gId',
    'http://api.laisiangtho.com/bible/bId.xml',
    'https://storage.googleapis.com/api.laisiangtho.com/bible/bId.xml',
    'bible/bId.xml'
  ]
},
// https://drive.google.com/uc?export=download&id=gId
// https://storage.googleapis.com/api.laisiangtho.com/bible/bId.json
// https://raw.githubusercontent.com/laisiangtho/core/master/dev/bible/bId.xml
// https//api.laisiangtho.com/bible/bId.json
// https://laisiangtho.github.io/bible/bId.xml
// https://raw.githubusercontent.com/scriptive/eba/master/dev/font/config.json
// https://drive.google.com/file/d/FILE_ID/edit?usp=sharing
// https://drive.google.com/uc?export=download&id=FILE_ID
// https://drive.google.com/open?id=0B_7bPVufJ-j4ZTJISGRUb0pYb3liUnJmX0pSMkZOQld6Y29Z
// https://drive.google.com/uc?export=download&id=0B_7bPVufJ-j4ZTJISGRUb0pYb3liUnJmX0pSMkZOQld6Y29Z
// https://drive.google.com/open?id=0B_7bPVufJ-j4R2NnUTNIWm55Tlk
// https://drive.google.com/open?id=0B_7bPVufJ-j4b3ZiRFBPQkZZbXM
// https://drive.google.com/open?id=0B_7bPVufJ-j4QmtEaWVBbF9Za2s
// https://drive.google.com/uc?export=download&id=gId

fileStorage:{
  // Base:'database',
  RequestQuota: 1073741824,
  Permission: 1,
  objectStore:{
   name:'laisiangtho',
   version:7
  }
},
todo: {
  // Template:true // no need, because each device app require unique template
},
// NOTE: page
page:{
  bible:{
    class:'icon-cross'
  },
  book:{
    class:'icon-book'
  },
  chapter:{
    class:'icon-chapter'
  },
  lookup:{
    class:'icon-search'
  },
  note:{
    class:'icon-note'
  },
  // setting:{
  //   class:'icon-setting'
  // },
  // parallel:{
  //   class:'icon-language'
  // },
  // about:{
  //   class:'icon-info'
  // }
},
// NOTE: parallel for reader and lookup
parallel:{
  // reader:{}, lookup:{}
},
// NOTE: Bookmark
bookmark:{
  bookmarks: {
    name: "Bookmarks",book:{}
  },
  note: {
    name: "Notes",book:{}
  },
  pin: {
    name: "Pin",book:{}
  },
  map: {
    name: "Map",book:{}
  },
  message: {
    name: "Message",book:{}
  }
},
// NOTE: Lookup
lookup:{
  setting: {}, book: {}
}
// page: ['bible', 'book', 'reader', 'lookup', 'note', 'setting', 'more', 'parallel', 'about', 'verse', 'todo'],