(function () {
  var K = window.KONFIG, G = K.gespraech || {}, T = window.TEXTE, TS = window.TEXTE_STAND || {};
  var V = window.Versand, A = window.App, W = K.werte;
  var $ = function (id) { return document.getElementById(id); };
  function zwei(n) { return (n < 10 ? '0' : '') + n; }
  function datumText(ms) { var d = new Date(ms); return zwei(d.getDate()) + '.' + zwei(d.getMonth() + 1) + '.' + d.getFullYear(); }
  function uhrText(ms) { var d = new Date(ms); return zwei(d.getHours()) + ':' + zwei(d.getMinutes()); }
  function mehrzeilig(s, max) { s = String(s || '').replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').trim(); return max ? s.slice(0, max).trim() : s; }
  function einzeilig(s, max) { return mehrzeilig(String(s || '').replace(/\s+/g, ' '), max); }
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function neueId() { var b = new Uint8Array(12); crypto.getRandomValues(b); return hex(b); }
  function emailOk(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim()); }
  function telefonOk(v) { return (String(v || '').match(/\d/g) || []).length >= 6; }
  function tx(k) { return TS[k] || ''; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function modus() { return K.testmodus ? 'test' : 'messe'; }
  var dbV = null, dbName = null, keyV = null;
  function db() {
    if (dbV) return dbV;
    dbName = K.testmodus ? 'messe-app-gespraeche-test' : 'messe-app-gespraeche';
    dbV = new Promise(function (ok, fehler) {
      var r = indexedDB.open(dbName, 1);
      r.onupgradeneeded = function () {
        var d = r.result;
        if (!d.objectStoreNames.contains('schluessel')) d.createObjectStore('schluessel');
        if (!d.objectStoreNames.contains('gespraeche')) d.createObjectStore('gespraeche', { keyPath: 'id' });
      };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { fehler(r.error); };
    });
    return dbV;
  }
  function anfrage(store, art, fn) {
    return db().then(function (d) {
      return new Promise(function (ok, fehler) {
        var t = d.transaction(store, art), st = t.objectStore(store), erg, r = fn(st);
        if (r) r.onsuccess = function () { erg = r.result; };
        t.oncomplete = function () { ok(erg); };
        t.onerror = function () { fehler(t.error); };
        t.onabort = function () { fehler(t.error); };
      });
    });
  }
  function schluessel() {
    if (keyV) return keyV;
    keyV = anfrage('schluessel', 'readonly', function (st) { return st.get('aes'); }).then(function (k) {
      if (k) return k;
      return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']).then(function (neu) {
        return anfrage('schluessel', 'readwrite', function (st) { return st.put(neu, 'aes'); }).then(function () { return neu; });
      });
    });
    return keyV;
  }
  function ablegen(daten, erfasstMs) {
    return schluessel().then(function (k) {
      var iv = new Uint8Array(12); crypto.getRandomValues(iv);
      return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, k, new TextEncoder().encode(JSON.stringify(daten))).then(function (geheim) {
        var e = { id: neueId(), erfasst: erfasstMs, modus: modus(), iv: iv, inhalt: geheim };
        return anfrage('gespraeche', 'readwrite', function (st) { return st.put(e); }).then(function () { return e.id; });
      });
    });
  }
  function rohListe() { return anfrage('gespraeche', 'readonly', function (st) { return st.getAll(); }).then(function (l) { return l || []; }); }
  function anzahl() { return anfrage('gespraeche', 'readonly', function (st) { return st.count(); }); }
  function aeltestes() { return rohListe().then(function (l) { return l.reduce(function (m, e) { return Math.min(m, e.erfasst); }, Infinity); }); }
  function liste() {
    return Promise.all([schluessel(), rohListe()]).then(function (r) {
      var k = r[0], l = r[1].slice().sort(function (a, b) { return a.erfasst - b.erfasst; });
      return Promise.all(l.map(function (e) {
        return crypto.subtle.decrypt({ name: 'AES-GCM', iv: e.iv }, k, e.inhalt).then(function (b) {
          return { id: e.id, erfasst: e.erfasst, daten: JSON.parse(new TextDecoder().decode(b)) };
        });
      }));
    });
  }
  function loeschen(ids) {
    return anfrage('gespraeche', 'readwrite', function (st) { ids.forEach(function (id) { st.delete(id); }); return null; });
  }
  function allesLoeschen() { return anfrage('gespraeche', 'readwrite', function (st) { return st.clear(); }); }
  function pinSchluessel() { return 'messe-app-gespraech-pin-' + modus(); }
  function pinGesetzt() { try { return !!localStorage.getItem(pinSchluessel()); } catch (e) { return false; } }
  function pinHash(salz, pin) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(String(pin)), 'PBKDF2', false, ['deriveBits']).then(function (k) {
      return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salz), iterations: 200000 }, k, 256);
    }).then(hex);
  }
  function pinOk(pin) { return new RegExp('^\\d{' + (G.pinMindestens || 6) + ',12}$').test(String(pin || '')); }
  function pinFestlegen(pin) {
    var salz = neueId();
    return pinHash(salz, pin).then(function (h) { localStorage.setItem(pinSchluessel(), JSON.stringify({ salz: salz, hash: h })); });
  }
  function pinPruefen(pin) {
    var p = null; try { p = JSON.parse(localStorage.getItem(pinSchluessel()) || 'null'); } catch (e) { p = null; }
    if (!p || !pin) return Promise.resolve(false);
    return pinHash(p.salz, String(pin)).then(function (h) { return h === p.hash; });
  }
  function pinVergessen() {
    return allesLoeschen().then(function () { return window.Anmeldungen ? window.Anmeldungen.allesLoeschen() : null; })
      .then(function () { try { localStorage.removeItem(pinSchluessel()); } catch (e) { } });
  }
  function namenSchluessel() { return 'messe-app-standteam-' + modus(); }
  function standteamVorgabe() { return (G.standteam || []).slice(); }
  function standteamEigen() {
    var l = []; try { l = JSON.parse(localStorage.getItem(namenSchluessel()) || '[]'); } catch (e) { l = []; }
    if (!Array.isArray(l)) l = [];
    return standteamVorgabe().map(function (n, i) { return einzeilig(l[i], G.standteamNameHoechstens || 40); });
  }
  function standteamNamen() { var eigen = standteamEigen(); return standteamVorgabe().map(function (n, i) { return eigen[i] || n; }); }
  function standteamSpeichern(liste) {
    var l = standteamVorgabe().map(function (n, i) { return einzeilig((liste || [])[i], G.standteamNameHoechstens || 40); });
    try { if (l.some(Boolean)) localStorage.setItem(namenSchluessel(), JSON.stringify(l)); else localStorage.removeItem(namenSchluessel()); } catch (e) { }
    return standteamNamen();
  }
  function datenBauen(e, erfasstMs, nr) {
    var naechster = (e.naechster || []).filter(function (k) { return W.naechster[k]; });
    var mitMuster = naechster.indexOf('muster') >= 0, mitAngebot = naechster.indexOf('angebot') >= 0;
    var max = G.textHoechstens || 1000;
    return {
      nr: nr, messe: K.messe, datum: datumText(erfasstMs), uhrzeit: uhrText(erfasstMs),
      aufgenommenVon: einzeilig(e.von, 80), bewertung: W.bewertung[e.bewertung] || '',
      einrichtung: einzeilig(e.einrichtung, 200), einrichtungstyp: W.bereich[e.typ] || '',
      land: e.land && window.Laender ? window.Laender.wert(e.land) : '',
      vorname: einzeilig(e.vorname, 100), nachname: einzeilig(e.nachname, 100), position: einzeilig(e.position, 150),
      email: einzeilig(e.email, 200), telefon: einzeilig(e.telefon, 60), mobil: einzeilig(e.mobil, 60),
      produktgruppen: (e.produkte || []).map(function (k) { return W.produktgruppen[k]; }).filter(Boolean).join(', '),
      naechsterSchritt: naechster.map(function (k) { return W.naechster[k]; }).join(', '),
      rueckruf: naechster.indexOf('rueckruf') >= 0,
      angebotswunsch: mitAngebot ? mehrzeilig(e.angebot, max) : '',
      musterwunsch: mitMuster ? mehrzeilig(e.muster, max) : '',
      musteranschrift: mitMuster ? mehrzeilig(e.anschrift, max) : '',
      notiz: mehrzeilig(e.notiz, G.notizHoechstens || 2000),
      newsletterAngefragt: !!e.newsletter, vertriebAngefragt: !!e.vertrieb,
      sprache: e.lang || 'de', test: !!K.testmodus, app: K.version
    };
  }
  function fehlendePflicht(e) {
    var f = [], em = String(e.email || '').trim();
    if (em && !emailOk(em)) f.push({ schritt: 1, text: 'E-Mail-Adresse (ungültig)' });
    if (!emailOk(em) && !telefonOk(e.telefon) && !telefonOk(e.mobil)) f.push({ schritt: 1, text: 'E-Mail oder Telefon' });
    if (!einzeilig(e.einrichtung)) f.push({ schritt: 1, text: 'Labor / Firma / Einrichtung / Klinik' });
    if (!W.bereich[e.typ]) f.push({ schritt: 1, text: 'Einrichtungstyp' });
    if (!e.land) f.push({ schritt: 1, text: 'Land' });
    if (!(e.produkte || []).some(function (k) { return W.produktgruppen[k]; })) f.push({ schritt: 2, text: 'Produktinteresse' });
    if (!(e.naechster || []).some(function (k) { return W.naechster[k]; })) f.push({ schritt: 2, text: 'Nächster Schritt' });
    if (!W.bewertung[e.bewertung]) f.push({ schritt: 3, text: 'Bewertung' });
    if (!einzeilig(e.von)) f.push({ schritt: 3, text: 'Aufgenommen von' });
    return f;
  }
  function anmeldungBauen(e) {
    return {
      email: String(e.email || '').trim(), anrede: '', vorname: e.vorname || '', nachname: e.nachname || '', einrichtung: e.einrichtung || '',
      bereich: W.bereich[e.typ] ? [e.typ] : [], bereichSonst: '', interessen: [], land: e.land || '',
      telefon: e.vertrieb ? (e.telefon || e.mobil || '') : '', position: e.vertrieb ? (e.position || '') : '',
      newsletter: !!e.newsletter, vertrieb: !!e.vertrieb
    };
  }
  var SPALTEN = [
    ['nr', 'Gesprächs-Nr.'], ['messe', 'Messe'], ['datum', 'Datum'], ['uhrzeit', 'Uhrzeit'], ['aufgenommenVon', 'Aufgenommen von'],
    ['bewertung', 'Bewertung'], ['einrichtung', 'Labor / Firma / Einrichtung / Klinik'], ['einrichtungstyp', 'Einrichtungstyp'], ['land', 'Land'],
    ['vorname', 'Vorname'], ['nachname', 'Nachname'], ['position', 'Position'], ['email', 'E-Mail'], ['telefon', 'Telefon'], ['mobil', 'Mobil'],
    ['produktgruppen', 'Produktinteresse'], ['naechsterSchritt', 'Nächster Schritt'], ['rueckruf', 'Rückruf ausdrücklich gewünscht'],
    ['angebotswunsch', 'Angebotswunsch'], ['musterwunsch', 'Musterwunsch'], ['musteranschrift', 'Musteranschrift'], ['notiz', 'Messegespräch (Notiz)'],
    ['newsletterAngefragt', 'Newsletter angefragt (Bestätigung in CleverReach)'], ['vertriebAngefragt', 'Vertriebskontakt angefragt (Bestätigung in CleverReach)'],
    ['sprache', 'Sprache'], ['test', 'Testdaten'], ['app', 'App-Version']
  ];
  function zelle(v) {
    if (v === true) v = 'ja'; else if (v === false) v = 'nein';
    v = String(v == null ? '' : v).replace(/\r\n?/g, '\n');
    if (/^[=+\-@]/.test(v)) v = ' ' + v;
    return '"' + v.replace(/"/g, '""') + '"';
  }
  function csvBauen(eintraege) {
    var zeilen = [SPALTEN.map(function (s) { return zelle(s[1]); }).join(';')];
    eintraege.forEach(function (e) { zeilen.push(SPALTEN.map(function (s) { return zelle(e.daten[s[0]]); }).join(';')); });
    return '﻿' + zeilen.join('\r\n') + '\r\n';
  }
  function jjjjmmtt(ms) { var d = new Date(ms); return d.getFullYear() + '-' + zwei(d.getMonth() + 1) + '-' + zwei(d.getDate()); }
  function dateiname(ms) { var d = new Date(ms); return jjjjmmtt(ms) + ' Messegespraeche ' + (G.kuerzel || 'Messe') + ' ' + zwei(d.getHours()) + zwei(d.getMinutes()) + (K.testmodus ? ' TEST' : '') + '.csv'; }
  function betreff(ms) { return (K.testmodus ? 'TEST – ' : '') + 'Messegespräche ' + K.messe + ' – ' + datumText(ms); }
  function mailText(n, name) {
    return 'An: ' + (G.empfaenger || '') + '\n\n' + n + (n === 1 ? ' Messegespräch' : ' Messegespräche') + ' ' + K.messe +
      ' als Datei im Anhang (' + name + ', öffnen mit Excel).\nErstellt von der Messe-App ' + K.version + '.';
  }
  var AUSGAENGE = {
    datei: function (eintraege, jetztMs) { return ausgeben(eintraege, jetztMs); }
  };
  function uebergeben(eintraege, jetztMs) {
    var a = AUSGAENGE[G.ziel || 'datei'];
    return a ? a(eintraege, jetztMs) : Promise.reject(new Error('Ziel unbekannt'));
  }
  function ausgeben(eintraege, jetztMs) {
    var name = dateiname(jetztMs), csv = csvBauen(eintraege), datei = null;
    try { datei = new File([csv], name, { type: 'text/csv' }); } catch (e) { datei = null; }
    var titel = betreff(jetztMs), text = mailText(eintraege.length, name);
    if (datei && navigator.canShare && navigator.share && navigator.canShare({ files: [datei] })) {
      return navigator.share({ files: [datei], title: titel, text: text }).then(function () { return 'geteilt'; }, function (err) {
        return err && err.name === 'AbortError' ? 'abgebrochen' : herunterladen(csv, name, titel, text);
      });
    }
    return Promise.resolve(herunterladen(csv, name, titel, text));
  }
  function dateiAblegen(csv, name) {
    var url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    var a = document.createElement('a'); a.href = url; a.download = name; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 4000);
  }
  function nurSpeichern(eintraege, jetztMs) {
    var name = dateiname(jetztMs);
    dateiAblegen(csvBauen(eintraege), name);
    return Promise.resolve(name);
  }
  var ANM_SPALTEN = [
    ['datum', 'Datum'], ['uhrzeit', 'Uhrzeit'], ['formular', 'Formular (CleverReach)'], ['herkunft', 'Erfasst über'],
    ['ergebnis', 'Letzter Sendeversuch'], ['versuch', 'Zeit letzter Versuch'],
    ['email', 'E-Mail'], ['anrede', 'Anrede'], ['vorname', 'Vorname'], ['nachname', 'Nachname'], ['einrichtung', 'Labor / Firma / Einrichtung / Klinik'],
    ['bereich', 'Bereich'], ['interessen', 'Interessen'], ['land', 'Land'], ['telefon', 'Telefon'], ['position', 'Position'],
    ['quelle', 'Quelle (unverändert senden)'], ['sprache', 'Sprache'], ['test', 'Testdaten'], ['app', 'App-Version']
  ];
  var ANM_ERGEBNIS = {
    gestartet: 'Sendeversuch nicht abgeschlossen', bestaetigt: 'gesendet, Weiterleitung ok.html (Annahme nicht belegt)',
    nachgesendet: 'nachgesendet, Weiterleitung ok.html (Annahme nicht belegt)', unklar: 'unklare Antwort',
    offline: 'kein Netz, wartete auf Nachsenden', fehler: 'kein Netz, wartete auf Nachsenden'
  };
  function anmZeile(e) {
    var d = e.daten || {}, f = d.felder || {}, s = K.sprachen[d.lang] || {}, n = {}, k;
    for (k in K.felder) n[k] = K.felder[k];
    if (d.art === 'vertrieb' && K.felderVertrieb) for (k in K.felderVertrieb) n[k] = K.felderVertrieb[k];
    if (s.felder) for (k in s.felder) n[k] = s.felder[k];
    var z = {
      datum: datumText(e.erfasst), uhrzeit: uhrText(e.erfasst), formular: d.art === 'vertrieb' ? 'Vertriebskontakte' : 'Newsletter',
      herkunft: d.herkunft || '', ergebnis: ANM_ERGEBNIS[e.ergebnis] || String(e.ergebnis || ''),
      versuch: e.versuchZeit ? datumText(e.versuchZeit) + ' ' + uhrText(e.versuchZeit) : '', test: e.modus !== 'messe', app: K.version
    };
    ['email', 'anrede', 'vorname', 'nachname', 'einrichtung', 'bereich', 'interessen', 'land', 'telefon', 'position', 'quelle', 'sprache']
      .forEach(function (x) { z[x] = n[x] && f[n[x]] != null ? f[n[x]] : ''; });
    return z;
  }
  function anmCsvBauen(eintraege) {
    var zeilen = [ANM_SPALTEN.map(function (s) { return zelle(s[1]); }).join(';')];
    eintraege.forEach(function (e) { var z = anmZeile(e); zeilen.push(ANM_SPALTEN.map(function (s) { return zelle(z[s[0]]); }).join(';')); });
    return '﻿' + zeilen.join('\r\n') + '\r\n';
  }
  function anmDateiname(ms) { var d = new Date(ms); return jjjjmmtt(ms) + ' Anmeldungen ' + (G.kuerzel || 'Messe') + ' ' + zwei(d.getHours()) + zwei(d.getMinutes()) + (K.testmodus ? ' TEST' : '') + '.csv'; }
  function anmeldungenSpeichern(eintraege, jetztMs) {
    var name = anmDateiname(jetztMs);
    dateiAblegen(anmCsvBauen(eintraege), name);
    return Promise.resolve(name);
  }
  function anmListe() { return window.Anmeldungen ? window.Anmeldungen.liste() : Promise.resolve([]); }
  function anmAnzahl() { return window.Anmeldungen ? window.Anmeldungen.anzahl().then(null, function () { return 0; }) : Promise.resolve(0); }
  function herunterladen(csv, name, titel, text) {
    dateiAblegen(csv, name);
    var mail = 'mailto:' + (G.empfaenger || '') + '?subject=' + encodeURIComponent(titel) + '&body=' +
      encodeURIComponent(text + '\n\nBitte die heruntergeladene Datei „' + name + '“ anhängen und sie danach im Ordner „Downloads“ löschen.');
    setTimeout(function () { try { window.location.href = mail; } catch (e) { } }, 800);
    return 'heruntergeladen';
  }
  function nrSchluessel() { return 'messe-app-gespraech-nr-' + (K.testmodus ? 'test-' : '') + (G.kuerzel || 'MESSE'); }
  function anzahlNr() { try { return parseInt(localStorage.getItem(nrSchluessel()) || '0', 10) || 0; } catch (e) { return 0; } }
  function naechsteNr() {
    var n = anzahlNr() + 1;
    try { localStorage.setItem(nrSchluessel(), String(n)); } catch (e) { }
    return (G.kuerzel || 'MESSE') + '-' + ('00' + n).slice(-3);
  }
  var TEST_ABLAGEN = [
    { db: 'messe-app-gespraeche-test', store: 'gespraeche', text: 'Test-Gespräche' },
    { db: 'messe-app-test', store: 'warteschlange', text: 'Test-Anmeldungen, die auf Netz warten' },
    { db: 'messe-app-anmeldungen-test', store: 'anmeldungen', text: 'Gespeicherte Test-Anmeldungen (v0.5.3)' }
  ];
  function testSchluesselLs() {
    var l = [];
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^messe-app-/.test(k) && /-test(-|$)/.test(k)) l.push(k); } } catch (e) { }
    return l;
  }
  function testAblage(a, leeren) {
    return new Promise(function (ok) {
      var r;
      try { r = indexedDB.open(a.db); } catch (e) { ok(0); return; }
      r.onupgradeneeded = function () { try { r.transaction.abort(); } catch (e) { } };
      r.onerror = function () { ok(0); };
      r.onsuccess = function () {
        var d = r.result;
        if (!d.objectStoreNames.contains(a.store)) { d.close(); ok(0); return; }
        var t = d.transaction(a.store, leeren ? 'readwrite' : 'readonly'), st = t.objectStore(a.store), n = 0;
        var c = st.count(); c.onsuccess = function () { n = c.result; if (leeren) st.clear(); };
        t.oncomplete = function () { d.close(); ok(n); };
        t.onerror = t.onabort = function () { d.close(); ok(-1); };
      };
    });
  }
  function testdatenZaehlen() {
    return Promise.all(TEST_ABLAGEN.map(function (a) { return testAblage(a, false); })).then(function (n) {
      var ls = testSchluesselLs();
      return { gespraeche: n[0], warteschlange: n[1], anmeldungen: n[2], pin: ls.some(function (k) { return /pin-test$/.test(k); }),
        namen: ls.some(function (k) { return /standteam-test$/.test(k); }), zaehler: ls.some(function (k) { return /-nr-test-/.test(k); }), browserspeicher: ls.length };
    });
  }
  function testdatenLoeschen() {
    return Promise.all(TEST_ABLAGEN.map(function (a) { return testAblage(a, true); })).then(function () {
      testSchluesselLs().forEach(function (k) { try { localStorage.removeItem(k); } catch (e) { } });
      return testdatenZaehlen();
    });
  }
  var API = {
    testdatenZaehlen: testdatenZaehlen, testdatenLoeschen: testdatenLoeschen,
    datenBauen: datenBauen, fehlendePflicht: fehlendePflicht, anmeldungBauen: anmeldungBauen, csvBauen: csvBauen, SPALTEN: SPALTEN,
    dateiname: dateiname, betreff: betreff, ablegen: ablegen, uebergeben: uebergeben, nurSpeichern: nurSpeichern, AUSGAENGE: AUSGAENGE, pinOk: pinOk, liste: liste, anzahl: anzahl, aeltestes: aeltestes, loeschen: loeschen,
    pinGesetzt: pinGesetzt, pinFestlegen: pinFestlegen, pinPruefen: pinPruefen, pinVergessen: pinVergessen, naechsteNr: naechsteNr,
    standteamNamen: standteamNamen, standteamEigen: standteamEigen, standteamSpeichern: standteamSpeichern, _namenSchluessel: namenSchluessel,
    anmCsvBauen: anmCsvBauen, ANM_SPALTEN: ANM_SPALTEN, anmDateiname: anmDateiname, anmeldungenSpeichern: anmeldungenSpeichern,
    leeren: function () { }, seiteAktiv: function () { return false; }, spracheGeaendert: function () { },
    _roh: rohListe, _allesLoeschen: allesLoeschen, _dbName: function () { return db().then(function () { return dbName; }); }
  };
  window.Gespraech = API;
  if (!$('gespraech') || !A) return;
  var SEITEN = ['gPinNeu', 'gespraech', 'gUebergabe', 'gDanke', 'gExport', 'gNamen', 'gTestdaten'];
  function seiteAktiv() { var s = document.querySelector('.seite.aktiv'); return !!s && SEITEN.indexOf(s.id) >= 0; }
  var schritt = 1, sendetGerade = false, dankeUhr = null, pinZweck = null, exportIds = [], nachPinNeu = 'gespraech';
  var VKZ = {
    felder: { email: 'g_email', vorname: 'g_vorname', nachname: 'g_nachname', einrichtung: 'g_einrichtung', telefon: 'g_telefon', mobil: 'g_mobil', position: 'g_position' },
    meldung: 'gVkMeldung', pruef: 'gVkPruef', email: 'g_email', emailHinweis: 'gEmailPruefen', anleitung: tx('vkAnleitung'),
    telPos: function () { return true; }, nachher: function () { }
  };
  var TEXTFELDER = ['g_email', 'g_telefon', 'g_mobil', 'g_vorname', 'g_nachname', 'g_position', 'g_einrichtung', 'g_angebot', 'g_muster', 'g_anschrift', 'g_notiz'];
  function nutzbar() { return !!G.aktiv && (K.testmodus || !!G.texteGeprueft); }
  function chipsBauen(id, werte, beschrift) {
    $(id).innerHTML = Object.keys(werte).map(function (k) {
      return '<button type="button" class="chip" data-wert="' + esc(k) + '" aria-pressed="false">' + esc(beschrift ? beschrift(k) : werte[k]) + '</button>';
    }).join('');
  }
  function chipWert(id) { var c = document.querySelector('#' + id + ' .chip.an'); return c ? c.getAttribute('data-wert') : ''; }
  function chipWerte(id) { return Array.prototype.map.call(document.querySelectorAll('#' + id + ' .chip.an'), function (c) { return c.getAttribute('data-wert'); }); }
  function chipSetzen(id, werte) {
    document.querySelectorAll('#' + id + ' .chip').forEach(function (c) {
      var an = werte.indexOf(c.getAttribute('data-wert')) >= 0; c.classList.toggle('an', an); c.setAttribute('aria-pressed', an ? 'true' : 'false');
    });
  }
  function landBauen() {
    var sel = $('g_land'), L = window.Laender.liste('de');
    function opt(v, t) { var o = document.createElement('option'); o.value = v; o.textContent = t; return o; }
    sel.innerHTML = '';
    sel.appendChild(opt('', T.de.landWaehlen));
    var g1 = document.createElement('optgroup'); g1.label = T.de.landOben; L.oben.forEach(function (x) { g1.appendChild(opt(x.code, x.name)); });
    var g2 = document.createElement('optgroup'); g2.label = T.de.landAlle; L.rest.forEach(function (x) { g2.appendChild(opt(x.code, x.name)); });
    g2.appendChild(opt(window.Laender.ANDERES, T.de.landAnderes));
    sel.appendChild(g1); sel.appendChild(g2);
  }
  function vonNamen() { var o = {}; standteamNamen().forEach(function (n, i) { o[String(i)] = n; }); return o; }
  function vonName() { var i = chipWert('gVon'); return i === '' ? '' : (standteamNamen()[+i] || ''); }
  function eingabe() {
    var mitEmail = emailOk($('g_email').value);
    return {
      email: $('g_email').value, telefon: $('g_telefon').value, mobil: $('g_mobil').value, vorname: $('g_vorname').value, nachname: $('g_nachname').value,
      position: $('g_position').value, einrichtung: $('g_einrichtung').value, typ: chipWert('gTyp'), land: $('g_land').value,
      produkte: chipWerte('gProdukte'), naechster: chipWerte('gNaechster'),
      angebot: $('g_angebot').value, muster: $('g_muster').value, anschrift: $('g_anschrift').value,
      bewertung: chipWert('gBewertung'), von: vonName(), notiz: $('g_notiz').value,
      newsletter: mitEmail && $('g_haken').checked, vertrieb: mitEmail && $('g_vertrieb').checked && V.vertriebVerfuegbar(A.lang()),
      lang: A.lang()
    };
  }
  function wuenscheZeigen() {
    var n = chipWerte('gNaechster'), mitA = n.indexOf('angebot') >= 0, mitM = n.indexOf('muster') >= 0;
    $('gAngebotBox').classList.toggle('an', mitA);
    $('gMusterBox').classList.toggle('an', mitM);
    if (!mitM) $('g_anschrift').value = '';
    var chemie = chipWerte('gProdukte').some(function (k) { return (W.chemieGruppen || []).indexOf(k) >= 0; });
    $('gChemie').classList.toggle('an', mitM && chemie);
  }
  function schrittZeigen(n) {
    schritt = n;
    document.querySelectorAll('#gespraech .g-schritt').forEach(function (s) { s.classList.toggle('an', +s.getAttribute('data-schritt') === n); });
    document.querySelectorAll('#gespraech .g-sch').forEach(function (s) {
      var k = +s.getAttribute('data-schritt'); s.classList.toggle('an', k === n); s.classList.toggle('fertig', k < n);
    });
    $('gZurueck').style.visibility = n > 1 ? 'visible' : 'hidden';
    $('gWeiter').innerHTML = n < 3 ? tx('weiter') : tx('uebergeben');
    $('gFehlt').textContent = ''; $('gFehlt').classList.remove('an');
    var inh = document.querySelector('#gespraech .g-inhalt'); if (inh) inh.scrollTop = 0;
  }
  function startZeigen() {
    $('gStart').classList.toggle('an', nutzbar());
    $('start').classList.toggle('mit-gespraech', nutzbar());
    return Promise.all([anzahl(), aeltestes(), anmAnzahl()]).then(function (r) {
      var n = r[0] || 0, alt = n && (Date.now() - r[1]) > (G.warnenNachStunden || 72) * 3600 * 1000;
      $('gStartZaehler').textContent = n + ' ' + (n === 1 ? tx('gespeichertEins') : tx('gespeichertMehr'));
      $('gExportLos').disabled = n === 0 && !r[2];
      $('gStartWarnung').textContent = alt ? tx('warnung72') : '';
      $('gStatus').textContent = n ? ('Standteam: ' + n + ' ' + (n === 1 ? tx('gespeichertEins') : tx('gespeichertMehr')) + (alt ? ' – ' + tx('warnungKurz') : '')) : '';
      $('gStatus').classList.toggle('alarm', !!alt);
      return n;
    }, function () { return 0; });
  }
  function leeren() {
    clearInterval(dankeUhr);
    TEXTFELDER.forEach(function (i) { var el = $(i); el.value = ''; el.classList.remove('vorschlag'); el.classList.remove('ok'); });
    $('g_land').value = '';
    ['gTyp', 'gProdukte', 'gNaechster', 'gBewertung', 'gVon'].forEach(function (id) { chipSetzen(id, []); });
    $('g_haken').checked = false; $('g_vertrieb').checked = false;
    ['g_pin1', 'g_pin2', 'g_pin_frage'].forEach(function (i) { $(i).value = ''; });
    $('gPinFrage').classList.remove('an'); pinZweck = null;
    $('gTdFrage').classList.remove('an');
    ['gVkMeldung', 'gPinMeldung', 'gPinFrageMeldung', 'gExportMeldung', 'gNamenMeldung', 'gTdMeldung'].forEach(function (i) { $(i).textContent = ''; $(i).classList.remove('an'); });
    document.querySelectorAll('#gNamenFelder input').forEach(function (el) { el.value = ''; });
    A.emailMarkeWeg(VKZ);
    if (A.vkPruefWeg) A.vkPruefWeg();
    $('gZeichen').textContent = '0';
    $('gTestUebertragung').innerHTML = ''; $('gTestUebertragung').classList.remove('an');
    $('gExportListe').innerHTML = ''; exportIds = []; anmIds = []; usbIds = []; usbAnmIds = []; exportZustand('');
    wuenscheZeigen();
    schrittZeigen(1);
    startZeigen();
  }
  function meldung(id, t, warn) { var m = $(id); m.textContent = t || ''; m.classList.toggle('an', !!t); m.classList.toggle('warn', !!warn); }
  function pinNeuZeigen(danach) {
    nachPinNeu = danach; meldung('gPinMeldung', ''); A.zeige('gPinNeu'); setTimeout(function () { $('g_pin1').focus(); }, 60);
  }
  function losGehen() {
    if (!nutzbar()) return;
    if (!pinGesetzt()) { pinNeuZeigen('gespraech'); return; }
    gespraechStarten();
  }
  function pinNeuSpeichern() {
    var p1 = $('g_pin1').value.trim(), p2 = $('g_pin2').value.trim();
    if (!pinOk(p1)) { meldung('gPinMeldung', tx('pinRegel'), true); return; }
    if (p1 !== p2) { meldung('gPinMeldung', tx('pinUngleich'), true); return; }
    pinFestlegen(p1).then(function () {
      $('g_pin1').value = ''; $('g_pin2').value = '';
      if (nachPinNeu === 'namen') namenZeigen(); else if (nachPinNeu === 'testdaten') testdatenZeigen(); else gespraechStarten();
      nachPinNeu = 'gespraech';
    });
  }
  function namenLos() {
    if (!nutzbar()) return;
    if (!pinGesetzt()) { pinNeuZeigen('namen'); return; }
    pinFragen('namen');
  }
  function namenZeigen() {
    var vor = standteamVorgabe(), eigen = standteamEigen(), max = G.standteamNameHoechstens || 40;
    $('gNamenFelder').innerHTML = vor.map(function (n, i) {
      return '<div class="feld"><label for="g_name' + i + '">' + esc(tx('namenFeld') + ' ' + (i + 1)) + '</label>' +
        '<input type="text" id="g_name' + i + '" maxlength="' + max + '" autocomplete="off" autocorrect="off" autocapitalize="words" spellcheck="false" placeholder="' + esc(n) + '"></div>';
    }).join('');
    eigen.forEach(function (n, i) { $('g_name' + i).value = n; });
    meldung('gNamenMeldung', '');
    A.zeige('gNamen');
  }
  function namenSpeichernKlick() {
    var l = standteamVorgabe().map(function (n, i) { var el = $('g_name' + i); return el ? el.value : ''; });
    var neu = standteamSpeichern(l);
    standteamEigen().forEach(function (n, i) { var el = $('g_name' + i); if (el) el.value = n; });
    chipsBauen('gVon', vonNamen());
    meldung('gNamenMeldung', tx('namenGespeichert') + ' ' + neu.join(' · '));
  }
  function gespraechStarten() {
    chipsBauen('gVon', vonNamen());
    leeren();
    var letzter = ''; try { letzter = localStorage.getItem('messe-app-gespraech-von') || ''; } catch (e) { }
    if (letzter !== '' && standteamNamen()[+letzter]) chipSetzen('gVon', [letzter]);
    $('gVkBox').classList.toggle('an', !!A.vkAn());
    $('gTestzeile').classList.toggle('an', !!K.testmodus);
    A.zeige('gespraech');
    schrittZeigen(1);
  }
  function weiter() {
    if (schritt < 3) { schrittZeigen(schritt + 1); return; }
    var f = fehlendePflicht(eingabe());
    if (f.length) {
      var t = tx('fehlt') + ' ' + f.map(function (x) { return x.text; }).join(', ');
      if (f[0].schritt !== schritt) schrittZeigen(f[0].schritt);
      $('gFehlt').textContent = t; $('gFehlt').classList.add('an');
      return;
    }
    try { localStorage.setItem('messe-app-gespraech-von', chipWert('gVon')); } catch (e) { }
    uebergabeZeigen();
  }
  function uebergabeAktualisieren() {
    var l = A.lang(), tl = T[l] && T[l].gKurzWeb ? T[l] : T.de;
    $('gKurz').innerHTML = G.webDatenschutzErgaenzt ? tl.gKurzWeb : tl.gKurzOhne;
    var e = eingabe();
    $('gUeKontakt').textContent = [String(e.email).trim(), String(e.telefon).trim(), String(e.mobil || '').trim()].filter(Boolean).join(' · ');
    $('gUeWuensche').textContent = chipWerte('gNaechster').map(function (k) { return A.text('gN_' + k); }).filter(function (x) { return x && x !== '–'; }).join(', ') || '–';
    var mitEmail = emailOk(e.email);
    $('g_haken').disabled = !mitEmail; $('g_vertrieb').disabled = !mitEmail;
    if (!mitEmail) { $('g_haken').checked = false; $('g_vertrieb').checked = false; }
    $('gNlBox').classList.toggle('aus', !mitEmail);
    $('gUeEmailFehlt').classList.toggle('an', !mitEmail);
    var vt = V.vertriebVerfuegbar(l);
    $('gVertriebBox').classList.toggle('an', vt); $('gVertriebBox').classList.toggle('aus', !mitEmail);
    if (!vt) $('g_vertrieb').checked = false;
    $('gUnterKnopf').innerHTML = ($('g_haken').checked || $('g_vertrieb').checked) ? A.text('unterKnopfV3') : '';
    var offen = [];
    if (/<mark>/.test(V.dsText(l))) offen.push('Lücken 1/2 im Datenschutzhinweis');
    if (!G.texteGeprueft) offen.push('Texte zum Messegespräch nicht als Konrads geltende Fassung bestätigt (konfiguration.js texteGeprueft)');
    var m = $('gRechtEntwurf');
    if (K.testmodus && offen.length) { m.textContent = 'TESTMODUS – offen: ' + offen.join('; ') + '.'; m.classList.add('an'); }
    else { m.textContent = ''; m.classList.remove('an'); }
  }
  function uebergabeZeigen() {
    $('g_haken').checked = false; $('g_vertrieb').checked = false;
    uebergabeAktualisieren();
    A.zeige('gUebergabe');
    document.querySelectorAll('#gUebergabe .spalte-angaben, #gUebergabe .einw-rollen, #gUebergabe .formular-inhalt').forEach(function (s) { s.scrollTop = 0; });
  }
  function spracheGeaendert() { if ($('gUebergabe').classList.contains('aktiv')) uebergabeAktualisieren(); }
  function pinFragen(zweck) {
    pinZweck = zweck;
    $('gPinFrageText').textContent = zweck === 'export' ? tx('pinFrageExport') : (zweck === 'namen' ? tx('pinFrageNamen') : (zweck === 'testdaten' ? tx('pinFrageTestdaten') : tx('pinFrageZurueck')));
    $('g_pin_frage').value = ''; meldung('gPinFrageMeldung', '');
    $('gPinVergessen').style.display = zweck === 'export' ? '' : 'none';
    $('gPinFrage').classList.add('an');
    setTimeout(function () { $('g_pin_frage').focus(); }, 60);
  }
  function pinFrageOk() {
    var pin = $('g_pin_frage').value.trim(), zweck = pinZweck;
    $('g_pin_frage').value = '';
    pinPruefen(pin).then(function (ok) {
      if (!ok) { meldung('gPinFrageMeldung', tx('pinFalsch'), true); return; }
      $('gPinFrage').classList.remove('an'); pinZweck = null;
      if (zweck === 'zurueck') { A.zeige('gespraech'); schrittZeigen(3); }
      if (zweck === 'export') exportZeigen();
      if (zweck === 'namen') namenZeigen();
      if (zweck === 'testdaten') testdatenZeigen();
    });
  }
  function testdatenLos() {
    if (!nutzbar()) return;
    if (!pinGesetzt()) { pinNeuZeigen('testdaten'); return; }
    pinFragen('testdaten');
  }
  function tdListe(z) {
    var zeilen = [[TEST_ABLAGEN[0].text, z.gespraeche], [TEST_ABLAGEN[1].text, z.warteschlange], [TEST_ABLAGEN[2].text, z.anmeldungen],
      ['Test-Namen des Standteams', z.namen ? 'gespeichert' : 'keine'], ['Test-Messe-PIN', z.pin ? 'gespeichert' : 'keine'],
      ['Einträge im Browserspeicher (Test)', z.browserspeicher]];
    $('gTdListe').innerHTML = zeilen.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(String(r[1])) + '</td></tr>'; }).join('');
  }
  function testdatenZeigen() {
    meldung('gTdMeldung', ''); $('gTdFrage').classList.remove('an'); $('gTdStart').style.display = '';
    A.zeige('gTestdaten');
    testdatenZaehlen().then(tdListe);
  }
  function testdatenJa() {
    $('gTdFrage').classList.remove('an');
    testdatenLoeschen().then(function (z) {
      tdListe(z);
      var leer = !z.gespraeche && !z.warteschlange && !z.anmeldungen && !z.browserspeicher;
      meldung('gTdMeldung', leer ? tx('tdFertig') : 'Nicht alles gelöscht – bitte Technik informieren.', !leer);
      $('gTdStart').style.display = 'none';
      startZeigen();
    });
  }
  function pinVergessenFragen() {
    if (!window.confirm(tx('pinVergessenFrage'))) return;
    pinVergessen().then(function () { $('gPinFrage').classList.remove('an'); pinZweck = null; startZeigen(); A.neu(); });
  }
  function absenden() {
    if (sendetGerade) return;
    var e = eingabe();
    if (fehlendePflicht(e).length) { A.zeige('gespraech'); weiter(); return; }
    sendetGerade = true; $('gSenden').disabled = true;
    var jetzt = Date.now(), nr = naechsteNr(), lang = A.lang();
    var daten = datenBauen(e, jetzt, nr);
    var anm = (e.newsletter || e.vertrieb) ? anmeldungBauen(e) : null;
    e = null;
    A.zeige('sendet');
    var crVorher = V.protokoll.length, erg = { n: null };
    ablegen(daten, jetzt).then(function () {
      return anm ? V.anmelden(anm, lang, 'Messegespräch ' + nr).then(function (n) { erg.n = n; }) : null;
    }).then(function () {
      anm = null;
      leeren();
      dankeZeigen(erg, nr, daten, crVorher);
      daten = null;
    }, function () {
      sendetGerade = false; $('gSenden').disabled = false; daten = null; anm = null;
      window.alert(tx('speichernFehler')); A.neu();
    });
  }
  function dankeZeigen(erg, nr, daten, crVorher) {
    var n = erg.n;
    $('gNr').textContent = nr;
    $('gDankeNl').style.display = n && n.art === 'online' ? '' : 'none';
    $('gDankeOff').style.display = n && n.art === 'offline' ? '' : 'none';
    $('gDankeZwei').style.display = n && n.anzahl > 1 && n.art === 'online' ? '' : 'none';
    if (K.testmodus) testAnzeigen(daten, erg, crVorher);
    A.zaehlerZeigen();
    startZeigen();
    sendetGerade = false; $('gSenden').disabled = false;
    A.zeige('gDanke');
    var s = K.dankeSekunden; $('gCountdown').textContent = s;
    clearInterval(dankeUhr);
    dankeUhr = setInterval(function () { s--; $('gCountdown').textContent = s; if (s <= 0) { clearInterval(dankeUhr); A.neu(); } }, 1000);
  }
  function testAnzeigen(daten, erg, crVorher) {
    var b = $('gTestUebertragung');
    var zeilen = SPALTEN.map(function (s) { var v = daten[s[0]]; v = v === true ? 'ja' : (v === false ? 'nein' : v); return '<tr><td>' + esc(s[1]) + '</td><td>' + esc(String(v)) + '</td></tr>'; }).join('');
    var cr = V.protokoll.slice(crVorher);
    var crText = erg.n ? ('<br><b>CleverReach (Testmodus, nichts gesendet):</b> ' + (cr.length ? cr.map(function (q) { return esc(q.art) + ' → ' + esc(q.ziel) + ' (' + Object.keys(q.felder).length + ' Felder)'; }).join('; ') : (erg.n.art === 'offline' ? 'zwischengespeichert' : '–')))
      : '<br><b>CleverReach:</b> kein Häkchen – nichts an CleverReach.';
    b.innerHTML = '<b>Testmodus – Messegespräch verschlüsselt auf dem Tablet gespeichert. Diese Zeile kommt in die Datei für den Vertrieb:</b><table>' + zeilen + '</table>' + crText;
    b.classList.add('an');
  }
  var exportWeg = '', anmIds = [], usbIds = [], usbAnmIds = [];
  function exportZustand(z) {
    var usb = z === 'frageUsb';
    if (z === 'frage' || usb) exportWeg = usb ? 'usb' : 'teilen';
    $('gExportFrage').classList.toggle('an', z === 'frage' || usb);
    var beide = usb && usbIds.length && usbAnmIds.length, nurAnm = usb && !usbIds.length && usbAnmIds.length;
    $('gExportFrageText').textContent = usb ? (beide ? tx('exportFrageUsbBeide') : tx('exportFrageUsb')) : tx('exportFrage');
    $('gExportJa').textContent = usb ? (beide ? tx('exportJaUsbBeide') : (nurAnm ? tx('exportJaUsbAnm') : tx('exportJaUsb'))) : tx('exportJa');
    $('gExportDatei').disabled = z === 'leer' || !exportIds.length;
    $('gExportUsb').disabled = z === 'leer';
  }
  function exportZeigen() {
    meldung('gExportMeldung', '');
    $('gExportAn').textContent = G.empfaenger || '';
    $('gExportTestmarke').classList.toggle('an', !!K.testmodus);
    var aufr = window.Anmeldungen ? window.Anmeldungen.aufraeumen(K.hoechstdauerStunden).then(null, function () { }) : Promise.resolve();
    aufr.then(function () { return Promise.all([liste(), anmListe()]); }).then(function (r) {
      var l = r[0];
      exportIds = l.map(function (e) { return e.id; });
      anmIds = r[1].map(function (e) { return e.id; });
      $('gExportAnzahl').textContent = l.length;
      $('gExportAnmAnzahl').textContent = anmIds.length;
      $('gExportListe').innerHTML = l.map(function (e) {
        var d = e.daten;
        return '<tr><td>' + esc(d.nr) + '</td><td>' + esc(d.datum + ' ' + d.uhrzeit) + '</td><td>' + esc(d.einrichtung) + '</td><td>' + esc(d.bewertung) + '</td><td>' + esc(d.naechsterSchritt) + '</td></tr>';
      }).join('');
      l = null; r = null;
      exportZustand(exportIds.length || anmIds.length ? '' : 'leer');
      A.zeige('gExport');
    });
  }
  function exportLos() {
    var ids = exportIds.slice();
    if (!ids.length) return;
    liste().then(function (l) {
      var auswahl = l.filter(function (e) { return ids.indexOf(e.id) >= 0; });
      return uebergeben(auswahl, Date.now()).then(function (art) {
        auswahl = null; l = null;
        if (art === 'abgebrochen') { meldung('gExportMeldung', tx('exportAbgebrochen'), true); return; }
        meldung('gExportMeldung', art === 'geteilt' ? tx('exportGeteilt') : tx('exportHeruntergeladen'), art !== 'geteilt');
        exportZustand('frage');
      });
    }, function () { meldung('gExportMeldung', tx('speichernFehler'), true); });
  }
  function exportUsbLos() {
    var ids = exportIds.slice(), aIds = anmIds.slice();
    if (!ids.length && !aIds.length) return;
    Promise.all([liste(), anmListe()]).then(function (r) {
      var auswahl = r[0].filter(function (e) { return ids.indexOf(e.id) >= 0; });
      var aAuswahl = r[1].filter(function (e) { return aIds.indexOf(e.id) >= 0; });
      var jetzt = Date.now(), namen = [];
      r = null;
      var kette = auswahl.length ? nurSpeichern(auswahl, jetzt).then(function (n) { namen.push(n); }) : Promise.resolve();
      return kette.then(function () {
        if (!aAuswahl.length) return null;
        return new Promise(function (ok) { setTimeout(ok, auswahl.length ? 700 : 0); }).then(function () { return anmeldungenSpeichern(aAuswahl, jetzt); }).then(function (n) { namen.push(n); });
      }).then(function () {
        usbIds = auswahl.map(function (e) { return e.id; }); usbAnmIds = aAuswahl.map(function (e) { return e.id; });
        auswahl = null; aAuswahl = null;
        meldung('gExportMeldung', tx(usbAnmIds.length ? 'exportGespeichertAnm' : 'exportGespeichert').replace('{datei}', namen.join(' und ')));
        exportZustand('frageUsb');
      });
    }, function () { meldung('gExportMeldung', tx('speichernFehler'), true); });
  }
  function exportGesendet() {
    var usb = exportWeg === 'usb';
    var ids = usb ? usbIds.slice() : exportIds.slice(), aIds = usb ? usbAnmIds.slice() : [];
    loeschen(ids).then(function () {
      return aIds.length && window.Anmeldungen ? window.Anmeldungen.loeschen(aIds) : null;
    }).then(function () {
      exportIds = exportIds.filter(function (i) { return ids.indexOf(i) < 0; });
      anmIds = anmIds.filter(function (i) { return aIds.indexOf(i) < 0; });
      usbIds = []; usbAnmIds = [];
      if (!exportIds.length) $('gExportListe').innerHTML = '';
      $('gExportAnzahl').textContent = exportIds.length; $('gExportAnmAnzahl').textContent = anmIds.length;
      exportZustand(exportIds.length || anmIds.length ? '' : 'leer');
      meldung('gExportMeldung', ids.length + (ids.length === 1 ? ' Gespräch ' : ' Gespräche ') + (aIds.length ? 'und ' + aIds.length + (aIds.length === 1 ? ' Anmeldung ' : ' Anmeldungen ') : '') + tx('exportGeloescht'));
      startZeigen();
    });
  }
  document.querySelectorAll('[data-gt]').forEach(function (el) { el.innerHTML = tx(el.getAttribute('data-gt')); });
  $('gZeichenMax').textContent = G.notizHoechstens || 2000;
  $('g_notiz').setAttribute('maxlength', String(G.notizHoechstens || 2000));
  ['g_angebot', 'g_muster', 'g_anschrift'].forEach(function (i) { $(i).setAttribute('maxlength', String(G.textHoechstens || 1000)); });
  chipsBauen('gTyp', W.bereich, function (k) { return T.de['b_' + k] || W.bereich[k]; });
  chipsBauen('gProdukte', W.produktgruppen);
  chipsBauen('gNaechster', W.naechster);
  chipsBauen('gBewertung', W.bewertung, function (k) { return tx('b_' + k) || W.bewertung[k]; });
  chipsBauen('gVon', vonNamen());
  landBauen();
  ['gNaechster', 'gProdukte'].forEach(function (id) { $(id).addEventListener('click', function () { setTimeout(wuenscheZeigen, 0); }); });
  $('gLos').addEventListener('click', losGehen);
  $('gExportLos').addEventListener('click', function () { pinFragen('export'); });
  $('gNamenLos').addEventListener('click', namenLos);
  $('gTestdatenLos').addEventListener('click', testdatenLos);
  $('gTdLoeschen').addEventListener('click', function () { $('gTdFrage').classList.add('an'); });
  $('gTdNein').addEventListener('click', function () { $('gTdFrage').classList.remove('an'); });
  $('gTdJa').addEventListener('click', testdatenJa);
  $('gNamenOk').addEventListener('click', namenSpeichernKlick);
  $('gPinNeuOk').addEventListener('click', pinNeuSpeichern);
  $('g_pin2').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); pinNeuSpeichern(); } });
  $('gWeiter').addEventListener('click', weiter);
  $('gZurueck').addEventListener('click', function () { if (schritt > 1) schrittZeigen(schritt - 1); });
  document.querySelectorAll('#gespraech .g-sch').forEach(function (s) { s.addEventListener('click', function () { schrittZeigen(+s.getAttribute('data-schritt')); }); });
  $('gVkKnopf').addEventListener('click', function () { A.vkStarten(VKZ); });
  Object.keys(VKZ.felder).forEach(function (k) { $(VKZ.felder[k]).addEventListener('input', function () { this.classList.remove('vorschlag'); }); });
  $('g_email').addEventListener('input', function () { A.emailMarkeWeg(VKZ); });
  $('g_notiz').addEventListener('input', function () { $('gZeichen').textContent = $('g_notiz').value.length; });
  $('g_haken').addEventListener('change', uebergabeAktualisieren);
  $('g_vertrieb').addEventListener('change', uebergabeAktualisieren);
  $('gSenden').addEventListener('click', absenden);
  $('gUeZurueck').addEventListener('click', function () { pinFragen('zurueck'); });
  $('gPinFrageOk').addEventListener('click', pinFrageOk);
  $('gPinFrageAbbrechen').addEventListener('click', function () { $('g_pin_frage').value = ''; $('gPinFrage').classList.remove('an'); pinZweck = null; });
  $('g_pin_frage').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); pinFrageOk(); } });
  $('gPinVergessen').addEventListener('click', pinVergessenFragen);
  $('gExportDatei').addEventListener('click', exportLos);
  $('gExportUsb').addEventListener('click', exportUsbLos);
  $('gExportJa').addEventListener('click', exportGesendet);
  $('gExportNein').addEventListener('click', function () {
    var usb = exportWeg === 'usb';
    exportZustand(''); meldung('gExportMeldung', usb ? tx('exportNochNichtUsb') : tx('exportNochNicht'), usb);
  });
  API.leeren = leeren; API.seiteAktiv = seiteAktiv; API.spracheGeaendert = spracheGeaendert;
  startZeigen();
  setInterval(function () { if ($('start').classList.contains('aktiv')) startZeigen(); }, 60000);
  function demoFuellen(vk) {
    $('g_email').value = 'max.muster@example.com'; $('g_telefon').value = '+49 5603 000-12'; $('g_mobil').value = '+49 170 0000012';
    $('g_vorname').value = 'Max'; $('g_nachname').value = 'Muster'; $('g_position').value = 'Leitung Labor';
    $('g_einrichtung').value = 'Tierklinik Beispielstadt GmbH (Testdaten)';
    if (vk) ['g_email', 'g_vorname', 'g_nachname', 'g_einrichtung', 'g_telefon', 'g_mobil', 'g_position'].forEach(function (i) { $(i).classList.add('vorschlag'); });
    chipSetzen('gTyp', ['tiermedizin']); $('g_land').value = 'DE';
    chipSetzen('gProdukte', ['versand', 'formalin', 'objekttraeger']);
    chipSetzen('gNaechster', ['angebot', 'muster']);
    $('g_angebot').value = 'Postbox für Tierproben, ca. 2.000 Stück/Jahr, mit Kundenaufdruck (Beispiel)';
    $('g_muster').value = '5 × Postbox, 10 × Formalin 20 ml (Beispiel)';
    $('g_anschrift').value = 'Tierklinik Beispielstadt GmbH, z. H. Max Muster\nMusterstraße 1\n12345 Beispielstadt';
    chipSetzen('gBewertung', ['heiss']); chipSetzen('gVon', ['0']);
    $('g_notiz').value = 'Versendet heute Proben mit eigenem Karton; will Postbox mit Aufdruck testen. Entscheidung bis Ende November. (Testdaten)';
    $('gZeichen').textContent = $('g_notiz').value.length;
    wuenscheZeigen();
  }
  function ansicht() {
    var q = {};
    location.hash.replace(/^#/, '').split('&').forEach(function (p) { var a = p.split('='); if (a[0]) q[a[0]] = decodeURIComponent(a[1] || '1'); });
    if (!K.testmodus || !q.g) return;
    if (q.g === 'pin') { A.zeige('gPinNeu'); return; }
    if (q.demonamen) standteamSpeichern(['Erika Beispiel', '', 'Max Muster', '']);
    var weiterGehen = function () {
      if (q.g === 'namen') { namenZeigen(); return; }
      if (q.g === 'testdaten') { testdatenZeigen(); if (q.frage) setTimeout(function () { $('gTdFrage').classList.add('an'); }, 300); return; }
      if (q.g === 'export') {
        exportZeigen();
        if (q.frage === 'usb') setTimeout(function () { exportZustand('frageUsb'); meldung('gExportMeldung', tx('exportGespeichert').replace('{datei}', dateiname(Date.now()))); }, 300);
        else if (q.frage) setTimeout(function () { exportZustand('frage'); meldung('gExportMeldung', tx('exportGeteilt')); }, 300);
        return;
      }
      gespraechStarten();
      if (q.demo) demoFuellen(q.vk);
      var fl = q.lang ? document.querySelector('#gUebergabe .fl[data-l="' + q.lang + '"]') : null;
      if (fl) fl.click();
      if (q.g === '2') schrittZeigen(2);
      if (q.g === '3') schrittZeigen(3);
      if (q.g === 'fehlt') { $('g_einrichtung').value = ''; chipSetzen('gBewertung', []); schrittZeigen(3); weiter(); }
      if (q.g === 'uebergabe' || q.g === 'danke') {
        uebergabeZeigen();
        if (q.haken) { $('g_haken').checked = true; $('g_vertrieb').checked = V.vertriebVerfuegbar(A.lang()); uebergabeAktualisieren(); }
        if (q.g === 'danke') absenden();
      }
      if (q.ds) A.datenschutz(true);
    };
    if (!pinGesetzt()) pinFestlegen('000000').then(weiterGehen); else weiterGehen();
  }
  ansicht();
})();
