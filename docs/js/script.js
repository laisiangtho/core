!function(e) {
    e.merge({
        config: {
            name: "laisiangtho beta",
            description: "the Holy Bible in languages!",
            developer: "Khen Solomon Lethil",
            version: "1.2.0",
            build: "2.1.18",
            id: "laisiangtho",
            idUnique: "lst:unique",
            file: {
                template: "z.html",
                urlLocal: "bible/bId.xml",
                lang: "lang/bible.json",
                urlAPI: [ "https://drive.google.com/uc?export=download&id=gId", "http://api.laisiangtho.com/bible/bId.xml", "https://storage.googleapis.com/api.laisiangtho.com/bible/bId.xml", "bible/bId.xml" ]
            },
            fileStorage: {
                RequestQuota: 1073741824,
                Permission: 1,
                objectStore: {
                    name: "laisiangtho",
                    version: 7
                }
            },
            todo: {},
            page: {
                bible: {
                    class: "icon-cross"
                },
                book: {
                    class: "icon-book"
                },
                chapter: {
                    class: "icon-chapter"
                },
                lookup: {
                    class: "icon-search"
                },
                note: {
                    class: "icon-note"
                }
            },
            parallel: {},
            bookmark: {
                bookmarks: {
                    name: "Bookmarks",
                    book: {}
                },
                note: {
                    name: "Notes",
                    book: {}
                },
                pin: {
                    name: "Pin",
                    book: {}
                },
                map: {
                    name: "Map",
                    book: {}
                },
                message: {
                    name: "Message",
                    book: {}
                }
            },
            lookup: {
                setting: {},
                book: {}
            }
        },
        initiate: function() {
            var t = e.config, n = e.localStorage;
            delete t.Meta, delete t.DeviceName, delete t.Execute;
            var o = function() {
                var o = n.select("bible").name.bible;
                return new Promise(function(a, i) {
                    e.fileStorage = fileStorage(t.fileStorage, {
                        done: function() {
                            e.fileStorage.download({
                                url: t.file.lang
                            }).then(function(i) {
                                if (e.bible.all = JSON.parse(i.data), o.isObject() || (o = {}), o.isEmpty() || (e.bible.all = JSON.parse(JSON.stringify(o)).merge(e.bible.all)), 
                                t.requireUpdate || o.isEmpty()) {
                                    for (var r in e.bible.all) e.bible.all.hasOwnProperty(r) && (o.hasOwnProperty(r) || (o[r] = {}), 
                                    o[r].hasOwnProperty("id") || (o[r].id = {}));
                                    n.update("bible");
                                }
                                a();
                            }, function(e) {
                                i(e);
                            });
                        }
                    });
                }).then(function() {
                    var t = {
                        message: {
                            bible: "Bible",
                            book: "Book",
                            chapter: "Chapter",
                            verse: "Verse",
                            lookup: "Lookup",
                            setting: "Setting",
                            parallel: "Parallel",
                            bookmark: "Bookmark",
                            bookmarks: "Bookmarks",
                            about: "About",
                            note: "Note",
                            todo: "Todo",
                            more: "More",
                            nameChapter: "{b} {c}",
                            nameVerse: "{b} {c}:{v}",
                            Loading: "Loading",
                            Checking: "Checking",
                            Searching: "Searching",
                            Downloading: "Downloading",
                            PercentLoaded: "{Percent}%",
                            Discover: "Discover!",
                            Paused: "Paused!",
                            PleaseWait: "Please wait!",
                            isLocalRemove: 'Would you like to remove "{is}" from local?',
                            noMatchFor: "No match for {for}!",
                            noBookSelected: "No Book selected!"
                        },
                        section: {
                            1: "Law",
                            2: "History",
                            3: "Poetry",
                            4: "Prophecy: Major Prophets",
                            5: "Prophecy: Minor Prophets",
                            6: "Gospels",
                            7: "Historical",
                            8: "Doctrinal: Gentiles",
                            9: "Doctrinal: Individuals",
                            10: "Doctrinal: The Jews",
                            11: "Doctrinal: General Espitles"
                        },
                        testament: {
                            1: "Old Testament",
                            2: "New Testament"
                        },
                        book: {
                            1: "Genesis",
                            2: "Exodus",
                            3: "Leviticus",
                            4: "Numbers",
                            5: "Deuteronomy",
                            6: "Joshua",
                            7: "Judges",
                            8: "Ruth",
                            9: "1 Samuel",
                            10: "2 Samuel",
                            11: "1 Kings",
                            12: "2 Kings",
                            13: "1 Chronicles",
                            14: "2 Chronicles",
                            15: "Ezra",
                            16: "Nehemiah",
                            17: "Esther",
                            18: "Job",
                            19: "Psalm",
                            20: "Proverbs",
                            21: "Ecclesiastes",
                            22: "Song of Solomon",
                            23: "Isaiah",
                            24: "Jeremiah",
                            25: "Lamentations",
                            26: "Ezekiel",
                            27: "Daniel",
                            28: "Hosea",
                            29: "Joel",
                            30: "Amos",
                            31: "Obadiah",
                            32: "Jonah",
                            33: "Micah",
                            34: "Nahum",
                            35: "Habakkuk",
                            36: "Zephaniah",
                            37: "Haggai",
                            38: "Zechariah",
                            39: "Malachi",
                            40: "Matthew",
                            41: "Mark",
                            42: "Luke",
                            43: "John",
                            44: "Acts",
                            45: "Romans",
                            46: "1 Corinthians",
                            47: "2 Corinthians",
                            48: "Galatians",
                            49: "Ephesians",
                            50: "Philippians",
                            51: "Colossians",
                            52: "1 Thessalonians",
                            53: "2 Thessalonians",
                            54: "1 Timothy",
                            55: "2 Timothy",
                            56: "Titus",
                            57: "Philemon",
                            58: "Hebrews",
                            59: "James",
                            60: "1 Peter",
                            61: "2 Peter",
                            62: "1 John",
                            63: "2 John",
                            64: "3 John",
                            65: "Jude",
                            66: "Revelation"
                        },
                        name: {
                            1: [ "Genesis", "Ge", "Gen" ],
                            2: [ "Exodus", "Ex", "Exo", "Exod" ],
                            3: [ "Leviticus", "Le", "Lev" ],
                            4: [ "Numbers", "Nu", "Num" ],
                            5: [ "Deuteronomy", "De", "Deu", "Deut", "Dt" ],
                            6: [ "Joshua", "Js", "Jos", "Josh" ],
                            7: [ "Judges", "Jg", "Jdg", "Ju", "Jdgs", "Judg" ],
                            8: [ "Ruth", "Ru", "Rut" ],
                            9: [ "1 Samuel", "1S", "1Sa", "1 Sam", "1Sam", "1 Sa", "I Samuel", "I Sam", "I Sa", "IS" ],
                            10: [ "2 Samuel", "2S", "2Sa", "2 Sam", "2Sam", "2 Sa", "II Samuel", "II Sam", "II Sa", "IIS" ],
                            11: [ "1 Kings", "1K", "1Ki", "1 Kin", "1Kin", "1 Ki", "IK", "I Kings", "I Kin", "I Ki", "1Kgs" ],
                            12: [ "2 Kings", "2K", "2Ki", "2 Kin", "2Kin", "2 Ki", "IIK", "II Kings", "II Kin", "II Ki", "2Kgs" ],
                            13: [ "1 Chronicles", "1C", "1Ch", "1 Chr", "1Chr", "1 Ch", "ICh", "I Chronicles", "I Chr", "I Ch" ],
                            14: [ "2 Chronicles", "2C", "2Ch", "2 Chr", "2Chr", "2 Ch", "IICh", "II Chronicles", "II Chr", "II Ch" ],
                            15: [ "Ezra", "Ezr" ],
                            16: [ "Nehemiah", "Ne", "Neh" ],
                            17: [ "Esther", "Es", "Est", "Esth" ],
                            18: [ "Job", "Jb" ],
                            19: [ "Psalm", "Ps", "Psa" ],
                            20: [ "Proverbs", "Pr", "Pro", "Prov" ],
                            21: [ "Ecclesiastes", "Ec", "Ecc", "Eccl" ],
                            22: [ "Song of Songs", "So", "Sng", "Sos", "Song of Solomon", "SOS", "SongOfSongs", "SongofSolomon", "Song" ],
                            23: [ "Isaiah", "Is", "Isa" ],
                            24: [ "Jeremiah", "Je", "Jer" ],
                            25: [ "Lamentations", "La", "Lam", "Lament" ],
                            26: [ "Ezekiel", "Ek", "Ezk", "Ezek", "Eze" ],
                            27: [ "Daniel", "Da", "Dan", "Dl", "Dnl" ],
                            28: [ "Hosea", "Ho", "Hos" ],
                            29: [ "Joel", "Jl", "Jol", "Joe" ],
                            30: [ "Amos", "Am", "Amo" ],
                            31: [ "Obadiah", "Ob", "Oba", "Obd", "Odbh", "Obad" ],
                            32: [ "Jonah", "Jh", "Jon", "Jnh" ],
                            33: [ "Micah", "Mi", "Mic" ],
                            34: [ "Nahum", "Na", "Nam", "Nah" ],
                            35: [ "Habakkuk", "Hb", "Hab", "Hk", "Habk" ],
                            36: [ "Zephaniah", "Zp", "Zep", "Zeph", "Ze" ],
                            37: [ "Haggia", "Ha", "Hag", "Hagg" ],
                            38: [ "Zechariah", "Zc", "Zec", "Zech" ],
                            39: [ "Malachi", "Ml", "Mal", "Mlc" ],
                            40: [ "Matthew", "Mt", "Mat", "Matt" ],
                            41: [ "Mark", "Mk", "Mrk", "Mar" ],
                            42: [ "Luke", "Lk", "Luk", "Lu" ],
                            43: [ "John", "Jn", "Jhn", "Joh", "Jo" ],
                            44: [ "Acts", "Ac", "Act" ],
                            45: [ "Romans", "Ro", "Rom", "Rmn", "Rmns" ],
                            46: [ "1 Corinthians", "1Co", "1 Cor", "1Cor", "ICo", "1 Co", "I Corinthians", "I Cor", "I Co" ],
                            47: [ "2 Corinthians", "2Co", "2 Cor", "2Cor", "IICo", "2 Co", "II Corinthians", "II Cor", "II Co" ],
                            48: [ "Galatians", "Ga", "Gal", "Gltns" ],
                            49: [ "Ephesians", "Ep", "Eph", "Ephn" ],
                            50: [ "Philippians", "Pp", "Php", "Phi", "Phil" ],
                            51: [ "Colossians", "Co", "Col", "Colo", "Cln", "Clns" ],
                            52: [ "1 Thessalonians", "1Th", "1 Thess", "1Thess", "ITh", "1 Thes", "1Thes", "1 The", "1The", "1 Th", "I Thessalonians", "I Thess", "I The", "I Th" ],
                            53: [ "2 Thessalonians", "2Th", "2 Thess", "2Thess", "IITh", "2 Thes", "2Thes", "2 The", "2The", "2 Th", "II Thessalonians", "II Thess", "II The", "II Th" ],
                            54: [ "1 Timothy", "1Ti", "1 Tim", "1Tim", "1 Ti", "ITi", "I Timothy", "I Tim", "I Ti" ],
                            55: [ "2 Timothy", "2Ti", "2 Tim", "2Tim", "2 Ti", "IITi", "II Timothy", "II Tim", "II Ti" ],
                            56: [ "Titus", "Ti", "Tit", "Tt", "Ts" ],
                            57: [ "Philemon", "Pm", "Phm", "Phile", "Philm", "Phlm" ],
                            58: [ "Hebrews", "He", "Heb", "Hw" ],
                            59: [ "James", "Jm", "Jas", "Jam", "Ja" ],
                            60: [ "1 Peter", "1P", "1Pe", "1 Pet", "1Pet", "IPe", "I Peter", "I Pet", "I Pe" ],
                            61: [ "2 Peter", "2P", "2Pe", "2 Pet", "2Pet", "IIP", "II Peter", "II Pet", "II Pe" ],
                            62: [ "1 John", "1J", "1Jn", "1 Jn", "1 Jo", "IJo", "I John", "I Jo", "I Jn", "1John" ],
                            63: [ "2 John", "2J", "2Jn", "2 Jn", "2 Jo", "IIJo", "II John", "II Jo", "II Jn", "2John" ],
                            64: [ "3 John", "3J", "3Jn", "3 Jn", "3 Jo", "IIIJo", "III John", "III Jo", "III Jn", "3John" ],
                            65: [ "Jude", "Jud" ],
                            66: [ "Revelation", "Re", "Rev", "Rvltn" ]
                        }
                    };
                    return e.bible.available = Object.keys(e.bible.all), e.bible.all.each(function(e, n) {
                        n.merge(!0, t).name.merge(n.book);
                    }), !0;
                }, function(e) {
                    return e;
                });
            }, a = function() {
                var o = e.bible.available, a = e.bible.catalog, i = n.name.query, r = {
                    page: "bible",
                    bible: o[0],
                    book: 1,
                    testament: 1,
                    catalog: 1,
                    chapter: 1,
                    verses: "",
                    verse: "",
                    q: "",
                    result: "",
                    parallel: []
                }, l = {
                    page: function(e, n, o, a) {
                        a[e] = t.page.hasOwnProperty(n.toLowerCase()) ? n.toLowerCase() : o;
                    },
                    bible: function(e, t, n, a) {
                        a[e] = t && o.indexOf(t.toLowerCase()) >= 0 ? t.toLowerCase() : n;
                    },
                    book: function(t, n, o, i) {
                        if (n.isNumeric()) i[t] = a.book.hasOwnProperty(n) ? parseInt(n) : o; else {
                            i[t] = o;
                            var n = n.replace(new RegExp("-", "g"), " ").toLowerCase(), r = e.bible.active().book;
                            for (var l in r) if (r[l].toLowerCase() == n) {
                                i[t] = l;
                                break;
                            }
                        }
                    },
                    testament: function(e, t, n, o) {
                        o[e] = a.book[o.book].t;
                    },
                    catalog: function(e, t, n, o) {
                        o[e] = a.book[o.book].s;
                    },
                    chapter: function(e, t, n, o) {
                        t.isNumeric() ? o[e] = t > 0 && a.book[o.book].c >= t ? parseInt(t) : n : o[e] = n;
                    },
                    verse: function(e, t, n, o) {
                        o[e] = a.book[o.book].v[o.chapter - 1] >= t ? t : n;
                    },
                    parallel: function(e, t, n, o) {
                        o[e] = t;
                    },
                    q: function(e, t, n, o) {
                        o[e] = decodeURIComponent(t);
                    }
                };
                return new Promise(function(e, n) {
                    try {
                        i.isEmpty() ? i.merge(r, t.hash) : i.merge(t.hash), i.each(function(e, t, n) {
                            l.isFunction(e) && l[e](e, t, r[e], n);
                        }), e();
                    } catch (e) {
                        n(e);
                    }
                }).then(function() {
                    return n.update("query"), !0;
                }, function(e) {
                    return e;
                });
            }, i = function() {
                return e.fileStorage.download({
                    url: t.file.template.replace(/z/, t.DeviceTemplate.join(".")),
                    before: function(e) {
                        e.overrideMimeType("text/html; charset=utf-8"), e.responseType = "document";
                    }
                }).then(function(e) {
                    try {
                        for (var t = e.data.body; t.firstChild; ) document.body.appendChild(t.firstChild);
                        return r().then(function(e) {
                            return e === !0 && document.querySelector("div#screen").remove(), e;
                        });
                    } catch (e) {
                        return e;
                    }
                }, function(e) {
                    return e;
                });
            }, r = function() {
                return a().then(function(t) {
                    return t === !0 ? new Promise(function(t, o) {
                        e.page[n.name.query.page](t, o);
                    }).then(function() {
                        return e.Toggle.header().then(function(t) {
                            try {
                                e.dataContent();
                            } catch (e) {
                                return e;
                            }
                            return !0;
                        });
                    }, function(e) {
                        return e;
                    }) : t;
                });
            };
            new Promise(function(e, a) {
                n.select("setting").select("query").select("todo"), n.select("lookup").select("bookmark"), 
                n.name.setting.hasOwnProperty("build") ? n.name.setting.build == t.build ? t.requireUpdate = 0 : t.requireUpdate = 2 : (t.requireUpdate = 1, 
                n.deleteAll(), n.insert("lookup", t.lookup), n.insert("bookmark", t.bookmark)), 
                t.requireUpdate && (n.name.setting.version = t.version, n.name.setting.build = t.build, 
                n.update("setting")), o().then(function(e) {
                    return e === !0 ? i() : e;
                }).then(function(t) {
                    t === !0 ? e() : a(t);
                });
            }).then(function() {
                e.hashChange(function() {
                    r().then(function(e) {
                        e !== !0 && console.log("page error", e);
                    });
                });
            }, function(t) {
                console.log(t), "object" == typeof t && t.hasOwnProperty("message") ? e.notification(t.message) : "string" == typeof t && e.notification(t);
            });
        },
        dialog: {
            container: function() {
                return e.elementSelect("div#dialog");
            }
        },
        nav: {
            container: function() {
                return e.elementSelect("nav");
            },
            pageName: function(t) {
                return e.bible.lang(t);
            }
        },
        header: {
            container: function() {
                return e.elementSelect("header");
            }
        },
        main: {
            container: function() {
                return e.elementSelect("main");
            }
        },
        footer: {
            container: function() {
                return e.elementSelect("footer");
            }
        },
        page: {
            bible: function(t, n) {
                var o = (e.config, e.localStorage), a = document.createElement("ol");
                e.Toggle.main(!0).appendChild(a).setAttribute("class", "main-bible"), e.bible.all.each(function(t, n) {
                    var i = document.createElement("li"), r = document.createElement("p"), l = document.createElement("a"), s = document.createElement("span"), c = document.createElement("span");
                    i.setAttribute("id", t), c.setAttribute("class", "drag icon-menu"), l.innerHTML = n.id.name, 
                    l.setAttribute("href", {
                        bible: t
                    }.paramater([ "#book" ])), n.id.hasOwnProperty("local") ? s.setAttribute("class", "icon-ok offline") : e.bible.file.hasOwnProperty(t) ? s.setAttribute("class", "icon-attention offline") : s.setAttribute("class", "icon-cloud online"), 
                    r.appendChild(s), r.appendChild(l), r.appendChild(c), i.setAttribute("class", "reorder"), 
                    t == o.name.query.bible && i.classList.add("active"), i.appendChild(r), a.appendChild(i), 
                    s.eventClick(function(o) {
                        var a = o.target;
                        if (a.classList.contains("offline")) e.Toggle.dialog(function(t) {
                            var o = document.createElement("p");
                            o.innerHTML = e.bible.lang("isLocalRemove").replace("{is}", n.id.name), t.appendChild(o);
                        }, function(n) {
                            return new e.xml(t).delete().then(function() {
                                a.setAttribute("class", "icon-cloud online");
                            });
                        }); else {
                            a.parentNode.firstElementChild.nextElementSibling;
                            new e.xml(t).download(function() {
                                a.setAttribute("class", "icon-loading animate-spin");
                            }).then(function(n) {
                                new e.xml(t).save(n).then(function() {
                                    a.setAttribute("class", "icon-ok offline");
                                }, function() {
                                    a.setAttribute("class", "icon-attention offline");
                                });
                            });
                        }
                    }, !1);
                }), t(), window.Slip ? (a.addEventListener("slip:beforereorder", function(e) {}, !1), 
                a.addEventListener("slip:beforeswipe", function(e) {}, !1), a.addEventListener("slip:beforewait", function(e) {
                    e.target.className.indexOf("drag") > -1 && e.preventDefault();
                }, !1), a.addEventListener("slip:afterswipe", function(e) {
                    e.target.parentNode.appendChild(e.target);
                }, !1), a.addEventListener("slip:reorder", function(t) {
                    t.target.parentNode.insertBefore(t.target, t.detail.insertBefore);
                    var n = e.bible, a = {}, i = {};
                    return n.available = [], t.target.parentNode.childNodes.forEach(function(e, t) {
                        var r = e.getAttribute("id");
                        n.available.push(r), a[r] = o.name.bible[r], i[r] = n.all[r];
                    }), o.update("bible", a), n.all = i, !1;
                }, !1), new Slip(a)) : new Sortable(a, {
                    handle: ".drag",
                    animation: 150,
                    onUpdate: function(t) {
                        var n = e.bible, a = {}, i = {};
                        n.available = [], t.target.childNodes.forEach(function(e, t) {
                            var r = e.getAttribute("id");
                            n.available.push(r), a[r] = o.name.bible[r], i[r] = n.all[r];
                        }), o.update("bible", a), n.all = i;
                    }
                });
            },
            book: function(t, n) {
                var o = (e.config, e.localStorage), a = document.createElement("ol");
                e.Toggle.main(!0).appendChild(a).setAttribute("class", "main-book"), e.bible.catalog.section.each(function(t, n) {
                    var i = document.createElement("li"), r = document.createElement("h2"), l = "t" + t, s = document.createElement("ol");
                    s.setAttribute("class", "section"), r.innerHTML = e.bible.testament(t), i.appendChild(r), 
                    i.appendChild(s), i.setAttribute("id", l), a.appendChild(i), n.each(function(t, n) {
                        var a = document.createElement("li"), r = document.createElement("h3"), l = "s" + t, c = document.createElement("ol");
                        c.setAttribute("class", "book"), r.innerHTML = e.bible.section(t), a.appendChild(r), 
                        a.appendChild(c), a.setAttribute("id", l), s.appendChild(a), n.forEach(function(t) {
                            var n = document.createElement("li"), r = document.createElement("p"), l = document.createElement("a"), s = document.createElement("span");
                            l.innerHTML = e.bible.book(t), l.setAttribute("href", {
                                book: t
                            }.paramater([ "#chapter" ])), l.setAttribute("data-title", e.bible.digit(t)), s.innerHTML = e.bible.digit(e.bible.catalog.book[t].c), 
                            s.eventClick(function(o) {
                                var a = o.target;
                                if (a.classList.contains("active")) {
                                    a.removeAttribute("class", "active");
                                    var i = a.parentNode.parentNode;
                                    i.removeChild(i.lastChild);
                                } else {
                                    a.setAttribute("class", "active");
                                    var i = document.createElement("ol");
                                    n.appendChild(i), e.bible.catalog.book[t].v.each(function(n, o) {
                                        n++;
                                        var a = document.createElement("li"), r = document.createElement("a");
                                        r.setAttribute("href", {
                                            book: t,
                                            chapter: n
                                        }.paramater([ "#chapter" ])), r.setAttribute("data-title", e.bible.digit(o)), r.innerHTML = e.bible.digit(n), 
                                        t == n && a.classList.add("active"), a.appendChild(r), i.appendChild(a);
                                    });
                                }
                            }, !1), t == o.name.query.book && (n.setAttribute("class", "active"), a.setAttribute("class", "active"), 
                            i.setAttribute("class", "active")), r.appendChild(l), r.appendChild(s), n.appendChild(r), 
                            c.appendChild(n);
                        });
                    });
                }), t();
            },
            chapter: function(t, n) {
                var o = e.config, a = e.localStorage, i = a.name.query, r = document.createElement("ol"), l = {
                    query: {},
                    parallel: {},
                    container: function() {
                        var t = e.Toggle.main();
                        return t.children.length ? i.bible != o.bible || i.book != o.book || i.chapter != o.chapter ? t.emptyElement().appendChild(r) : void 0 : t.appendChild(r);
                    },
                    initiate: function() {
                        this.container() ? (o.parallel[i.page] = {}, this.query[i.book] = {}, this.query[i.book][i.chapter] = [], 
                        this.parallel = [ i.bible ].merge(i.parallel), r.setAttribute("class", "parallel"), 
                        o.bible = i.bible, o.book = i.book, o.chapter = i.chapter, this.process()) : t();
                    },
                    process: function() {
                        this.parallel.length ? this.bible(this.parallel.shift()) : t();
                    },
                    bible: function(t) {
                        var s = document.createElement("li");
                        new e.Content(this.query).bible(t, o.parallel[i.page]).then(function(e) {
                            e.chapter(s).then(function(e) {
                                r.appendChild(s), s.setAttribute("class", t);
                            }, function(e) {
                                a.name.todo.hasOwnProperty(t) || (a.name.todo[t] = {}), a.name.todo[t].hasOwnProperty(i.book) || (a.name.todo[t][i.book] = {}), 
                                a.name.todo[t][i.book].hasOwnProperty(i.chapter) || (a.name.todo[t][i.book][i.chapter] = {}), 
                                a.name.todo[t][i.book][i.chapter].hasOwnProperty("empty") || (a.name.todo[t][i.book][i.chapter].empty = "missing", 
                                a.update("todo")), n("lId bId:cId is missing".replace(/lId/, t).replace(/bId/, i.book).replace(/cId/, i.chapter));
                            });
                        }, function(e) {
                            console.log("bible error", e);
                        }).then(function() {
                            l.process();
                        });
                    }
                };
                l.initiate();
            },
            lookup: function(t, n) {
                var o = e.config, a = e.localStorage, i = a.name.query, r = document.createElement("ol"), l = JSON.stringify(a.name.lookup.book), s = {
                    container: function() {
                        var t = e.Toggle.main();
                        return t.children.length ? i.bible != o.bible || i.q != o.q || l !== o.lookupBook ? t.emptyElement().appendChild(r) : void 0 : t.appendChild(r);
                    },
                    initiate: function() {
                        this.container() ? (lookupObject = new e.Query(i.bible).from(i.q), o.parallel[i.page] = {}, 
                        o.lookupBook = l, o.bible = i.bible, o.q = i.q, this.bible()) : t();
                    },
                    bible: function() {
                        var n = document.createElement("li");
                        new e.Content(lookupObject || a.name.lookup.book).bible(i.bible, o.parallel[i.page]).then(function(t) {
                            t.lookup(n, lookupObject || i.q).then(function(e) {
                                r.appendChild(n), r.setAttribute("class", "parallel"), n.setAttribute("class", i.bible), 
                                console.log("lookup done");
                            }, function(t) {
                                if (r.appendChild(n), r.setAttribute("class", "main-nomatch"), i.q) {
                                    var o = document.createElement("span");
                                    o.setAttribute("class", "keyword"), o.innerHTML = i.q;
                                    var l = document.createElement("h1");
                                    l.innerHTML = e.bible.lang("noMatchFor").replace(/{for}/, o.outerHTML), n.appendChild(l);
                                    var s = document.createElement("p");
                                    if (a.name.lookup.book.isEmpty()) s.innerHTML = e.bible.lang("noBookSelected"); else {
                                        var c = [];
                                        a.name.lookup.book.each(function(t) {
                                            c.push(e.bible.book(t));
                                        }), s.innerHTML = c.toSentence();
                                    }
                                    n.appendChild(s);
                                } else n.innerHTML = e.bible.lang("Discover");
                            });
                        }, function(e) {
                            console.log("bible error", e);
                        }).then(function() {
                            t();
                        });
                    }
                };
                s.initiate();
            },
            note: function(t, n) {
                console.log("note");
                var o = e.localStorage;
                n();
                var a = new e.Query(o.name.query.bible), i = "Num.21.20-Num.21.35;Deut.2.26-Deut.3.11", r = a.ref(i).result;
                console.log(r);
            }
        },
        xml: function(t) {
            var n = e.config, o = e.bible, a = "bible", i = e.localStorage.name, r = this;
            this.open = function() {
                return e.fileStorage.open({
                    urlLocal: n.file.urlLocal.replace(/bId/, t),
                    readAs: "readAsText"
                });
            }, this.download = function(a) {
                var i = {
                    dir: JSON.parse(JSON.stringify(n.file.urlAPI)),
                    request: function(o) {
                        return e.fileStorage.download({
                            url: o,
                            urlLocal: n.file.urlLocal.replace(/bId/, t),
                            before: function(e) {
                                e.setRequestHeader("Access-Control-Allow-Origin", "*"), e.overrideMimeType("text/xml; charset=utf-8");
                            },
                            progress: a
                        });
                    },
                    process: function(e, n) {
                        var a = i.dir.shift().replace(/bId/, t);
                        return /gId/.test(a) && (a = a.replace(/gId/, o.all[t].id.gId)), i.request(a).then(function(n) {
                            n.xml || (n.xml = new DOMParser().parseFromString(n.data, n.fileType)), o.file[t] = n.xml, 
                            e(n);
                        }, function(t) {
                            i.dir.length ? i.process(e, n) : n(t);
                        });
                    }
                };
                return new Promise(i.process);
            }, this.save = function(n) {
                return new Promise(function(r, l) {
                    e.fileStorage.save(n).then(function(n) {
                        o.all[t].id.local = 1, i[a][t].id.local = 1, e.localStorage.update(a), r(n);
                    }, function(e) {
                        l(e);
                    });
                });
            }, this.delete = function() {
                return new Promise(function(r, l) {
                    e.fileStorage.delete({
                        urlLocal: n.file.urlLocal.replace(/bId/, t),
                        fileNotFound: !0
                    }).then(function(n) {
                        delete o.all[t].id.local, delete i[a][t].id.local, delete o.file[t], e.localStorage.update(a), 
                        r(n);
                    }, function(e) {
                        l(e);
                    });
                });
            }, this.request = function(e) {
                return new Promise(function(n, l) {
                    o.file.hasOwnProperty(t) ? n(o.file[t]) : i[a][t].id.hasOwnProperty("local") ? r.open().then(function(e) {
                        e.xml = new DOMParser().parseFromString(e.fileContent, e.fileType), o.file[t] = e.xml, 
                        n(e.xml);
                    }, function(e) {
                        console.log("open fail", e), r.delete().then(function() {
                            l(e);
                        });
                    }) : r.download(e).then(function(e) {
                        r.save(e).then(function() {
                            console.log("save success");
                        }, function() {
                            console.log("save fail");
                        }).then(function() {
                            n(e.xml);
                        });
                    }, function(e) {
                        l(e);
                    });
                });
            };
        },
        lookup: {
            form: function(t) {
                var n = t.querySelector("input");
                n.eventHandler("focus", function() {
                    document.body.classList.add("lookup"), window.scrollTo(0, 0), document.body.scrollTop = 0, 
                    console.log("focus");
                }), n.eventHandler("focusout", function() {
                    document.body.classList.remove("lookup"), console.log("focusout");
                }), t.eventHandler("submit", function(t) {
                    var n = {
                        q: t.target.elements.q.value
                    }, o = e.config.hash;
                    n.q == o.q && o.page == t.target.name && (n.i = new Date().getTime()), window.location.hash = n.paramater([ t.target.name ]), 
                    t.preventDefault();
                });
            },
            setting: function(t) {
                var n = e.localStorage, o = (e.config, function(e) {
                    e.classList.toggle("active");
                    var t = e.getAttribute("id");
                    e.classList.contains("active") ? n.name.lookup.book[t] = {} : delete n.name.lookup.book[t];
                }), a = function(e, t) {
                    e.classList.toggle("active"), t.classList.toggle("active");
                    var o = t.getAttribute("id");
                    t.classList.contains("active") ? n.name.lookup.setting[o] = !0 : delete n.name.lookup.setting[o];
                };
                e.Toggle.menu(t, function(t) {
                    var i = document.createElement("ol");
                    i.setAttribute("class", "list-lookup"), t.appendChild(i), e.bible.catalog.section.each(function(t, r) {
                        var l = document.createElement("li"), s = document.createElement("p"), c = document.createElement("span"), u = "t" + t, b = document.createElement("ol");
                        b.setAttribute("class", "section"), s.innerHTML = e.bible.testament(t), c.innerHTML = "+", 
                        s.eventClick(function(e) {
                            var t = e.target, n = t.parentNode;
                            t == c ? n.parentNode.lastElementChild.querySelectorAll("ol.book>li").each(function(e, t) {
                                o(t);
                            }) : a(t, n);
                        }), s.appendChild(c), l.appendChild(s), l.appendChild(b), l.setAttribute("class", n.name.lookup.setting.hasOwnProperty(u) ? "active" : "testaments"), 
                        l.setAttribute("id", u), i.appendChild(l), r.each(function(t, i) {
                            var r = document.createElement("li"), l = document.createElement("p"), s = document.createElement("span"), c = "s" + t, u = document.createElement("ol");
                            u.setAttribute("class", "book"), s.innerHTML = "+", l.innerHTML = e.bible.section(t), 
                            l.eventClick(function(e) {
                                var t = e.target, n = t.parentNode;
                                t == s ? n.parentNode.lastElementChild.childNodes.each(function(e, t) {
                                    o(t);
                                }) : a(t, n);
                            }), l.appendChild(s), r.appendChild(l), r.appendChild(u), r.setAttribute("class", n.name.lookup.setting.hasOwnProperty(c) ? "active" : "section"), 
                            r.setAttribute("id", c), b.appendChild(r), i.forEach(function(t) {
                                var a = document.createElement("li");
                                a.innerHTML = e.bible.book(t), a.setAttribute("id", t), a.setAttribute("class", n.name.lookup.book.hasOwnProperty(t) ? "active" : "none"), 
                                a.eventClick(function(e) {
                                    o(e.target);
                                }), u.appendChild(a);
                            });
                        });
                    });
                }, function() {
                    n.update("lookup");
                });
            }
        },
        bookmark: {
            menu: function(t) {
                var n = e.localStorage, o = e.main.container().querySelector("div.active").querySelector("ol.parallel"), a = function(t, n, o) {
                    var a = {
                        bookmark: {},
                        book: 0,
                        chapter: 0,
                        verse: 0
                    }, i = e.main.container().querySelector("div.active").querySelector("ol.parallel");
                    if (!i) return a;
                    var r = "ol.verse>li[id]";
                    return o && (r = r.replace("[id]", "[id].active")), i.firstChild.querySelectorAll("ol.book>li").each(function(e, o) {
                        var i = o.getAttribute("id");
                        a.book++, o.querySelectorAll("ol.chapter>li").each(function(e, o) {
                            var l = o.getAttribute("id"), s = o.querySelectorAll(r);
                            t(i, l, s.length) && (a.chapter++, s.each(function(e, t, o, r) {
                                var s = t.getAttribute("id");
                                n(t, i, l, s, r) && a.verse++;
                            }));
                        });
                    }), a;
                }, i = function() {
                    var e = a(function() {
                        return !0;
                    }, function() {
                        return !0;
                    }, !0);
                    r(e.verse);
                }, r = function(n) {
                    n > 0 ? t.setAttribute("data-title", e.bible.digit(n)) : t.removeAttribute("data-title");
                }, l = function(e, t, o) {
                    n.name.bookmark[e].book.hasOwnProperty(t) && n.name.bookmark[e].book[t].hasOwnProperty(o) && 0 == n.name.bookmark[e].book[t][o].length && (delete n.name.bookmark[e].book[t][o], 
                    n.name.bookmark[e].book[t].isEmpty() && delete n.name.bookmark[e].book[t]);
                };
                o ? (t.classList.remove("unusable"), o.querySelector("ol.book").eventClick(function(e) {
                    var t = e.target;
                    t.parentNode.classList.contains("verse") && t.hasAttribute("id") && (t.classList.toggle("active"), 
                    i());
                }), i()) : t.removeAttr("data-title").addClass("unusable"), e.Toggle.menu(t, function(t) {
                    var o = e.elementCreate("ol").addClass("list-bookmark");
                    t.appendChild(o), n.name.bookmark.each(function(t, i) {
                        var s = document.createElement("li"), c = document.createElement("p"), u = document.createElement("p"), b = document.createElement("p");
                        c.innerHTML = i.name, b.setAttribute("class", "add icon-check-in"), u.setAttribute("class", "remove icon-wrong");
                        var d = a(function(e, o) {
                            return !(!n.name.bookmark[t].book.hasOwnProperty(e) || !n.name.bookmark[t].book[e].hasOwnProperty(o));
                        }, function(e, o, a, i) {
                            if (n.name.bookmark[t].book[o][a].has(i)) return !0;
                        }, !1);
                        d.verse > 0 ? s.classList.add("active") : s.classList.remove("active"), s.eventClick(function(o) {
                            var i = o.target;
                            if (i.classList.contains("add")) {
                                var c = !1, u = a(function(e, o, a) {
                                    return n.name.bookmark[t].book.hasOwnProperty(e) || (n.name.bookmark[t].book[e] = {}), 
                                    n.name.bookmark[t].book[e][o] = [], c = !1, !!a || void l(t, e, o);
                                }, function(o, a, i, r, l) {
                                    if (r.split("-").length > 1 && (c = !0), n.name.bookmark[t].book[a][i].push(r), 
                                    l && c) {
                                        var s = n.name.query.bible, u = new e.Query(s).obj(n.name.bookmark[t].book).result;
                                        n.name.bookmark[t].book = u;
                                    }
                                    return !0;
                                }, !0);
                                r(u.verse), u.verse > 0 ? s.classList.add("active") : s.classList.remove("active");
                            } else if (i.classList.contains("remove")) {
                                var u = a(function(e, t) {
                                    return !0;
                                }, function(e, o, a, i) {
                                    n.name.bookmark[t].book.hasOwnProperty(o) && n.name.bookmark[t].book[o].hasOwnProperty(a) && n.name.bookmark[t].book[o][a].has(i) && (n.name.bookmark[t].book[o][a].remove(i), 
                                    e.classList.remove("active"), 0 == n.name.bookmark[t].book[o][a].length && (delete n.name.bookmark[t].book[o][a], 
                                    n.name.bookmark[t].book[o].isEmpty() && delete n.name.bookmark[t].book[o]));
                                });
                                s.classList.remove("active"), r(0);
                            } else {
                                var u = a(function(e, t) {
                                    return !0;
                                }, function(e, o, a, i) {
                                    return n.name.bookmark[t].book.hasOwnProperty(o) && n.name.bookmark[t].book[o].hasOwnProperty(a) && n.name.bookmark[t].book[o][a].has(i.split("-")[0]) ? (e.setAttribute("class", "active"), 
                                    !0) : void e.classList.remove("active");
                                });
                                r(u.verse);
                            }
                        }), s.appendChild(b), s.appendChild(c), s.appendChild(u), o.appendChild(s);
                    });
                }, function() {
                    n.update("bookmark");
                });
            }
        },
        parallel: {
            menu: function(t) {
                var n = e.main.container().querySelector("div.active").querySelector("ol.parallel");
                n ? t.classList.remove("unusable") : t.classList.add("unusable"), e.Toggle.menu(t, function(t) {
                    var o = e.localStorage, a = document.createElement("ol"), i = [], r = o.name.query.parallel;
                    n = e.main.container().querySelector("div.active").querySelector("ol.parallel"), 
                    new Promise(function(e, t) {
                        n ? n.children.each(function(t, n, o, a) {
                            i.push(n.getAttribute("class")), a && e(i);
                        }) : t();
                    }).then(function(e) {
                        return e;
                    }, function() {
                        return !1;
                    }).then(function(l) {
                        a.setAttribute("class", "list-parallel"), t.appendChild(a), e.bible.all.each(function(t, s) {
                            var c = document.createElement("li"), u = document.createElement("p"), b = document.createElement("p");
                            u.setAttribute("class", "switch icon-ok"), l && i.indexOf(t) > -1 && c.classList.add("active"), 
                            o.name.query.bible == t && c.classList.add("main"), c.setAttribute("id", t), c.eventClick(function(a) {
                                if (l && a.target.classList.contains("switch")) if (c.classList.contains("active")) o.name.query.bible != t && (c.classList.remove("active"), 
                                n.removeChild(n.getElementsByClassName(t)[0]), r.remove(t)); else {
                                    var i = document.createElement("li"), s = new e.Query(t).from(e.config.parallel[o.name.query.page]);
                                    new e.Content(s).bible(t).then(function(e) {
                                        e.parallel(i).then(function() {
                                            n.appendChild(i).classList = t, c.classList.add("active"), r.push(t), r.unique();
                                        }, function(e) {
                                            console.log("parallel fail", e);
                                        });
                                    }, function(e) {
                                        console.log("bible error", e);
                                    });
                                } else window.location.hash = {
                                    bible: t
                                }.paramater([ o.name.query.page ]);
                            }), b.innerHTML = s.id.name, c.appendChild(u), c.appendChild(b), a.appendChild(c);
                        });
                    });
                });
            }
        },
        bible: {
            catalog: {
                section: {
                    1: {
                        1: [ 1, 2, 3, 4, 5 ],
                        2: [ 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17 ],
                        3: [ 18, 19, 20, 21, 22 ],
                        4: [ 23, 24, 25, 26, 27 ],
                        5: [ 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39 ]
                    },
                    2: {
                        6: [ 40, 41, 42, 43 ],
                        7: [ 44 ],
                        8: [ 45, 46, 47, 48, 49, 50, 51, 52, 53 ],
                        9: [ 54, 55, 56, 57 ],
                        10: [ 58 ],
                        11: [ 59, 60, 61, 62, 63, 64, 65, 66 ]
                    }
                },
                book: {
                    1: {
                        t: 1,
                        b: 1,
                        s: 1,
                        c: 50,
                        v: [ 31, 25, 24, 26, 32, 22, 24, 22, 29, 32, 32, 20, 18, 24, 21, 16, 27, 33, 38, 18, 34, 24, 20, 67, 34, 35, 46, 22, 35, 43, 55, 32, 20, 31, 29, 43, 36, 30, 23, 23, 57, 38, 34, 34, 28, 34, 31, 22, 33, 26 ]
                    },
                    2: {
                        t: 1,
                        b: 2,
                        s: 1,
                        c: 40,
                        v: [ 22, 25, 22, 31, 23, 30, 25, 32, 35, 29, 10, 51, 22, 31, 27, 36, 16, 27, 25, 26, 36, 31, 33, 18, 40, 37, 21, 43, 46, 38, 18, 35, 23, 35, 35, 38, 29, 31, 43, 38 ]
                    },
                    3: {
                        t: 1,
                        b: 3,
                        s: 1,
                        c: 27,
                        v: [ 17, 16, 17, 35, 19, 30, 38, 36, 24, 20, 47, 8, 59, 57, 33, 34, 16, 30, 37, 27, 24, 33, 44, 23, 55, 46, 34 ]
                    },
                    4: {
                        t: 1,
                        b: 4,
                        s: 1,
                        c: 36,
                        v: [ 54, 34, 51, 49, 31, 27, 89, 26, 23, 36, 35, 16, 33, 45, 41, 50, 13, 32, 22, 29, 35, 41, 30, 25, 18, 65, 23, 31, 40, 16, 54, 42, 56, 29, 34, 13 ]
                    },
                    5: {
                        t: 1,
                        b: 5,
                        s: 1,
                        c: 34,
                        v: [ 46, 37, 29, 49, 33, 25, 26, 20, 29, 22, 32, 32, 18, 29, 23, 22, 20, 22, 21, 20, 23, 30, 25, 22, 19, 19, 26, 68, 29, 20, 30, 52, 29, 12 ]
                    },
                    6: {
                        t: 1,
                        b: 6,
                        s: 2,
                        c: 24,
                        v: [ 18, 24, 17, 24, 15, 27, 26, 35, 27, 43, 23, 24, 33, 15, 63, 10, 18, 28, 51, 9, 45, 34, 16, 33 ]
                    },
                    7: {
                        t: 1,
                        b: 7,
                        s: 2,
                        c: 21,
                        v: [ 36, 23, 31, 24, 31, 40, 25, 35, 57, 18, 40, 15, 25, 20, 20, 31, 13, 31, 30, 48, 25 ]
                    },
                    8: {
                        t: 1,
                        b: 8,
                        s: 2,
                        c: 4,
                        v: [ 22, 23, 18, 22 ]
                    },
                    9: {
                        t: 1,
                        b: 9,
                        s: 2,
                        c: 31,
                        v: [ 28, 36, 21, 22, 12, 21, 17, 22, 27, 27, 15, 25, 23, 52, 35, 23, 58, 30, 24, 42, 15, 23, 29, 22, 44, 25, 12, 25, 11, 31, 13 ]
                    },
                    10: {
                        t: 1,
                        b: 10,
                        s: 2,
                        c: 24,
                        v: [ 27, 32, 39, 12, 25, 23, 29, 18, 13, 19, 27, 31, 39, 33, 37, 23, 29, 33, 43, 26, 22, 51, 39, 25 ]
                    },
                    11: {
                        t: 1,
                        b: 11,
                        s: 2,
                        c: 22,
                        v: [ 53, 46, 28, 34, 18, 38, 51, 66, 28, 29, 43, 33, 34, 31, 34, 34, 24, 46, 21, 43, 29, 53 ]
                    },
                    12: {
                        t: 1,
                        b: 12,
                        s: 2,
                        c: 25,
                        v: [ 18, 25, 27, 44, 27, 33, 20, 29, 37, 36, 21, 21, 25, 29, 38, 20, 41, 37, 37, 21, 26, 20, 37, 20, 30 ]
                    },
                    13: {
                        t: 1,
                        b: 13,
                        s: 2,
                        c: 29,
                        v: [ 54, 55, 24, 43, 26, 81, 40, 40, 44, 14, 47, 40, 14, 17, 29, 43, 27, 17, 19, 8, 30, 19, 32, 31, 31, 32, 34, 21, 30 ]
                    },
                    14: {
                        t: 1,
                        b: 14,
                        s: 2,
                        c: 36,
                        v: [ 17, 18, 17, 22, 14, 42, 22, 18, 31, 19, 23, 16, 22, 15, 19, 14, 19, 34, 11, 37, 20, 12, 21, 27, 28, 23, 9, 27, 36, 27, 21, 33, 25, 33, 27, 23 ]
                    },
                    15: {
                        t: 1,
                        b: 15,
                        s: 2,
                        c: 10,
                        v: [ 11, 70, 13, 24, 17, 22, 28, 36, 15, 44 ]
                    },
                    16: {
                        t: 1,
                        b: 16,
                        s: 2,
                        c: 13,
                        v: [ 11, 20, 32, 23, 19, 19, 73, 18, 38, 39, 36, 47, 31 ]
                    },
                    17: {
                        t: 1,
                        b: 17,
                        s: 2,
                        c: 10,
                        v: [ 22, 23, 15, 17, 14, 14, 10, 17, 32, 3 ]
                    },
                    18: {
                        t: 1,
                        b: 18,
                        s: 3,
                        c: 42,
                        v: [ 22, 13, 26, 21, 27, 30, 21, 22, 35, 22, 20, 25, 28, 22, 35, 22, 16, 21, 29, 29, 34, 30, 17, 25, 6, 14, 23, 28, 25, 31, 40, 22, 33, 37, 16, 33, 24, 41, 30, 24, 34, 17 ]
                    },
                    19: {
                        t: 1,
                        b: 19,
                        s: 3,
                        c: 150,
                        v: [ 6, 12, 8, 8, 12, 10, 17, 9, 20, 18, 7, 8, 6, 7, 5, 11, 15, 50, 14, 9, 13, 31, 6, 10, 22, 12, 14, 9, 11, 12, 24, 11, 22, 22, 28, 12, 40, 22, 13, 17, 13, 11, 5, 26, 17, 11, 9, 14, 20, 23, 19, 9, 6, 7, 23, 13, 11, 11, 17, 12, 8, 12, 11, 10, 13, 20, 7, 35, 36, 5, 24, 20, 28, 23, 10, 12, 20, 72, 13, 19, 16, 8, 18, 12, 13, 17, 7, 18, 52, 17, 16, 15, 5, 23, 11, 13, 12, 9, 9, 5, 8, 28, 22, 35, 45, 48, 43, 13, 31, 7, 10, 10, 9, 8, 18, 19, 2, 29, 176, 7, 8, 9, 4, 8, 5, 6, 5, 6, 8, 8, 3, 18, 3, 3, 21, 26, 9, 8, 24, 13, 10, 7, 12, 15, 21, 10, 20, 14, 9, 6 ]
                    },
                    20: {
                        t: 1,
                        b: 20,
                        s: 3,
                        c: 31,
                        v: [ 33, 22, 35, 27, 23, 35, 27, 36, 18, 32, 31, 28, 25, 35, 33, 33, 28, 24, 29, 30, 31, 29, 35, 34, 28, 28, 27, 28, 27, 33, 31 ]
                    },
                    21: {
                        t: 1,
                        b: 21,
                        s: 3,
                        c: 12,
                        v: [ 18, 26, 22, 16, 20, 12, 29, 17, 18, 20, 10, 14 ]
                    },
                    22: {
                        t: 1,
                        b: 22,
                        s: 3,
                        c: 8,
                        v: [ 17, 17, 11, 16, 16, 13, 13, 14 ]
                    },
                    23: {
                        t: 1,
                        b: 23,
                        s: 4,
                        c: 66,
                        v: [ 31, 22, 26, 6, 30, 13, 25, 22, 21, 34, 16, 6, 22, 32, 9, 14, 14, 7, 25, 6, 17, 25, 18, 23, 12, 21, 13, 29, 24, 33, 9, 20, 24, 17, 10, 22, 38, 22, 8, 31, 29, 25, 28, 28, 25, 13, 15, 22, 26, 11, 23, 15, 12, 17, 13, 12, 21, 14, 21, 22, 11, 12, 19, 12, 25, 24 ]
                    },
                    24: {
                        t: 1,
                        b: 24,
                        s: 4,
                        c: 52,
                        v: [ 19, 37, 25, 31, 31, 30, 34, 22, 26, 25, 23, 17, 27, 22, 21, 21, 27, 23, 15, 18, 14, 30, 40, 10, 38, 24, 22, 17, 32, 24, 40, 44, 26, 22, 19, 32, 21, 28, 18, 16, 18, 22, 13, 30, 5, 28, 7, 47, 39, 46, 64, 34 ]
                    },
                    25: {
                        t: 1,
                        b: 25,
                        s: 4,
                        c: 5,
                        v: [ 22, 22, 66, 22, 22 ]
                    },
                    26: {
                        t: 1,
                        b: 26,
                        s: 4,
                        c: 48,
                        v: [ 28, 10, 27, 17, 17, 14, 27, 18, 11, 22, 25, 28, 23, 23, 8, 63, 24, 32, 14, 49, 32, 31, 49, 27, 17, 21, 36, 26, 21, 26, 18, 32, 33, 31, 15, 38, 28, 23, 29, 49, 26, 20, 27, 31, 25, 24, 23, 35 ]
                    },
                    27: {
                        t: 1,
                        b: 27,
                        s: 4,
                        c: 12,
                        v: [ 21, 49, 30, 37, 31, 28, 28, 27, 27, 21, 45, 13 ]
                    },
                    28: {
                        t: 1,
                        b: 28,
                        s: 5,
                        c: 14,
                        v: [ 11, 23, 5, 19, 15, 11, 16, 14, 17, 15, 12, 14, 16, 9 ]
                    },
                    29: {
                        t: 1,
                        b: 29,
                        s: 5,
                        c: 3,
                        v: [ 20, 32, 21 ]
                    },
                    30: {
                        t: 1,
                        b: 30,
                        s: 5,
                        c: 9,
                        v: [ 15, 16, 15, 13, 27, 14, 17, 14, 15 ]
                    },
                    31: {
                        t: 1,
                        b: 31,
                        s: 5,
                        c: 1,
                        v: [ 21 ]
                    },
                    32: {
                        t: 1,
                        b: 32,
                        s: 5,
                        c: 4,
                        v: [ 17, 10, 10, 11 ]
                    },
                    33: {
                        t: 1,
                        b: 33,
                        s: 5,
                        c: 7,
                        v: [ 16, 13, 12, 13, 15, 16, 20 ]
                    },
                    34: {
                        t: 1,
                        b: 34,
                        s: 5,
                        c: 3,
                        v: [ 15, 13, 19 ]
                    },
                    35: {
                        t: 1,
                        b: 35,
                        s: 5,
                        c: 3,
                        v: [ 17, 20, 19 ]
                    },
                    36: {
                        t: 1,
                        b: 36,
                        s: 5,
                        c: 3,
                        v: [ 18, 15, 20 ]
                    },
                    37: {
                        t: 1,
                        b: 37,
                        s: 5,
                        c: 2,
                        v: [ 15, 23 ]
                    },
                    38: {
                        t: 1,
                        b: 38,
                        s: 5,
                        c: 14,
                        v: [ 21, 13, 10, 14, 11, 15, 14, 23, 17, 12, 17, 14, 9, 21 ]
                    },
                    39: {
                        t: 1,
                        b: 39,
                        s: 5,
                        c: 4,
                        v: [ 14, 17, 18, 6 ]
                    },
                    40: {
                        t: 2,
                        b: 40,
                        s: 6,
                        c: 28,
                        v: [ 25, 23, 17, 25, 48, 34, 29, 34, 38, 42, 30, 50, 58, 36, 39, 28, 27, 35, 30, 34, 46, 46, 39, 51, 46, 75, 66, 20 ]
                    },
                    41: {
                        t: 2,
                        b: 41,
                        s: 6,
                        c: 16,
                        v: [ 45, 28, 35, 41, 43, 56, 37, 38, 50, 52, 33, 44, 37, 72, 47, 20 ]
                    },
                    42: {
                        t: 2,
                        b: 42,
                        s: 6,
                        c: 24,
                        v: [ 80, 52, 38, 44, 39, 49, 50, 56, 62, 42, 54, 59, 35, 35, 32, 31, 37, 43, 48, 47, 38, 71, 56, 53 ]
                    },
                    43: {
                        t: 2,
                        b: 43,
                        s: 6,
                        c: 21,
                        v: [ 51, 25, 36, 54, 47, 71, 53, 59, 41, 42, 57, 50, 38, 31, 27, 33, 26, 40, 42, 31, 25 ]
                    },
                    44: {
                        t: 2,
                        b: 44,
                        s: 7,
                        c: 28,
                        v: [ 26, 47, 26, 37, 42, 15, 60, 40, 43, 48, 30, 25, 52, 28, 41, 40, 34, 28, 41, 38, 40, 30, 35, 27, 27, 32, 44, 31 ]
                    },
                    45: {
                        t: 2,
                        b: 45,
                        s: 8,
                        c: 16,
                        v: [ 32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27 ]
                    },
                    46: {
                        t: 2,
                        b: 46,
                        s: 8,
                        c: 16,
                        v: [ 31, 16, 23, 21, 13, 20, 40, 13, 27, 33, 34, 31, 13, 40, 58, 24 ]
                    },
                    47: {
                        t: 2,
                        b: 47,
                        s: 8,
                        c: 13,
                        v: [ 24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 14 ]
                    },
                    48: {
                        t: 2,
                        b: 48,
                        s: 8,
                        c: 6,
                        v: [ 24, 21, 29, 31, 26, 18 ]
                    },
                    49: {
                        t: 2,
                        b: 49,
                        s: 8,
                        c: 6,
                        v: [ 23, 22, 21, 32, 33, 24 ]
                    },
                    50: {
                        t: 2,
                        b: 50,
                        s: 8,
                        c: 4,
                        v: [ 30, 30, 21, 23 ]
                    },
                    51: {
                        t: 2,
                        b: 51,
                        s: 8,
                        c: 4,
                        v: [ 29, 23, 25, 18 ]
                    },
                    52: {
                        t: 2,
                        b: 52,
                        s: 8,
                        c: 5,
                        v: [ 10, 20, 13, 18, 28 ]
                    },
                    53: {
                        t: 2,
                        b: 53,
                        s: 8,
                        c: 3,
                        v: [ 12, 17, 18 ]
                    },
                    54: {
                        t: 2,
                        b: 54,
                        s: 9,
                        c: 6,
                        v: [ 20, 15, 16, 16, 25, 21 ]
                    },
                    55: {
                        t: 2,
                        b: 55,
                        s: 9,
                        c: 4,
                        v: [ 18, 26, 17, 22 ]
                    },
                    56: {
                        t: 2,
                        b: 56,
                        s: 9,
                        c: 3,
                        v: [ 16, 15, 15 ]
                    },
                    57: {
                        t: 2,
                        b: 57,
                        s: 9,
                        c: 1,
                        v: [ 25 ]
                    },
                    58: {
                        t: 2,
                        b: 58,
                        s: 10,
                        c: 13,
                        v: [ 14, 18, 19, 16, 14, 20, 28, 13, 28, 39, 40, 29, 25 ]
                    },
                    59: {
                        t: 2,
                        b: 59,
                        s: 11,
                        c: 5,
                        v: [ 27, 26, 18, 17, 20 ]
                    },
                    60: {
                        t: 2,
                        b: 60,
                        s: 11,
                        c: 5,
                        v: [ 25, 25, 22, 19, 14 ]
                    },
                    61: {
                        t: 2,
                        b: 61,
                        s: 11,
                        c: 3,
                        v: [ 21, 22, 18 ]
                    },
                    62: {
                        t: 2,
                        b: 62,
                        s: 11,
                        c: 5,
                        v: [ 10, 29, 24, 21, 21 ]
                    },
                    63: {
                        t: 2,
                        b: 63,
                        s: 11,
                        c: 1,
                        v: [ 13 ]
                    },
                    64: {
                        t: 2,
                        b: 64,
                        s: 11,
                        c: 1,
                        v: [ 14 ]
                    },
                    65: {
                        t: 2,
                        b: 65,
                        s: 11,
                        c: 1,
                        v: [ 25 ]
                    },
                    66: {
                        t: 2,
                        b: 66,
                        s: 11,
                        c: 22,
                        v: [ 20, 29, 22, 11, 14, 17, 17, 13, 21, 11, 19, 17, 18, 20, 8, 21, 18, 24, 21, 15, 27, 20 ]
                    }
                }
            },
            file: {},
            active: function(t) {
                return this.all[t ? t : e.localStorage.name.query.bible];
            },
            digit: function(e, t) {
                var n = this.active(t).digit;
                return Object.keys(n).length ? e.toString().replace(/[0-9]/g, function(e) {
                    return n[e];
                }) : e;
            },
            section: function(e, t) {
                return this.active(t).section[e];
            },
            testament: function(e, t) {
                return this.active(t).testament[e];
            },
            book: function(e, t) {
                return this.active(t).book[e];
            },
            lang: function(e, t) {
                return this.active(t).message[e];
            }
        },
        chapter: {
            get: {
                previous: function() {
                    var t = parseInt(e.localStorage.name.query.book), n = parseInt(e.localStorage.name.query.chapter) - 1;
                    return n < 1 && (t--, t = t < 1 ? 66 : t, n = e.bible.catalog.book[t].c), {
                        book: t,
                        chapter: n
                    };
                },
                next: function() {
                    var t = parseInt(e.localStorage.name.query.book), n = parseInt(e.localStorage.name.query.chapter) + 1;
                    return e.bible.catalog.book[t].c < n && (t++, t = t > 66 ? 1 : t, n = 1), {
                        book: t,
                        chapter: n
                    };
                }
            },
            previous: function() {
                window.location.hash = this.get.previous().paramater([ "chapter" ]);
            },
            next: function(e) {
                window.location.hash = this.get.next().paramater([ "chapter" ]);
            },
            current: function(t) {
                var n = e.localStorage;
                t.innerHTML = e.bible.digit(n.name.query.chapter), t.setAttribute("title", e.bible.book(n.name.query.book)), 
                e.Toggle.menu(t, function(t) {
                    var o = document.createElement("ol");
                    o.setAttribute("class", "list-chapter"), t.appendChild(o), e.bible.catalog.book[n.name.query.book].v.each(function(t, a) {
                        t++;
                        var i = document.createElement("li"), r = document.createElement("a");
                        r.setAttribute("href", {
                            book: n.name.query.book,
                            chapter: t
                        }.paramater([ "#chapter" ])), r.setAttribute("data-title", e.bible.digit(a)), r.innerHTML = e.bible.digit(t), 
                        n.name.query.chapter == t && i.classList.add("active"), i.appendChild(r), o.appendChild(i);
                    });
                });
            },
            timeoutNext: function() {
                window.location.hash = e.chapter.get.next().paramater([ "chapter" ]);
            }
        },
        Content: function(t) {
            var n, o, a, i = {
                book: 0,
                chapter: 0,
                verse: 0
            }, r = {
                book: function(t, n) {
                    var a = document.createElement("li"), i = document.createElement("h2");
                    return i.innerHTML = e.bible.book(n, o), a.setAttribute("id", n), a.appendChild(i), 
                    t.appendChild(a);
                },
                chapter: function(t, n, a) {
                    var i = document.createElement("li"), r = document.createElement("h3");
                    return r.innerHTML = e.bible.digit(a, o), r.setAttribute("title", e.bible.book(n, o)), 
                    i.setAttribute("id", a), i.appendChild(r), t.appendChild(i);
                },
                verse: function(t, n) {
                    var a = document.createElement("li");
                    return a.setAttribute("id", t), a.setAttribute("data-title", e.bible.digit(t, o)), 
                    a.innerHTML = n, a;
                },
                title: function(e) {
                    var t = document.createElement("li"), n = document.createElement("h4");
                    return t.setAttribute("class", "title"), n.innerHTML = e, t.appendChild(n), t;
                },
                ref: function(t) {
                    t = t.replace(/,/g, ";");
                    var n = document.createElement("li");
                    n.setAttribute("class", "ref");
                    var a = new e.Query(o), i = a.ref(t).result;
                    return i.each(function(t, i) {
                        var r = e.bible.book(t, o);
                        i.each(function(t, i) {
                            var l = document.createElement("p"), s = e.bible.digit(t, o), c = a.nameVerse(i), u = e.bible.digit(c, o);
                            l.innerHTML = e.bible.lang("nameVerse", o).replace(/{b}/, r).replace(/{c}/, s).replace(/{v}/, u), 
                            n.appendChild(l);
                        });
                    }), n;
                },
                ol: function(e) {
                    var t = document.createElement("ol");
                    return t.setAttribute("class", e), t;
                }
            }, l = function(e, o) {
                return new Promise(function(l, b) {
                    var d;
                    t.isEmpty() ? b(i) : t.each(function(t, h, p, m) {
                        var f, v = n.querySelector(s(t));
                        if (v) {
                            i.book++;
                            var g = c(h), k = v.querySelectorAll(g);
                            k.length ? k.each(function(n, s, c, p) {
                                i.chapter++;
                                var v, g = r.ol("verse"), k = s.getAttribute("id");
                                c = h.isEmpty() ? [] : h[k];
                                var C = s.querySelectorAll(u(c));
                                C.length ? C.each(function(n, s, u, h) {
                                    var C = s.getAttribute("id");
                                    o(g, s, c) && (i.verse++, i.parallel && (a.hasOwnProperty(t) || (a[t] = {}), a[t].hasOwnProperty(k) || (a[t][k] = []), 
                                    a[t][k].push(C)), d || (d = e.appendChild(r.ol("book"))), f || (f = r.book(d, t).appendChild(r.ol("chapter"))), 
                                    v || (v = r.chapter(f, t, k).appendChild(g))), m && p && h && (i.verse ? l(i) : b(i));
                                }) : p && (i.verse ? l(i) : b(i));
                            }) : m && (i.verse ? l(i) : b(i));
                        } else m && (i.verse ? l(i) : b(i));
                    });
                });
            }, s = function(e) {
                return 'book[id="0"]'.replace(0, e);
            }, c = function(e) {
                if (e.isEmpty()) return "chapter";
                var t = [];
                for (var n in e) t.push('chapter[id="0"]'.replace(0, n));
                return t.join(",");
            }, u = function(e) {
                return "verse";
            }, b = function(e, t) {
                return new RegExp(t, "gi").test(e);
            }, d = function(e, t) {
                var n = t.split("-");
                return e.has(n[0]);
            }, h = function(e, t) {
                return e.replace(new RegExp(t, "i"), "<b>$&</b>");
            }, p = {
                chapter: function(e) {
                    return l(e, function(e, t, n) {
                        var o = t.getAttribute("id"), a = t.textContent || t.innerText, i = t.getAttribute("title"), l = t.getAttribute("ref");
                        if (a) return i && e.appendChild(r.title(i)), e.appendChild(r.verse(o, a)), l && e.appendChild(r.ref(l)), 
                        !0;
                    });
                },
                lookup: function(e, t) {
                    return l(e, function(e, n, o) {
                        var a = n.getAttribute("id"), i = n.textContent || n.innerText;
                        if (o.length) {
                            if (d(o, a)) return e.appendChild(r.verse(a, i)), !0;
                        } else {
                            if (t.constructor === Object) return e.appendChild(r.verse(a, i)), !0;
                            if (b(i, t)) return e.appendChild(r.verse(a, h(i, t))), !0;
                        }
                    });
                },
                parallel: function(e) {
                    return l(e, function(e, t, n) {
                        var o = t.getAttribute("id"), a = t.textContent || t.innerText;
                        if (d(n, o)) return e.appendChild(r.verse(o, a)), !0;
                    });
                }
            };
            this.bible = function(t, r) {
                return o = t, "object" == typeof r && r.isEmpty() && (i.parallel = !0, a = r), new Promise(function(o, a) {
                    new e.xml(t).request(function() {
                        console.log("loading");
                    }).then(function(e) {
                        n = e, o(p);
                    }, function(e) {
                        a(e);
                    });
                });
            };
        },
        Query: function(t) {
            var n, o, a = e.bible.active(t).name, r = e.bible.catalog.book, l = {
                book: ";",
                chapter: ",",
                verse: "-"
            };
            this.result = {}, this.search = function(e) {
                var t;
                for (var n in a) {
                    var o = a[n].map(function(e) {
                        return e.toLowerCase();
                    }).indexOf(e.trim().toLowerCase());
                    if (o >= 0) {
                        t = n;
                        break;
                    }
                }
                return parseInt(t);
            }, this.process = function(e, t, o) {
                if (e = parseInt(e), t = parseInt(t), o = parseInt(o), this.result[n] || (this.result[n] = {}), 
                e <= r[n].c) {
                    var a = r[n].v[e - 1];
                    if (this.result[n][e] || (this.result[n][e] = []), t && o) {
                        var l = t <= a ? t : a, s = o <= a ? o : a;
                        for (i = l; i < s + 1; i++) this.insert(this.result[n][e], i);
                    } else t && this.insert(this.result[n][e], t <= a ? t : a);
                } else 0 === Object.keys(this.result[n]).length && delete this.result[n];
            }, this.insert = function(e, t) {
                e.indexOf(t) <= 0 && (e.push(t), e.sort(function(e, t) {
                    return e > t ? 1 : e < t ? -1 : 0;
                }));
            }, this.nameVerse = function(e) {
                function t(e, t) {
                    return e.toString().slice(-1) != l.verse ? e + l.verse + t : e + t;
                }
                var n;
                return e.filter(function(e, o, a) {
                    var i = parseInt(e), r = parseInt(a[o - 1]), s = parseInt(a[o + 1]);
                    0 == o ? n = i : i >= r + 1 && (i > r + 1 ? n = n + l.chapter + i : i + 1 < s ? n = t(n, i) : o == a.length - 1 ? i > r && (n = t(n, i)) : n = t(n, ""));
                }), n;
            }, this.obj = function(e) {
                try {
                    for (var t in e) {
                        n = t;
                        for (var o in e[t]) if (e[t][o].length) for (var a in e[t][o]) {
                            var i = e[t][o][a].toString().split(l.verse);
                            this.process(o, i[0], i.length > 1 ? i[1] : 0);
                        } else this.process(o);
                    }
                } catch (e) {} finally {
                    return this;
                }
            }, this.ref = function(e) {
                try {
                    Array.isArray(e) || (e = e.split(l.book));
                    for (var t in e) {
                        var o = /(((\w+)\.(\d+)\.(\d+))([\-–]?)?((\w+)\.(\d+)\.(\d+))?)/.exec(e[t]);
                        Array.isArray(o) && (n = this.search(o[3]), n && (o[3] !== o[8] && o[8] ? console.log("different book") : o[4] !== o[9] && o[9] ? (this.process(o[4], o[5], 200), 
                        this.process(o[9], 1, o[10])) : this.process(o[4], o[5], o[10])));
                    }
                } catch (e) {} finally {
                    return this;
                }
            }, this.str = function(e) {
                try {
                    Array.isArray(e) || (e = e.split(l.book));
                    for (var t in e) if (e[t]) {
                        var a = e[t].trim().split(l.chapter);
                        for (var i in a) if (0 == i) {
                            var r = /(\d?(\w+?)?(\s?)\w+(\s+?)?(\s?)\w+(\s+?))?((\d+)((\s+)?\:?(\s+)?)?)((\d+)([\-–])?(\d+)?)?/.exec(a[i]);
                            if (!r || !r[1]) break;
                            if (n = this.search(r[1]), !n) break;
                            o = r[8], this.process(o, r[13], r[15]);
                        } else if (n) {
                            var r = /(\s?(\d+?)(\s+)?\:(\s+)?)?(\s?\d+)?(\s?(\d+?)?([\-–])?(\s?\d+)?)/.exec(a[i]);
                            if (!r) break;
                            o = r[2] || o, this.process(o, r[5], r[9]);
                        }
                    }
                } catch (e) {} finally {
                    return this;
                }
            }, this.from = function(e) {
                return Object.keys(this.str(e).result).length > 0 ? this.result : Object.keys(this.ref(e).result).length > 0 ? this.result : "object" == typeof e ? this.obj(e).result : void 0;
            };
        }
    });
}(scriptive("app"));