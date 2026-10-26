(function () {
  var K = window.KONFIG;
  var Testnetz = { an: true, antwort: 'bestaetigt' };
  var warnung = '';
  var protokoll = [];
  function zwei(n) { return (n < 10 ? '0' : '') + n; }
  function zeitText(ms) {
    var d = new Date(ms);
    return zwei(d.getDate()) + '.' + zwei(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + zwei(d.getHours()) + ':' + zwei(d.getMinutes());
  }
  function istFehlend(v) { return !v || /^FEHLT/.test(String(v)); }
  function vertriebVerfuegbar(lang) {
    if (!K.vertrieb || !K.vertrieb.aktiv) return false;
    if (K.testmodus) return true;
    return vertriebPruefen(lang).length === 0;
  }
  function vertriebPruefen(lang) {
    var s = K.sprachen[lang] || {}, fehlt = [], tx = window.TEXTE[lang] || {}, namen = felderFuer(lang, 'vertrieb');
    if (istFehlend(s.formularVertrieb)) fehlt.push('Formular Vertrieb');
    ['email', 'quelle', 'sprache', 'anrede', 'vorname', 'nachname', 'einrichtung', 'bereich', 'interessen', 'land']
      .forEach(function (k) { if (istFehlend(namen[k])) fehlt.push('Feldname Vertrieb ' + k); });
    if (!tx.vertriebText || /Text folgt/.test(tx.vertriebText)) fehlt.push('Text Vertrieb');
    return fehlt;
  }
  function telPosVerfuegbar(lang) {
    if (!K.vertrieb || !K.vertrieb.telefonUndPosition || !vertriebVerfuegbar(lang)) return false;
    var tx = window.TEXTE[lang] || {};
    if (!tx.telefonLabel || !tx.positionLabel) return false;
    if (K.testmodus) return true;
    var namen = felderFuer(lang, 'vertrieb');
    return !istFehlend(namen.telefon) && !istFehlend(namen.position);
  }
  function vkVerfuegbar(lang) {
    var v = K.visitenkarte || {}, tx = window.TEXTE[lang] || {}, t = tx.dsTeile || {};
    return !!(v.aktiv && t.vkMit && t.vkOhne && tx.vkHinweis && tx.vkKnopf);
  }
  function gespraechAktiv() { return !!(K.gespraech && K.gespraech.aktiv); }
  function dsText(lang) {
    var tx = window.TEXTE[lang] || window.TEXTE.de, t = tx.dsTeile || {}, tp = telPosVerfuegbar(lang);
    var g = gespraechAktiv() ? tx.dsG : null;
    var s = String(tx.dsText || '')
      .replace('{{VERTRIEB_SATZ1}}', tp ? (t.vertriebSatz1Mit || '') : (t.vertriebSatz1Ohne || ''))
      .replace('{{VISITENKARTE}}', vkVerfuegbar(lang) ? (g ? g.b4 : (tp ? t.vkMit : t.vkOhne)) : '');
    if (g) {
      s = s.replace(g.vorB1, g.b1 + g.b2 + g.vorB1).replace(g.b3alt, g.b3).replace(g.b3endeAlt, g.b3endeAlt + ' ' + g.b3zusatz)
        .replace(g.b5alt, g.b5).replace(g.b6alt, g.b6);
    }
    return s;
  }
  function dsTitel(lang) {
    var tx = window.TEXTE[lang] || window.TEXTE.de;
    return gespraechAktiv() && tx.dsG ? tx.dsG.titel : tx.dsTitel;
  }
  function textKennung(lang) {
    var s = K.sprachen[lang];
    return vertriebVerfuegbar(lang) ? (s.textMitVertrieb || s.text) : s.text;
  }
  function quelle(lang, erfasstMs, offline, art) {
    var s = K.sprachen[lang];
    var doi = art === 'vertrieb' ? s.doiVertrieb : s.doi;
    return [K.messe, 'App ' + K.version, textKennung(lang), doi, 'erfasst ' + zeitText(erfasstMs)].join(' | ') + (offline ? ' | offline' : '');
  }
  function felderFuer(lang, art) {
    var s = K.sprachen[lang] || {}, f = {}, k;
    for (k in K.felder) f[k] = K.felder[k];
    if (art === 'vertrieb' && K.felderVertrieb) for (k in K.felderVertrieb) f[k] = K.felderVertrieb[k];
    if (s.felder) for (k in s.felder) f[k] = s.felder[k];
    return f;
  }
  function zielFuer(art, lang) {
    var s = K.sprachen[lang] || {};
    return art === 'vertrieb' ? s.formularVertrieb : s.formular;
  }
  function bereichText(eingabe) {
    var liste = Array.isArray(eingabe.bereich) ? eingabe.bereich : (eingabe.bereich ? [eingabe.bereich] : []);
    return liste.map(function (b) {
      var w = K.werte.bereich[b];
      if (!w) return '';
      if (b === 'sonstiges') {
        var t = String(eingabe.bereichSonst || '').replace(/\s+/g, ' ').trim().slice(0, 60).trim();
        return t ? w + ': ' + t : w;
      }
      return w;
    }).filter(Boolean).join(', ');
  }
  function felderBauen(eingabe, lang, erfasstMs, offline, art) {
    art = art || 'newsletter';
    var namen = felderFuer(lang, art), aus = {}, k;
    for (k in K.festeFelder) aus[k] = K.festeFelder[k];
    aus[namen.email] = (eingabe.email || '').trim();
    var freiwillig = {
      anrede: eingabe.anrede ? (K.werte.anrede[eingabe.anrede] || '') : '',
      vorname: (eingabe.vorname || '').trim(),
      nachname: (eingabe.nachname || '').trim(),
      einrichtung: (eingabe.einrichtung || '').trim(),
      bereich: bereichText(eingabe),
      interessen: (eingabe.interessen || []).map(function (i) { return K.werte.interessen[i]; }).filter(Boolean).join(', '),
      land: eingabe.land && window.Laender ? window.Laender.wert(eingabe.land) : ''
    };
    for (k in freiwillig) if (freiwillig[k]) aus[namen[k]] = freiwillig[k];
    if (art === 'vertrieb' && telPosVerfuegbar(lang)) {
      var tel = (eingabe.telefon || '').trim(), pos = (eingabe.position || '').trim();
      if (tel) aus[namen.telefon] = tel;
      if (pos) aus[namen.position] = pos;
    }
    aus[namen.quelle] = quelle(lang, erfasstMs, offline, art);
    aus[namen.sprache] = lang;
    return { art: art, ziel: zielFuer(art, lang), felder: aus };
  }
  function paketeBauen(eingabe, lang, erfasstMs, offline) {
    var p = [];
    if (eingabe.newsletter !== false) p.push(felderBauen(eingabe, lang, erfasstMs, offline, 'newsletter'));
    if (eingabe.vertrieb && vertriebVerfuegbar(lang)) p.push(felderBauen(eingabe, lang, erfasstMs, offline, 'vertrieb'));
    return p;
  }
  function sprachePruefen(lang) {
    var s = K.sprachen[lang], namen = felderFuer(lang, 'newsletter'), fehlt = [];
    if (!s) return ['Sprache unbekannt'];
    if (istFehlend(s.formular)) fehlt.push('Formular-Adresse');
    ['email', 'quelle', 'sprache'].forEach(function (k) { if (istFehlend(namen[k])) fehlt.push('Feldname ' + k); });
    ['anrede', 'vorname', 'nachname', 'einrichtung', 'bereich', 'interessen', 'land'].forEach(function (k) { if (istFehlend(namen[k])) fehlt.push('Feldname ' + k); });
    if (!s.freigegeben) fehlt.push('Freigabe Texte');
    if (!window.TEXTE[lang] || /fehlt noch/.test(window.TEXTE[lang].dsText)) fehlt.push('Datenschutzhinweis');
    else if (/<mark>|\{\{/.test(dsText(lang))) fehlt.push('Lücken im Datenschutzhinweis');
    return fehlt;
  }
  function angeboteneSprachen() {
    var liste = (K.messeSprachen || ['de', 'en', 'es', 'fr', 'it', 'nl']).filter(function (l) { return K.sprachen[l] && window.TEXTE[l]; });
    if (K.testmodus) return liste;
    return liste.filter(function (l) { return sprachePruefen(l).length === 0; });
  }
  function mitZeitlimit(p, ms) {
    return new Promise(function (ok, fehler) {
      var t = setTimeout(function () { fehler(new Error('Zeitlimit')); }, ms);
      p.then(function (x) { clearTimeout(t); ok(x); }, function (e) { clearTimeout(t); fehler(e); });
    });
  }
  var zuletztErreichbar = null;
  function erreichbar(lang) {
    if (K.testmodus) { zuletztErreichbar = Testnetz.an; return Promise.resolve(Testnetz.an); }
    var ziel = (K.sprachen[lang || K.standardSprache] || {}).formular;
    if (istFehlend(ziel)) { zuletztErreichbar = navigator.onLine; return Promise.resolve(navigator.onLine); }
    var adresse = new URL(ziel, location.href).origin + '/';
    return mitZeitlimit(fetch(adresse, { method: 'GET', mode: 'no-cors', credentials: 'omit', cache: 'no-store', redirect: 'follow' }), 6000)
      .then(function () { zuletztErreichbar = true; return true; }, function () { zuletztErreichbar = false; return false; });
  }
  function sendenRahmen(paket) {
    return new Promise(function (ok) {
      var name = 'versand' + Date.now() + Math.floor(Math.random() * 1000);
      var rahmen = document.createElement('iframe');
      rahmen.name = name; rahmen.style.display = 'none'; rahmen.setAttribute('aria-hidden', 'true');
      var form = document.createElement('form');
      form.method = 'POST'; form.action = paket.ziel; form.target = name; form.style.display = 'none';
      form.setAttribute('autocomplete', 'off');
      Object.keys(paket.felder).forEach(function (k) {
        var i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = paket.felder[k]; form.appendChild(i);
      });
      var fertig = false, abgeschickt = false;
      function ende(erg) {
        if (fertig) return; fertig = true; clearTimeout(t);
        setTimeout(function () { rahmen.remove(); form.remove(); }, 0);
        ok(erg);
      }
      rahmen.addEventListener('load', function () {
        if (!abgeschickt) return;
        var adresse = null;
        try { adresse = rahmen.contentWindow.location.href; } catch (e) { adresse = null; }
        if (adresse && adresse.indexOf(K.erfolgsseite) >= 0) {
          var zusatz = adresse.split(K.erfolgsseite)[1] || '';
          if (zusatz.replace(/^[?#]$/, '').length > 0) warnung = /%40|@/.test(zusatz) ? 'E-Mail-Adresse' : 'Daten';
          ende('bestaetigt');
        }
        else if (adresse === 'about:blank') return;
        else ende('unklar');
      });
      var t = setTimeout(function () { ende('unklar'); }, K.zeitlimitSekunden * 1000);
      document.body.appendChild(rahmen); document.body.appendChild(form);
      setTimeout(function () { abgeschickt = true; form.submit(); }, 0);
    });
  }
  function sendenAntwort(paket) {
    var body = new URLSearchParams();
    Object.keys(paket.felder).forEach(function (k) { body.append(k, paket.felder[k]); });
    return mitZeitlimit(fetch(paket.ziel, { method: 'POST', mode: 'no-cors', credentials: 'omit', cache: 'no-store', body: body }), K.zeitlimitSekunden * 1000)
      .then(function () { return 'bestaetigt'; }, function () { return 'fehler'; });
  }
  function senden(paket, lang) {
    if (K.testmodus) {
      protokoll.push({ zeit: Date.now(), art: paket.art, ziel: paket.ziel, felder: paket.felder, netz: Testnetz.an, antwort: Testnetz.an ? Testnetz.antwort : 'fehler' });
      if (protokoll.length > 20) protokoll.shift();
      return Promise.resolve(Testnetz.an ? Testnetz.antwort : 'fehler');
    }
    return erreichbar(lang).then(function (netz) {
      if (!netz) return 'fehler';
      return K.bestaetigung === 'weiterleitung' ? sendenRahmen(paket) : sendenAntwort(paket);
    });
  }
  function ablegen(eingabe, lang, erfasst, art, unklar) {
    var p = felderBauen(eingabe, lang, erfasst, true, art);
    return window.Speicher.ablegen({ lang: lang, art: p.art, ziel: p.ziel, felder: p.felder }, erfasst)
      .then(function (id) { return unklar ? window.Speicher.versuchZaehlen(id, true) : null; });
  }
  function anmelden(eingabe, lang) {
    var erfasst = Date.now();
    var pakete = paketeBauen(eingabe, lang, erfasst, false);
    var ergebnis = { art: 'online', unklar: false, anzahl: pakete.length, arten: pakete.map(function (p) { return p.art; }) };
    return erreichbar(lang).then(function (netz) {
      var kette = Promise.resolve();
      pakete.forEach(function (paket) {
        kette = kette.then(function () {
          if (!netz) { ergebnis.art = 'offline'; return ablegen(eingabe, lang, erfasst, paket.art, false); }
          return senden(paket, lang).then(function (erg) {
            if (erg === 'bestaetigt') return;
            if (erg === 'unklar') {
              ergebnis.unklar = true; return ablegen(eingabe, lang, erfasst, paket.art, true);
            }
            ergebnis.art = 'offline'; netz = false;
            return ablegen(eingabe, lang, erfasst, paket.art, false);
          });
        });
      });
      return kette.then(function () { return ergebnis; });
    });
  }
  var laeuft = false;
  function nachsenden() {
    if (laeuft) return Promise.resolve({ uebersprungen: true });
    laeuft = true;
    var bericht = { geloeschtAlt: 0, gesendet: 0, unklar: 0, fehler: 0, testVerworfen: 0 };
    var maxUnklar = K.bestaetigung === 'antwort' ? 1 : K.versucheBeiUnklarerAntwort;
    return window.Speicher.aufraeumen(K.hoechstdauerStunden).then(function (n) {
      bericht.geloeschtAlt = n;
      return window.Speicher.naechste(maxUnklar);
    }).then(function (liste) {
      var kette = Promise.resolve(true);
      liste.forEach(function (e) {
        kette = kette.then(function (weiter) {
          if (!weiter) return false;
          if (!K.testmodus && e.modus !== 'messe') {
            bericht.testVerworfen++;
            return window.Speicher.loeschen(e.id).then(function () { return true; });
          }
          var aktuell = zielFuer(e.daten.art || 'newsletter', e.daten.lang);
          var paket = { art: e.daten.art, ziel: istFehlend(aktuell) ? e.daten.ziel : aktuell, felder: e.daten.felder };
          return senden(paket, e.daten.lang).then(function (erg) {
            if (erg === 'bestaetigt') { bericht.gesendet++; return window.Speicher.loeschen(e.id).then(function () { return true; }); }
            if (erg === 'unklar') { bericht.unklar++; return window.Speicher.versuchZaehlen(e.id, true).then(function () { return true; }); }
            bericht.fehler++; return window.Speicher.versuchZaehlen(e.id, false).then(function () { return false; });
          });
        });
      });
      return kette;
    }).then(function () { laeuft = false; return bericht; }, function (err) { laeuft = false; throw err; });
  }
  window.Versand = {
    Testnetz: Testnetz,
    protokoll: protokoll,
    quelle: quelle,
    zeitText: zeitText,
    felderBauen: felderBauen,
    bereichText: bereichText,
    paketeBauen: paketeBauen,
    sprachePruefen: sprachePruefen,
    vertriebVerfuegbar: vertriebVerfuegbar,
    vertriebPruefen: vertriebPruefen,
    telPosVerfuegbar: telPosVerfuegbar,
    vkVerfuegbar: vkVerfuegbar,
    dsText: dsText,
    dsTitel: dsTitel,
    gespraechAktiv: gespraechAktiv,
    angeboteneSprachen: angeboteneSprachen,
    istFehlend: istFehlend,
    warnung: function () { return warnung; },
    erreichbar: erreichbar,
    zuletztErreichbar: function () { return zuletztErreichbar; },
    senden: senden,
    anmelden: anmelden,
    nachsenden: nachsenden
  };
})();
