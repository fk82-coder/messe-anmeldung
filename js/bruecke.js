/* Messe-Brücke (Veyond): schickt jedes gespeicherte Messegespräch und jeden Lieferantenkontakt
   zusätzlich an den Server (DB + Zusammenfassungs-Mail). Freds Ablauf bleibt unverändert: die
   verschlüsselte Ablage auf dem Tablet und der CSV-Export laufen weiter und sind der Rückweg,
   wenn die Übertragung scheitert. Aufruf aus gespraech.js / lieferant.js nach dem Ablegen.
   Der Token steht nicht im Code: das Tablet bekommt ihn einmal über index.html#bruecke-token=… */
(function () {
  var K = window.KONFIG || {}, B = K.bruecke || {};
  var ZIEL = B.ziel;
  var SCHLUESSEL = 'messe-app-bruecke-token';
  function token() { try { return localStorage.getItem(SCHLUESSEL) || ''; } catch (e) { return ''; } }
  function tokenAusAdresse() {
    var m = /(?:^#|&)bruecke-token=([A-Za-z0-9_-]{20,200})/.exec(location.hash || '');
    if (!m) return;
    try { localStorage.setItem(SCHLUESSEL, m[1]); } catch (e) { }
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { }
  }
  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16); crypto.getRandomValues(b); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }
  function base64(blob) {
    return new Promise(function (ok, fehler) {
      var r = new FileReader();
      r.onload = function () { ok(String(r.result).replace(/^data:[^,]*,/, '')); };
      r.onerror = function () { fehler(r.error); };
      r.readAsDataURL(blob);
    });
  }
  var hinweisUhr = null;
  function hinweis(text, art) {
    var d = document.getElementById('brueckeHinweis');
    if (!d) {
      d = document.createElement('div'); d.id = 'brueckeHinweis'; d.setAttribute('role', 'status');
      d.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9999;max-width:90vw;' +
        'padding:10px 16px;border-radius:8px;font:15px/1.35 Inter,system-ui,sans-serif;color:#fff;box-shadow:0 2px 10px rgba(0,0,0,.25)';
      document.body.appendChild(d);
    }
    d.style.background = art === 'fehler' ? '#B3261E' : '#2D4B9B';
    d.textContent = text; d.style.display = '';
    clearTimeout(hinweisUhr);
    hinweisUhr = setTimeout(function () { d.style.display = 'none'; }, art === 'fehler' ? 15000 : 4000);
  }
  function warten(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
  function einmal(body) {
    var steuer = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (steuer) steuer.abort(); }, (B.zeitlimitSekunden || 20) * 1000);
    return fetch(ZIEL, {
      method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store', redirect: 'error',
      headers: { 'Content-Type': 'application/json', 'X-Messe-Token': token() }, body: body, signal: steuer ? steuer.signal : undefined
    }).then(function (r) {
      clearTimeout(t);
      return r.json().then(null, function () { return {}; }).then(function (j) { return { status: r.status, j: j }; });
    }, function () { clearTimeout(t); return { status: 0, j: {} }; });
  }
  var PAUSEN = [3000, 15000, 60000];
  function versuchen(body, n, nr) {
    return einmal(body).then(function (a) {
      if (a.status === 200 || a.status === 201) { hinweis('An Süsse übertragen: ' + nr, 'gut'); return 'gesendet'; }
      var nochmal = a.status === 0 || a.status === 429 || a.status >= 500;
      if (nochmal && n < (B.versuche || 4)) return warten(PAUSEN[Math.min(n - 1, PAUSEN.length - 1)]).then(function () { return versuchen(body, n + 1, nr); });
      hinweis('Nicht an Süsse übertragen (' + nr + (a.j && a.j.fehler ? ': ' + a.j.fehler : '') +
        '). Der Eintrag liegt sicher auf dem Tablet – bitte später über „Exportieren“ als Datei weitergeben.', 'fehler');
      return 'fehler';
    });
  }
  /* Gerätekennung des Tablets: derselbe Wert, den das Lieferanten-Formular nutzt (localStorage 'messe-app-geraet',
     angelegt von Lieferant.geraet()). Kunden-Nr. zählen je Tablet; erst mit dem Gerät sind sie am Server unterscheidbar.
     Nur in der Übertragung, nicht in der Tablet-Ablage und nicht im CSV (beides bleibt Freds Format). */
  function geraet() {
    try { if (window.Lieferant && window.Lieferant.geraet) return window.Lieferant.geraet(); } catch (e) { }
    try { var g = localStorage.getItem('messe-app-geraet') || ''; if (/^[A-Z2-9]{4}$/.test(g)) return g; } catch (e) { }
    return '';
  }
  /* formular: 'kunde' | 'lieferant'; daten: Ergebnis von datenBauen(); bild: Blob oder null. Wirft nie. */
  function senden(formular, daten, bild) {
    if (!B.aktiv || !ZIEL) return Promise.resolve('aus');
    if (formular === 'kunde' && daten) daten = Object.assign({}, daten, { geraet: geraet() }); // Kopie: Freds Objekt bleibt unberührt
    if (!token()) { hinweis('Übertragung an Süsse nicht eingerichtet (Token fehlt). Eintrag liegt auf dem Tablet.', 'fehler'); return Promise.resolve('ohne-token'); }
    var id = uuid(), nr = (daten && daten.nr) || '';
    return (bild ? base64(bild) : Promise.resolve(null)).then(function (b) {
      var body = JSON.stringify({ formular: formular, einreichung_id: id, daten: daten, bild: b ? { mime: bild.type || 'image/jpeg', daten: b } : null });
      return versuchen(body, 1, nr);
    }).then(null, function () { hinweis('Nicht an Süsse übertragen (' + nr + '). Eintrag liegt auf dem Tablet.', 'fehler'); return 'fehler'; });
  }
  tokenAusAdresse();
  window.Bruecke = { senden: senden, eingerichtet: function () { return !!token(); } };
})();
