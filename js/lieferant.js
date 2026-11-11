(function () {
  var K = window.KONFIG, L = K.lieferant || {}, G = K.gespraech || {}, W = (K.werte || {}).lieferant || {};
  var TS = window.TEXTE_STAND || {}, GS = window.Gespraech, A = window.App;
  var $ = function (id) { return document.getElementById(id); };
  function tx(k) { return TS[k] || ''; }
  function zwei(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function modus() { return K.testmodus ? 'test' : 'messe'; }
  function kuerzel() { return L.kuerzel || G.kuerzel || 'MESSE'; }
  var dbV = null, keyV = null;
  function dbName() { return K.testmodus ? 'messe-app-lieferanten-test' : 'messe-app-lieferanten'; }
  function db() {
    if (dbV) return dbV;
    dbV = new Promise(function (ok, fehler) {
      var r = indexedDB.open(dbName(), 1);
      r.onupgradeneeded = function () {
        var d = r.result;
        if (!d.objectStoreNames.contains('schluessel')) d.createObjectStore('schluessel');
        if (!d.objectStoreNames.contains('lieferanten')) d.createObjectStore('lieferanten', { keyPath: 'id' });
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
  function verschluesseln(k, bytes) {
    var iv = new Uint8Array(12); crypto.getRandomValues(iv);
    return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, k, bytes).then(function (g) { return { iv: iv, inhalt: g }; });
  }
  function neueId() { var b = new Uint8Array(12); crypto.getRandomValues(b); return Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function ablegen(daten, fotoBlob, erfasstMs) {
    var k;
    return schluessel().then(function (kk) {
      k = kk;
      return Promise.all([
        verschluesseln(k, new TextEncoder().encode(JSON.stringify(daten))),
        fotoBlob ? fotoBlob.arrayBuffer().then(function (b) { return verschluesseln(k, b); }) : null
      ]);
    }).then(function (r) {
      var e = { id: neueId(), erfasst: erfasstMs, modus: modus(), iv: r[0].iv, inhalt: r[0].inhalt, fotoIv: r[1] ? r[1].iv : null, foto: r[1] ? r[1].inhalt : null };
      return anfrage('lieferanten', 'readwrite', function (st) { return st.put(e); }).then(function () { return e.id; });
    });
  }
  function rohListe() { return anfrage('lieferanten', 'readonly', function (st) { return st.getAll(); }).then(function (l) { return l || []; }); }
  function anzahl() { return anfrage('lieferanten', 'readonly', function (st) { return st.count(); }); }
  function aeltestes() { return rohListe().then(function (l) { return l.reduce(function (m, e) { return Math.min(m, e.erfasst); }, Infinity); }); }
  function liste() {
    return Promise.all([schluessel(), rohListe()]).then(function (r) {
      var k = r[0], l = r[1].slice().sort(function (a, b) { return a.erfasst - b.erfasst; });
      return Promise.all(l.map(function (e) {
        return Promise.all([
          crypto.subtle.decrypt({ name: 'AES-GCM', iv: e.iv }, k, e.inhalt),
          e.foto ? crypto.subtle.decrypt({ name: 'AES-GCM', iv: e.fotoIv }, k, e.foto) : null
        ]).then(function (b) {
          return { id: e.id, erfasst: e.erfasst, daten: JSON.parse(new TextDecoder().decode(b[0])), foto: b[1] ? new Uint8Array(b[1]) : null };
        });
      }));
    });
  }
  function loeschen(ids) { return anfrage('lieferanten', 'readwrite', function (st) { ids.forEach(function (id) { st.delete(id); }); return null; }); }
  function allesLoeschen() { return anfrage('lieferanten', 'readwrite', function (st) { return st.clear(); }); }
  var ZEICHEN = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  function geraet() {
    var g = '';
    try { g = localStorage.getItem('messe-app-geraet') || ''; } catch (e) { g = ''; }
    if (/^[A-Z2-9]{4}$/.test(g)) return g;
    var b = new Uint8Array(4); crypto.getRandomValues(b);
    g = Array.prototype.map.call(b, function (x) { return ZEICHEN[x % ZEICHEN.length]; }).join('');
    try { localStorage.setItem('messe-app-geraet', g); } catch (e) { }
    return g;
  }
  function nrSchluessel() { return 'messe-app-lieferant-nr-' + (K.testmodus ? 'test-' : '') + kuerzel(); }
  function naechsteNr() {
    var n = 0; try { n = parseInt(localStorage.getItem(nrSchluessel()) || '0', 10) || 0; } catch (e) { n = 0; }
    n++;
    try { localStorage.setItem(nrSchluessel(), String(n)); } catch (e) { }
    return kuerzel() + '-L-' + geraet() + '-' + ('00' + n).slice(-3);
  }
  function spartenAlle() {
    var o = {};
    (W.sparten || []).forEach(function (b) { Object.keys(b.werte).forEach(function (k) { o[k] = b.werte[k]; }); });
    if (W.sonstiges) o.sonstiges = W.sonstiges;
    return o;
  }
  function datenBauen(e, erfasstMs, nr, fotoName) {
    var sp = spartenAlle(), gew = (e.sparten || []).filter(function (k) { return sp[k]; });
    var nx = (e.naechster || []).filter(function (k) { return W.naechster[k]; });
    return {
      nr: nr, messe: K.messe, geraet: geraet(), datum: GS.datumText(erfasstMs), uhrzeit: GS.uhrText(erfasstMs),
      aufgenommenVon: GS.einzeilig(e.von, 80), firma: GS.einzeilig(e.firma, 200),
      vorname: GS.einzeilig(e.vorname, 100), nachname: GS.einzeilig(e.nachname, 100),
      email: GS.einzeilig(e.email, 200), telefon: GS.einzeilig(e.telefon, 60),
      land: e.land && window.Laender ? window.Laender.wert(e.land) : '',
      art: W.art[e.art] || '', schonLieferant: W.schonLieferant[e.schon] || '',
      sparten: gew.filter(function (k) { return k !== 'sonstiges'; }).map(function (k) { return sp[k]; }).join(', '),
      sonstiges: gew.indexOf('sonstiges') >= 0,
      naechsterSchritt: nx.map(function (k) { return W.naechster[k]; }).join(', '),
      einschaetzung: W.einschaetzung[e.einsch] || '',
      notiz: GS.mehrzeilig(e.notiz, L.notizHoechstens || 2000),
      kartenfoto: fotoName || '', test: !!K.testmodus, app: K.version
    };
  }
  function fehlendePflicht(e, mitFoto) {
    var f = [], em = String(e.email || '').trim();
    if (!GS.einzeilig(e.firma) && !mitFoto) f.push({ schritt: 1, text: 'Firma oder Kartenfoto' });
    if (em && !GS.emailOk(em)) f.push({ schritt: 1, text: 'E-Mail-Adresse (ungültig)' });
    if (!GS.einzeilig(e.von)) f.push({ schritt: 3, text: 'Aufgenommen von' });
    return f;
  }
  var SPALTEN = [
    ['nr', 'Kontakt-Nr.'], ['messe', 'Messe'], ['geraet', 'Tablet'], ['datum', 'Datum'], ['uhrzeit', 'Uhrzeit'], ['aufgenommenVon', 'Aufgenommen von'],
    ['firma', 'Firma'], ['vorname', 'Vorname'], ['nachname', 'Nachname'], ['email', 'E-Mail'], ['telefon', 'Telefon'], ['land', 'Land'],
    ['art', 'Art'], ['schonLieferant', 'Schon Lieferant'], ['sparten', 'Produktsparten'], ['sonstiges', 'Sonstiges / Neuheit (siehe Notiz)'],
    ['naechsterSchritt', 'Nächster Schritt'], ['einschaetzung', 'Einschätzung'], ['notiz', 'Notiz'], ['kartenfoto', 'Kartenfoto (Datei in der ZIP)'],
    ['test', 'Testdaten'], ['app', 'App-Version']
  ];
  function csvBauen(eintraege) {
    var zeilen = [SPALTEN.map(function (s) { return GS.zelle(s[1]); }).join(';')];
    eintraege.forEach(function (e) { zeilen.push(SPALTEN.map(function (s) { return GS.zelle(e.daten[s[0]]); }).join(';')); });
    return '﻿' + zeilen.join('\r\n') + '\r\n';
  }
  function dateiname(ms) {
    var d = new Date(ms);
    return GS.jjjjmmtt(ms) + ' Lieferanten ' + kuerzel() + ' ' + geraet() + ' ' + zwei(d.getHours()) + zwei(d.getMinutes()) + (K.testmodus ? ' TEST' : '');
  }
  var CRC_TAB = null;
  function crc32(u8) {
    if (!CRC_TAB) {
      CRC_TAB = new Uint32Array(256);
      for (var n = 0; n < 256; n++) { var c = n; for (var j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC_TAB[n] = c >>> 0; }
    }
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < u8.length; i++) crc = CRC_TAB[(crc ^ u8[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  function zipBauen(dateien, ms) {
    var d = new Date(ms), zeit = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var tag = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    var teile = [], zentral = [], pos = 0, enc = new TextEncoder();
    function kopf(groesse) { var b = new Uint8Array(groesse); return { b: b, v: new DataView(b.buffer) }; }
    dateien.forEach(function (f) {
      var name = enc.encode(f.name), crc = crc32(f.daten), n = f.daten.length;
      var h = kopf(30 + name.length), v = h.v;
      v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(6, 0x0800, true); v.setUint16(8, 0, true);
      v.setUint16(10, zeit, true); v.setUint16(12, tag, true); v.setUint32(14, crc, true); v.setUint32(18, n, true); v.setUint32(22, n, true);
      v.setUint16(26, name.length, true); v.setUint16(28, 0, true); h.b.set(name, 30);
      var z = kopf(46 + name.length), w = z.v;
      w.setUint32(0, 0x02014b50, true); w.setUint16(4, 20, true); w.setUint16(6, 20, true); w.setUint16(8, 0x0800, true); w.setUint16(10, 0, true);
      w.setUint16(12, zeit, true); w.setUint16(14, tag, true); w.setUint32(16, crc, true); w.setUint32(20, n, true); w.setUint32(24, n, true);
      w.setUint16(28, name.length, true); w.setUint32(42, pos, true); z.b.set(name, 46);
      teile.push(h.b, f.daten); zentral.push(z.b);
      pos += h.b.length + n;
    });
    var zLaenge = zentral.reduce(function (s, b) { return s + b.length; }, 0);
    var ende = kopf(22), e = ende.v;
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, dateien.length, true); e.setUint16(10, dateien.length, true);
    e.setUint32(12, zLaenge, true); e.setUint32(16, pos, true);
    var alle = teile.concat(zentral, [ende.b]), gesamt = new Uint8Array(pos + zLaenge + 22), o = 0;
    alle.forEach(function (b) { gesamt.set(b, o); o += b.length; });
    return gesamt;
  }
  function ausgabeBauen(eintraege, ms) {
    var basis = dateiname(ms), dateien = [{ name: basis + '.csv', daten: new TextEncoder().encode(csvBauen(eintraege)) }];
    eintraege.forEach(function (e) { if (e.foto && e.daten.kartenfoto) dateien.push({ name: e.daten.kartenfoto, daten: e.foto }); });
    return { name: basis + '.zip', zip: zipBauen(dateien, ms) };
  }
  function dateiAblegen(u8, name) {
    var url = URL.createObjectURL(new Blob([u8], { type: 'application/zip' }));
    var a = document.createElement('a'); a.href = url; a.download = name; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 4000);
  }
  var foto = null, fotoMasse = null, fotoLauf = 0;
  function fotoKopie(bild) {
    var max = L.fotoLaengsteSeite || 1280, s = Math.min(1, max / Math.max(bild.width, bild.height));
    var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(bild.width * s)); c.height = Math.max(1, Math.round(bild.height * s));
    var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(bild, 0, 0, c.width, c.height);
    return c;
  }
  function jpeg(c) { return new Promise(function (ok) { c.toBlob(function (b) { ok(b); }, 'image/jpeg', L.fotoGuete || 0.7); }); }
  function fotoVerwerfen() {
    fotoLauf++; foto = null; fotoMasse = null;
    var v = $('lFotoBild'); if (v) { v.width = 0; v.height = 0; }
    if ($('lFoto')) { $('lFoto').classList.remove('an'); $('lFotoInfo').textContent = ''; }
  }
  var API = {
    ablegen: ablegen, liste: liste, anzahl: anzahl, aeltestes: aeltestes, loeschen: loeschen, allesLoeschen: allesLoeschen,
    dbName: dbName, _roh: rohListe,
    geraet: geraet, naechsteNr: naechsteNr, datenBauen: datenBauen, fehlendePflicht: fehlendePflicht, SPALTEN: SPALTEN,
    csvBauen: csvBauen, zipBauen: zipBauen, crc32: crc32, ausgabeBauen: ausgabeBauen, dateiname: dateiname,
    fotoKopie: fotoKopie, jpeg: jpeg, spartenAlle: spartenAlle,
    leeren: function () { fotoVerwerfen(); }, seiteAktiv: function () { return false; }, startZeigen: function () { }
  };
  window.Lieferant = API;
  if (!$('lieferant') || !A || !GS) return;
  var SEITEN = ['lieferant', 'lExport'];
  function seiteAktiv() { var s = document.querySelector('.seite.aktiv'); return !!s && SEITEN.indexOf(s.id) >= 0; }
  var schritt = 1, speichertGerade = false, exportIds = [], usbIds = [];
  var TEXTFELDER = ['l_firma', 'l_vorname', 'l_nachname', 'l_email', 'l_telefon', 'l_notiz'];
  function fotoBehalten(bild) {
    var c = fotoKopie(bild), lauf = ++fotoLauf;
    var v = $('lFotoBild'), vs = Math.min(1, 220 / Math.max(c.width, c.height));
    v.width = Math.round(c.width * vs); v.height = Math.round(c.height * vs);
    v.getContext('2d').drawImage(c, 0, 0, v.width, v.height);
    $('lFoto').classList.add('an'); $('lFotoInfo').textContent = '…';
    jpeg(c).then(function (b) {
      var w = c.width, h = c.height; c.width = 0; c.height = 0;
      if (lauf !== fotoLauf || !b) return;
      foto = b; fotoMasse = { w: w, h: h };
      $('lFotoInfo').textContent = '(' + w + ' × ' + h + ' Bildpunkte, ' + Math.max(1, Math.round(b.size / 1024)) + ' KB)';
    });
  }
  var LZ = {
    felder: { email: 'l_email', vorname: 'l_vorname', nachname: 'l_nachname', einrichtung: 'l_firma', telefon: 'l_telefon' },
    meldung: 'lVkMeldung', pruef: 'lVkPruef', email: 'l_email', emailHinweis: 'lEmailPruefen', anleitung: tx('lVkAnleitung'),
    telPos: function () { return true; }, nachher: function () { }, fotoBehalten: fotoBehalten
  };
  function chipsBauen(id, werte) {
    $(id).innerHTML = Object.keys(werte).map(function (k) {
      return '<button type="button" class="chip" data-wert="' + esc(k) + '" aria-pressed="false">' + esc(werte[k]) + '</button>';
    }).join('');
  }
  function spartenBauen() {
    var h = (W.sparten || []).map(function (b) {
      return '<span class="l-block">' + esc(b.titel) + '</span>' + Object.keys(b.werte).map(function (k) {
        return '<button type="button" class="chip" data-wert="' + esc(k) + '" aria-pressed="false">' + esc(b.werte[k]) + '</button>';
      }).join('');
    }).join('');
    if (W.sonstiges) h += '<span class="l-block"></span><button type="button" class="chip l-sonst" data-wert="sonstiges" aria-pressed="false">' + esc(W.sonstiges) + '</button>';
    $('lSparten').innerHTML = h;
  }
  function chipWert(id) { var c = document.querySelector('#' + id + ' .chip.an'); return c ? c.getAttribute('data-wert') : ''; }
  function chipWerte(id) { return Array.prototype.map.call(document.querySelectorAll('#' + id + ' .chip.an'), function (c) { return c.getAttribute('data-wert'); }); }
  function chipSetzen(id, werte) {
    document.querySelectorAll('#' + id + ' .chip').forEach(function (c) {
      var an = werte.indexOf(c.getAttribute('data-wert')) >= 0; c.classList.toggle('an', an); c.setAttribute('aria-pressed', an ? 'true' : 'false');
    });
  }
  function landBauen() {
    var sel = $('l_land'), Ld = window.Laender.liste('de'), T = window.TEXTE.de;
    function opt(v, t) { var o = document.createElement('option'); o.value = v; o.textContent = t; return o; }
    sel.innerHTML = ''; sel.appendChild(opt('', T.landWaehlen));
    var g1 = document.createElement('optgroup'); g1.label = T.landOben; Ld.oben.forEach(function (x) { g1.appendChild(opt(x.code, x.name)); });
    var g2 = document.createElement('optgroup'); g2.label = T.landAlle; Ld.rest.forEach(function (x) { g2.appendChild(opt(x.code, x.name)); });
    g2.appendChild(opt(window.Laender.ANDERES, T.landAnderes));
    sel.appendChild(g1); sel.appendChild(g2);
  }
  function vonNamen() { var o = {}; GS.standteamNamen().forEach(function (n, i) { o[String(i)] = n; }); return o; }
  function vonName() { var i = chipWert('lVon'); return i === '' ? '' : (GS.standteamNamen()[+i] || ''); }
  function vonSchluessel() { return 'messe-app-lieferant-von-' + modus(); }
  function eingabe() {
    return {
      firma: $('l_firma').value, vorname: $('l_vorname').value, nachname: $('l_nachname').value, email: $('l_email').value,
      telefon: $('l_telefon').value, land: $('l_land').value, art: chipWert('lArt'), schon: chipWert('lSchon'),
      sparten: chipWerte('lSparten'), naechster: chipWerte('lNaechster'), einsch: chipWert('lEinsch'), von: vonName(), notiz: $('l_notiz').value
    };
  }
  function meldung(id, t, art) { var m = $(id); m.textContent = t || ''; m.classList.toggle('an', !!t); m.classList.toggle('warn', art === 'warn'); m.classList.toggle('gut', art === 'gut'); }
  function schrittZeigen(n) {
    schritt = n;
    document.querySelectorAll('#lieferant .g-schritt').forEach(function (s) { s.classList.toggle('an', +s.getAttribute('data-schritt') === n); });
    document.querySelectorAll('#lieferant .g-sch').forEach(function (s) {
      var k = +s.getAttribute('data-schritt'); s.classList.toggle('an', k === n); s.classList.toggle('fertig', k < n);
    });
    $('lZurueck').style.visibility = n > 1 ? 'visible' : 'hidden';
    $('lWeiter').innerHTML = n < 3 ? tx('weiter') : tx('lSpeichern');
    var inh = document.querySelector('#lieferant .g-inhalt'); if (inh) inh.scrollTop = 0;
  }
  function sonstigesZeigen() { $('lSonstHinweis').classList.toggle('an', chipWerte('lSparten').indexOf('sonstiges') >= 0); }
  function startZeigen() {
    var an = !!L.aktiv;
    ['lLos', 'lExportLos', 'lStartZaehler', 'lStartWarnung'].forEach(function (i) { $(i).style.display = an ? '' : 'none'; });
    if (!an) return Promise.resolve(0);
    return Promise.all([anzahl(), aeltestes()]).then(function (r) {
      var n = r[0] || 0, alt = n && (Date.now() - r[1]) > (G.warnenNachStunden || 72) * 3600 * 1000;
      $('lStartZaehler').textContent = n + ' ' + (n === 1 ? tx('lGespeichertEins') : tx('lGespeichertMehr'));
      $('lExportLos').disabled = n === 0;
      $('lStartWarnung').textContent = alt ? tx('lWarnung72') : '';
      return n;
    }, function () { return 0; });
  }
  function leeren() {
    fotoVerwerfen();
    TEXTFELDER.forEach(function (i) { var el = $(i); el.value = ''; el.classList.remove('vorschlag'); el.classList.remove('ok'); });
    $('l_land').value = '';
    ['lArt', 'lSchon', 'lSparten', 'lNaechster', 'lEinsch', 'lVon'].forEach(function (id) { chipSetzen(id, []); });
    ['lVkMeldung', 'lFehlt', 'lExportMeldung'].forEach(function (i) { meldung(i, ''); });
    A.emailMarkeWeg(LZ);
    $('lZeichen').textContent = '0';
    $('lExportListe').innerHTML = ''; exportIds = []; usbIds = []; $('lExportFrage').classList.remove('an');
    sonstigesZeigen();
    schrittZeigen(1);
    startZeigen();
  }
  function formStarten() {
    chipsBauen('lVon', vonNamen());
    leeren();
    var letzter = ''; try { letzter = localStorage.getItem(vonSchluessel()) || ''; } catch (e) { }
    if (letzter !== '' && GS.standteamNamen()[+letzter]) chipSetzen('lVon', [letzter]);
    $('lVkBox').classList.toggle('an', !!A.vkAn());
    $('lTestzeile').classList.toggle('an', !!K.testmodus);
    A.zeige('lieferant');
    schrittZeigen(1);
  }
  function losGehen() { if (GS.nutzbar() && L.aktiv) GS.pinNeuDann(formStarten); }
  function weiter() {
    meldung('lFehlt', '');
    if (schritt < 3) { schrittZeigen(schritt + 1); return; }
    speichern();
  }
  function speichern() {
    if (speichertGerade) return;
    var e = eingabe(), f = fehlendePflicht(e, !!foto);
    if (f.length) {
      if (f[0].schritt !== schritt) schrittZeigen(f[0].schritt);
      meldung('lFehlt', tx('fehlt') + ' ' + f.map(function (x) { return x.text; }).join(', '), 'warn');
      return;
    }
    speichertGerade = true; $('lWeiter').disabled = true;
    var jetzt = Date.now(), nr = naechsteNr(), bild = foto;
    var daten = datenBauen(e, jetzt, nr, bild ? nr + '.jpg' : '');
    e = null;
    try { localStorage.setItem(vonSchluessel(), chipWert('lVon')); } catch (x) { }
    ablegen(daten, bild, jetzt).then(function () {
      if (window.Bruecke) window.Bruecke.senden('lieferant', daten, bild);
      daten = null; bild = null;
      speichertGerade = false; $('lWeiter').disabled = false;
      var von = chipWert('lVon');
      leeren();
      if (von !== '') chipSetzen('lVon', [von]);
      meldung('lFehlt', tx('lGespeichert').replace('{nr}', nr), 'gut');
    }, function () {
      daten = null; bild = null;
      speichertGerade = false; $('lWeiter').disabled = false;
      window.alert(tx('lSpeichernFehler'));
    });
  }
  function exportLos() { GS.pinDann(tx('lPinFrageExport'), exportZeigen); }
  function exportZeigen() {
    meldung('lExportMeldung', ''); $('lExportFrage').classList.remove('an');
    $('lExportTestmarke').classList.toggle('an', !!K.testmodus);
    return liste().then(function (l) {
      exportIds = l.map(function (e) { return e.id; });
      $('lExportAnzahl').textContent = l.length;
      $('lExportListe').innerHTML = l.map(function (e) {
        var d = e.daten;
        return '<tr><td>' + esc(d.nr) + '</td><td>' + esc(d.datum + ' ' + d.uhrzeit) + '</td><td>' + esc(d.firma || '–') + '</td><td>' + (e.foto ? tx('lJa') : tx('lNein')) + '</td></tr>';
      }).join('');
      l = null;
      $('lExportUsb').disabled = !exportIds.length;
      A.zeige('lExport');
    }, function () { meldung('lExportMeldung', tx('lSpeichernFehler'), 'warn'); A.zeige('lExport'); });
  }
  function usbLos() {
    var ids = exportIds.slice();
    if (!ids.length) return;
    liste().then(function (l) {
      var auswahl = l.filter(function (e) { return ids.indexOf(e.id) >= 0; }), aus = ausgabeBauen(auswahl, Date.now());
      l = null;
      dateiAblegen(aus.zip, aus.name);
      usbIds = auswahl.map(function (e) { return e.id; });
      auswahl = null; aus.zip = null;
      meldung('lExportMeldung', tx('lExportGespeichert').replace('{datei}', aus.name));
      $('lExportFrage').classList.add('an');
    }, function () { meldung('lExportMeldung', tx('lSpeichernFehler'), 'warn'); });
  }
  function exportJa() {
    var ids = usbIds.slice();
    $('lExportFrage').classList.remove('an');
    loeschen(ids).then(function () {
      usbIds = [];
      return exportZeigen();
    }).then(function () {
      meldung('lExportMeldung', ids.length + (ids.length === 1 ? ' Lieferantenkontakt ' : ' Lieferantenkontakte ') + tx('lExportGeloescht'));
      startZeigen();
    });
  }
  $('lZeichenMax').textContent = L.notizHoechstens || 2000;
  $('l_notiz').setAttribute('maxlength', String(L.notizHoechstens || 2000));
  chipsBauen('lArt', W.art); chipsBauen('lSchon', W.schonLieferant); chipsBauen('lNaechster', W.naechster); chipsBauen('lEinsch', W.einschaetzung);
  spartenBauen(); chipsBauen('lVon', vonNamen()); landBauen();
  $('lLos').addEventListener('click', losGehen);
  $('lExportLos').addEventListener('click', exportLos);
  $('lWeiter').addEventListener('click', weiter);
  $('lZurueck').addEventListener('click', function () { meldung('lFehlt', ''); if (schritt > 1) schrittZeigen(schritt - 1); });
  document.querySelectorAll('#lieferant .g-sch').forEach(function (s) { s.addEventListener('click', function () { meldung('lFehlt', ''); schrittZeigen(+s.getAttribute('data-schritt')); }); });
  $('lVkKnopf').addEventListener('click', function () { A.vkStarten(LZ); });
  $('lFotoWeg').addEventListener('click', fotoVerwerfen);
  Object.keys(LZ.felder).forEach(function (k) { $(LZ.felder[k]).addEventListener('input', function () { this.classList.remove('vorschlag'); }); });
  $('l_email').addEventListener('input', function () { A.emailMarkeWeg(LZ); });
  $('l_notiz').addEventListener('input', function () { $('lZeichen').textContent = $('l_notiz').value.length; });
  $('lSparten').addEventListener('click', function (ev) {
    var c = ev.target.closest('.chip');
    setTimeout(function () {
      sonstigesZeigen();
      if (c && c.getAttribute('data-wert') === 'sonstiges' && c.classList.contains('an')) { schrittZeigen(3); $('l_notiz').focus(); }
    }, 0);
  });
  $('lExportUsb').addEventListener('click', usbLos);
  $('lExportJa').addEventListener('click', exportJa);
  $('lExportNein').addEventListener('click', function () { $('lExportFrage').classList.remove('an'); meldung('lExportMeldung', tx('lExportNochNicht'), 'warn'); });
  API.leeren = leeren; API.seiteAktiv = seiteAktiv; API.startZeigen = startZeigen;
  API._fotoBehalten = fotoBehalten; API._foto = function () { return foto; };
  startZeigen();
  setInterval(function () { if ($('start').classList.contains('aktiv')) startZeigen(); }, 60000);
  function beispielKarte() {
    var c = document.createElement('canvas'); c.width = 1700; c.height = 1000;
    var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 1700, 1000);
    x.fillStyle = '#222'; x.font = 'bold 90px Arial'; x.fillText('Beispiel Kunststoff GmbH', 90, 200);
    x.font = '64px Arial'; x.fillText('Max Muster · Vertrieb', 90, 420); x.fillText('max.muster@example.com', 90, 560);
    x.fillText('+49 5603 000-12', 90, 680); x.font = '44px Arial'; x.fillText('TESTKARTE – erfunden', 90, 900);
    return c;
  }
  function demoFuellen(mitFoto) {
    $('l_firma').value = 'Beispiel Kunststoff GmbH (Testdaten)'; $('l_vorname').value = 'Max'; $('l_nachname').value = 'Muster';
    $('l_email').value = 'max.muster@example.com'; $('l_land').value = 'DE';
    chipSetzen('lArt', ['hersteller']); chipSetzen('lSchon', ['nein']);
    chipSetzen('lSparten', ['probengefaesse', 'kunststoff']); chipSetzen('lNaechster', ['katalog', 'muster']); chipSetzen('lEinsch', ['interessant']);
    chipSetzen('lVon', ['0']);
    $('l_notiz').value = 'Fertigt Röhrchen nach Zeichnung, Muster nach der Messe. (Testdaten)';
    $('lZeichen').textContent = $('l_notiz').value.length;
    if (mitFoto) { var k = beispielKarte(); fotoBehalten(k); k.width = 0; }
  }
  function ansicht() {
    var q = {};
    location.hash.replace(/^#/, '').split('&').forEach(function (p) { var a = p.split('='); if (a[0]) q[a[0]] = decodeURIComponent(a[1] || '1'); });
    if (!K.testmodus || !q.l) return;
    var weiterGehen = function () {
      if (q.l === 'export' || q.l === 'frage') {
        exportZeigen().then(function () {
          if (q.l === 'frage') { $('lExportFrage').classList.add('an'); meldung('lExportMeldung', tx('lExportGespeichert').replace('{datei}', dateiname(Date.now()) + '.zip')); }
        });
        return;
      }
      formStarten();
      if (q.demo) demoFuellen(q.foto);
      if (q.l === '2') schrittZeigen(2);
      if (q.l === '3') schrittZeigen(3);
      if (q.l === 'fehlt') { $('l_firma').value = ''; fotoVerwerfen(); chipSetzen('lVon', []); schrittZeigen(3); weiter(); }
      if (q.l === 'gespeichert') { schrittZeigen(3); setTimeout(weiter, 400); }
    };
    if (!GS.pinGesetzt()) GS.pinFestlegen('000000').then(weiterGehen); else weiterGehen();
  }
  ansicht();
})();
