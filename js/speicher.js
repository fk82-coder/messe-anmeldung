(function () {
  var DBVERSION = 1;
  var dbName = null, dbVersprechen = null, schluesselVersprechen = null;
  function messebetrieb() { return !(window.KONFIG && window.KONFIG.testmodus); }
  function modusJetzt() { return messebetrieb() ? 'messe' : 'test'; }
  function oeffnen() {
    if (dbVersprechen) return dbVersprechen;
    dbName = messebetrieb() ? 'messe-app' : 'messe-app-test';
    dbVersprechen = new Promise(function (ok, fehler) {
      var r = indexedDB.open(dbName, DBVERSION);
      r.onupgradeneeded = function () {
        var db = r.result;
        if (!db.objectStoreNames.contains('schluessel')) db.createObjectStore('schluessel');
        if (!db.objectStoreNames.contains('warteschlange')) db.createObjectStore('warteschlange', { keyPath: 'id' });
      };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { fehler(r.error); };
    });
    return dbVersprechen;
  }
  function anfrage(speicher, art, fn) {
    return oeffnen().then(function (db) {
      return new Promise(function (ok, fehler) {
        var tx = db.transaction(speicher, art);
        var st = tx.objectStore(speicher);
        var ergebnis;
        var r = fn(st);
        if (r) r.onsuccess = function () { ergebnis = r.result; };
        tx.oncomplete = function () { ok(ergebnis); };
        tx.onerror = function () { fehler(tx.error); };
        tx.onabort = function () { fehler(tx.error); };
      });
    });
  }
  function schluessel() {
    if (schluesselVersprechen) return schluesselVersprechen;
    schluesselVersprechen = anfrage('schluessel', 'readonly', function (st) { return st.get('aes'); })
      .then(function (k) {
        if (k) return k;
        return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
          .then(function (neu) {
            return anfrage('schluessel', 'readwrite', function (st) { return st.put(neu, 'aes'); })
              .then(function () { return neu; });
          });
      });
    return schluesselVersprechen;
  }
  function neueId() {
    var b = new Uint8Array(12); crypto.getRandomValues(b);
    return Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
  }
  var Speicher = {
    ablegen: function (daten, erfasstMs) {
      return schluessel().then(function (k) {
        var iv = new Uint8Array(12); crypto.getRandomValues(iv);
        var klar = new TextEncoder().encode(JSON.stringify(daten));
        return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, k, klar).then(function (geheim) {
          var eintrag = { id: neueId(), erfasst: erfasstMs || Date.now(), versuche: 0, unklar: 0, modus: modusJetzt(), iv: iv, inhalt: geheim };
          return anfrage('warteschlange', 'readwrite', function (st) { return st.put(eintrag); })
            .then(function () { return eintrag.id; });
        });
      });
    },
    anzahl: function () {
      return anfrage('warteschlange', 'readonly', function (st) { return st.count(); });
    },
    naechste: function (maxUnklar) {
      return Promise.all([schluessel(), anfrage('warteschlange', 'readonly', function (st) { return st.getAll(); })])
        .then(function (r) {
          var k = r[0], liste = (r[1] || []).filter(function (e) { return e.unklar < maxUnklar; });
          liste.sort(function (a, b) { return a.erfasst - b.erfasst; });
          return Promise.all(liste.map(function (e) {
            return crypto.subtle.decrypt({ name: 'AES-GCM', iv: e.iv }, k, e.inhalt).then(function (klar) {
              return { id: e.id, erfasst: e.erfasst, modus: e.modus || 'test', daten: JSON.parse(new TextDecoder().decode(klar)) };
            });
          }));
        });
    },
    loeschen: function (id) {
      return anfrage('warteschlange', 'readwrite', function (st) { return st.delete(id); });
    },
    versuchZaehlen: function (id, warUnklar) {
      return anfrage('warteschlange', 'readwrite', function (st) {
        var r = st.get(id);
        r.onsuccess = function () {
          var e = r.result; if (!e) return;
          e.versuche++; if (warUnklar) e.unklar++;
          st.put(e);
        };
        return null;
      });
    },
    aufraeumen: function (hoechstdauerStunden, jetztMs) {
      var grenze = (jetztMs || Date.now()) - hoechstdauerStunden * 3600 * 1000;
      var geloescht = 0;
      return anfrage('warteschlange', 'readwrite', function (st) {
        var r = st.openCursor();
        r.onsuccess = function () {
          var c = r.result; if (!c) return;
          if (c.value.erfasst < grenze || (messebetrieb() && c.value.modus !== 'messe')) { c.delete(); geloescht++; }
          c.continue();
        };
        return null;
      }).then(function () { return geloescht; });
    },
    _roh: function () {
      return anfrage('warteschlange', 'readonly', function (st) { return st.getAll(); });
    },
    _dbName: function () { return oeffnen().then(function () { return dbName; }); },
    _allesLeeren: function () {
      return anfrage('warteschlange', 'readwrite', function (st) { return st.clear(); });
    }
  };
  window.Speicher = Speicher;
  var aDbName = null, aDbV = null, aKeyV = null;
  function aOeffnen() {
    if (aDbV) return aDbV;
    aDbName = messebetrieb() ? 'messe-app-anmeldungen' : 'messe-app-anmeldungen-test';
    aDbV = new Promise(function (ok, fehler) {
      var r = indexedDB.open(aDbName, 1);
      r.onupgradeneeded = function () {
        var db = r.result;
        if (!db.objectStoreNames.contains('schluessel')) db.createObjectStore('schluessel');
        if (!db.objectStoreNames.contains('anmeldungen')) db.createObjectStore('anmeldungen', { keyPath: 'id' });
      };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { fehler(r.error); };
    });
    return aDbV;
  }
  function aAnfrage(speicher, art, fn) {
    return aOeffnen().then(function (db) {
      return new Promise(function (ok, fehler) {
        var tx = db.transaction(speicher, art), st = tx.objectStore(speicher), ergebnis, r = fn(st);
        if (r) r.onsuccess = function () { ergebnis = r.result; };
        tx.oncomplete = function () { ok(ergebnis); };
        tx.onerror = function () { fehler(tx.error); };
        tx.onabort = function () { fehler(tx.error); };
      });
    });
  }
  function aSchluessel() {
    if (aKeyV) return aKeyV;
    aKeyV = aAnfrage('schluessel', 'readonly', function (st) { return st.get('aes'); }).then(function (k) {
      if (k) return k;
      return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']).then(function (neu) {
        return aAnfrage('schluessel', 'readwrite', function (st) { return st.put(neu, 'aes'); }).then(function () { return neu; });
      });
    });
    return aKeyV;
  }
  window.Anmeldungen = {
    ablegen: function (daten, erfasstMs) {
      return aSchluessel().then(function (k) {
        var iv = new Uint8Array(12); crypto.getRandomValues(iv);
        return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, k, new TextEncoder().encode(JSON.stringify(daten))).then(function (geheim) {
          var e = { id: neueId(), erfasst: erfasstMs || Date.now(), modus: modusJetzt(), ergebnis: 'gestartet', versuchZeit: null, iv: iv, inhalt: geheim };
          return aAnfrage('anmeldungen', 'readwrite', function (st) { return st.put(e); }).then(function () { return e.id; });
        });
      });
    },
    ergebnis: function (id, erg, jetztMs) {
      return aAnfrage('anmeldungen', 'readwrite', function (st) {
        var r = st.get(id);
        r.onsuccess = function () { var e = r.result; if (!e) return; e.ergebnis = erg; e.versuchZeit = jetztMs || Date.now(); st.put(e); };
        return null;
      });
    },
    anzahl: function () { return aAnfrage('anmeldungen', 'readonly', function (st) { return st.count(); }); },
    liste: function () {
      return Promise.all([aSchluessel(), aAnfrage('anmeldungen', 'readonly', function (st) { return st.getAll(); })]).then(function (r) {
        var k = r[0], l = (r[1] || []).slice().sort(function (a, b) { return a.erfasst - b.erfasst; });
        return Promise.all(l.map(function (e) {
          return crypto.subtle.decrypt({ name: 'AES-GCM', iv: e.iv }, k, e.inhalt).then(function (b) {
            return { id: e.id, erfasst: e.erfasst, modus: e.modus, ergebnis: e.ergebnis, versuchZeit: e.versuchZeit, daten: JSON.parse(new TextDecoder().decode(b)) };
          });
        }));
      });
    },
    loeschen: function (ids) { return aAnfrage('anmeldungen', 'readwrite', function (st) { ids.forEach(function (id) { st.delete(id); }); return null; }); },
    allesLoeschen: function () { return aAnfrage('anmeldungen', 'readwrite', function (st) { return st.clear(); }); },
    aufraeumen: function (hoechstdauerStunden, jetztMs) {
      var grenze = (jetztMs || Date.now()) - hoechstdauerStunden * 3600 * 1000, geloescht = 0;
      return aAnfrage('anmeldungen', 'readwrite', function (st) {
        var r = st.openCursor();
        r.onsuccess = function () { var c = r.result; if (!c) return; if (c.value.erfasst < grenze) { c.delete(); geloescht++; } c.continue(); };
        return null;
      }).then(function () { return geloescht; });
    },
    _roh: function () { return aAnfrage('anmeldungen', 'readonly', function (st) { return st.getAll(); }); },
    _dbName: function () { return aOeffnen().then(function () { return aDbName; }); }
  };
})();
