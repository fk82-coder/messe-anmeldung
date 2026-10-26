(function () {
  var K = window.KONFIG, T = window.TEXTE, V = window.Versand, S = window.Speicher;
  var lang = K.standardSprache, leerTimer = null, dankeTimer = null, sendetGerade = false;
  var $ = function (id) { return document.getElementById(id); };
  var SPRACHEN = V.angeboteneSprachen();
  var flNr = 0;
  function flaggeSvg(l) {
    var id = 'uk' + (++flNr);
    var f = {
      de: '<svg viewBox="0 0 5 3" preserveAspectRatio="none"><rect width="5" height="1" fill="#000"/><rect y="1" width="5" height="1" fill="#DD0000"/><rect y="2" width="5" height="1" fill="#FFCE00"/></svg>',
      en: '<svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice"><clipPath id="' + id + '"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath><rect width="60" height="30" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#' + id + ')" stroke="#C8102E" stroke-width="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/></svg>',
      es: '<svg viewBox="0 0 3 2" preserveAspectRatio="none"><rect width="3" height="2" fill="#AA151B"/><rect y="0.5" width="3" height="1" fill="#F1BF00"/></svg>',
      fr: '<svg viewBox="0 0 3 2" preserveAspectRatio="none"><rect width="1" height="2" fill="#002395"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ED2939"/></svg>',
      it: '<svg viewBox="0 0 3 2" preserveAspectRatio="none"><rect width="1" height="2" fill="#009246"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#CE2B37"/></svg>',
      nl: '<svg viewBox="0 0 3 2" preserveAspectRatio="none"><rect width="3" height="2" fill="#21468B"/><rect width="3" height="1.333" fill="#fff"/><rect width="3" height="0.667" fill="#AE1C28"/></svg>'
    };
    return f[l];
  }
  function flaggenBauen() {
    document.querySelectorAll('[data-flaggen]').forEach(function (box) {
      box.innerHTML = SPRACHEN.map(function (l) {
        var unfertig = V.sprachePruefen(l).length > 0;
        return '<button class="fl" data-l="' + l + '" aria-label="' + T[l].sprachname + '">' + flaggeSvg(l) +
          (unfertig ? '<span class="flmarke">Entwurf</span>' : '') + '</button>';
      }).join('');
    });
  }
  function text(k) {
    if (k === 'dsText') return V.dsText(lang);
    return (T[lang] && T[lang][k] !== undefined) ? T[lang][k] : T.de[k];
  }
  function setzeSprache(l) {
    if (SPRACHEN.indexOf(l) < 0) l = SPRACHEN[0];
    lang = l;
    document.documentElement.lang = l;
    document.querySelectorAll('[data-t]').forEach(function (e) { e.innerHTML = text(e.getAttribute('data-t')); });
    document.querySelectorAll('.fl').forEach(function (b) { b.classList.toggle('an', b.getAttribute('data-l') === l); });
    landListeBauen();
    vertriebZeigen();
    vkZeigen();
    var fehlt = V.sprachePruefen(l);
    var m = $('rechtEntwurf');
    if (K.testmodus && fehlt.length) {
      var kurz = [];
      if (fehlt.some(function (f) { return /Formular|Feldname/.test(f); })) kurz.push('Formular-Adressen und Feldnamen');
      if (fehlt.indexOf('Datenschutzhinweis') >= 0) kurz.push('Datenschutzhinweis in dieser Sprache');
      if (fehlt.indexOf('Lücken im Datenschutzhinweis') >= 0) kurz.push('gelbe Lücken im Datenschutzhinweis');
      if (fehlt.indexOf('Freigabe Texte') >= 0) kurz.push('Freigabe der Texte');
      if (fehlt.indexOf('Text Vertrieb') >= 0) kurz.push('Text der Vertriebs-Einwilligung');
      m.textContent = 'TESTMODUS – ' + T[l].rechtStand + '. Für den Messebetrieb fehlt: ' + kurz.join('; ') + '.';
      m.classList.add('an');
    } else { m.textContent = ''; m.classList.remove('an'); }
  }
  function zeige(id) {
    document.querySelectorAll('.seite').forEach(function (s) { s.classList.toggle('aktiv', s.id === id); });
    if (id === 'formular') { netzPruefen(); if (window.innerWidth >= 760 && window.innerHeight > 500) setTimeout(function () { $('f_email').focus(); }, 60); }
    if (id === 'start') { zaehlerZeigen(); }
    leerlauf();
  }
  function landListeBauen() {
    var sel = $('f_land'), alt = sel.value, L = window.Laender.liste(lang);
    function opt(v, t) { var o = document.createElement('option'); o.value = v; o.textContent = t; return o; }
    sel.innerHTML = '';
    sel.appendChild(opt('', text('landWaehlen')));
    var g1 = document.createElement('optgroup'); g1.label = text('landOben');
    L.oben.forEach(function (x) { g1.appendChild(opt(x.code, x.name)); });
    var g2 = document.createElement('optgroup'); g2.label = text('landAlle');
    L.rest.forEach(function (x) { g2.appendChild(opt(x.code, x.name)); });
    g2.appendChild(opt(window.Laender.ANDERES, text('landAnderes')));
    sel.appendChild(g1); sel.appendChild(g2);
    sel.value = alt || '';
  }
  function vertriebAn() { return V.vertriebVerfuegbar(lang); }
  function vertriebZeigen() {
    $('vertriebBox').classList.toggle('an', vertriebAn());
    if (!vertriebAn()) $('f_vertrieb').checked = false;
    $('senden').innerHTML = text(vertriebAn() ? 'knopfV3' : 'knopf');
    document.querySelector('.unter-knopf').innerHTML = text(vertriebAn() ? 'unterKnopfV3' : 'unterKnopf');
  }
  $('f_vertrieb').addEventListener('change', pruefen);
  function leeren() {
    vkAbbrechen();
    vkMeldung('');
    ['f_email', 'f_vorname', 'f_nachname', 'f_einrichtung', 'f_telefon', 'f_position'].forEach(function (i) { $(i).value = ''; $(i).classList.remove('ok'); $(i).classList.remove('vorschlag'); });
    document.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('an'); c.setAttribute('aria-pressed', 'false'); });
    $('f_land').value = '';
    bereichSonstZeigen();
    $('f_vertrieb').checked = false;
    document.querySelectorAll('.formular-inhalt, .spalte-angaben, .spalte-einwilligung, .einw-rollen').forEach(function (s) { s.scrollTop = 0; });
    $('f_haken').checked = false;
    $('emailFehler').classList.remove('an');
    emailMarkeWeg();
    $('testUebertragung').innerHTML = ''; $('testUebertragung').classList.remove('an');
    datenschutz(false);
    pruefen();
  }
  function neu() {
    clearInterval(dankeTimer);
    leeren();
    setzeSprache(K.standardSprache);
    zeige('start');
    neuLadenWennRuhig();
  }
  var neueFassung = false;
  function neuLadenWennRuhig() {
    if (!neueFassung || sendetGerade || !$('start').classList.contains('aktiv') || lang !== K.standardSprache) return;
    neueFassung = false;
    location.reload();
  }
  function leerlauf() {
    clearTimeout(leerTimer);
    leerTimer = setTimeout(function () {
      if (!$('start').classList.contains('aktiv') || lang !== K.standardSprache) neu();
    }, K.leerlaufSekunden * 1000);
  }
  ['pointerdown', 'keydown', 'input'].forEach(function (t) { document.addEventListener(t, leerlauf, true); });
  var kameraAussen = false, kameraAussenUhr = null;
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && !sendetGerade) {
      if (kameraAussen || vkWache) { clearTimeout(kameraAussenUhr); kameraAussenUhr = setTimeout(function () { kameraAussen = false; neu(); }, 120000); }
      else neu();
    } else { clearTimeout(kameraAussenUhr); wachHalten(); }
  });
  function emailOk(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }
  function nurVertriebMoeglich() { return vertriebAn(); }
  function pruefen() {
    var e = $('f_email'), ok = emailOk(e.value);
    e.classList.toggle('ok', ok);
    var haken = $('f_haken').checked || (nurVertriebMoeglich() && $('f_vertrieb').checked);
    $('senden').disabled = !(ok && haken) || sendetGerade;
  }
  $('f_email').addEventListener('input', function () { $('emailFehler').classList.remove('an'); pruefen(); });
  $('f_email').addEventListener('blur', function () { var v = $('f_email').value; $('emailFehler').classList.toggle('an', v.length > 0 && !emailOk(v)); });
  $('f_haken').addEventListener('change', pruefen);
  document.querySelectorAll('.chips').forEach(function (g) {
    g.addEventListener('click', function (ev) {
      var c = ev.target.closest('.chip'); if (!c) return;
      var war = c.classList.contains('an');
      if (!g.classList.contains('mehrfach')) {
        g.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('an'); x.setAttribute('aria-pressed', 'false'); });
      }
      c.classList.toggle('an', !war); c.setAttribute('aria-pressed', war ? 'false' : 'true');
      if (g.getAttribute('data-gruppe') === 'bereich') bereichSonstZeigen();
    });
  });
  function bereichSonstZeigen() {
    var an = !!document.querySelector('.chips[data-gruppe="bereich"] .chip[data-wert="sonstiges"].an');
    $('bereichSonstBox').classList.toggle('an', an);
    if (!an) $('f_bereich_sonst').value = '';
  }
  function chipWert(gruppe) {
    var c = document.querySelector('.chips[data-gruppe="' + gruppe + '"] .chip.an');
    return c ? c.getAttribute('data-wert') : '';
  }
  function chipWerte(gruppe) {
    return Array.prototype.map.call(document.querySelectorAll('.chips[data-gruppe="' + gruppe + '"] .chip.an'), function (c) { return c.getAttribute('data-wert'); });
  }
  function istTextfeld(e) { return !!e && e.tagName === 'INPUT' && /^(text|email|tel|search|url|number)$/.test(e.type); }
  function cursorZeigen() {
    var a = document.activeElement;
    if (istTextfeld(a)) a.scrollIntoView({ block: 'center', inline: 'nearest' });
  }
  document.addEventListener('focusin', function (ev) {
    if (!istTextfeld(ev.target)) return;
    document.body.classList.add('tippt');
    setTimeout(cursorZeigen, 350);
  });
  document.addEventListener('focusout', function () {
    setTimeout(function () { if (!istTextfeld(document.activeElement)) document.body.classList.remove('tippt'); }, 60);
  });
  var letzteHoehe = window.innerHeight;
  function hoeheGeaendert() {
    var h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    var kleiner = h < letzteHoehe - 40;
    letzteHoehe = h;
    if (kleiner) setTimeout(cursorZeigen, 120);
  }
  window.addEventListener('resize', hoeheGeaendert);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', hoeheGeaendert);
  var reihe = ['f_email', 'f_vorname', 'f_nachname', 'f_einrichtung'];
  reihe.forEach(function (id, i) {
    $(id).addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter') return;
      ev.preventDefault();
      if (i < reihe.length - 1) $(reihe[i + 1]).focus(); else $('f_haken').focus();
    });
  });
  $('f_haken').addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') { ev.preventDefault(); if (!$('senden').disabled) absenden(); }
  });
  function netzPruefen() {
    return V.erreichbar(lang).then(function (netz) {
      $('offlineVor').classList.toggle('an', !netz);
      testleisteZeigen();
      return netz;
    });
  }
  setInterval(function () { if ($('formular').classList.contains('aktiv')) netzPruefen(); }, 20000);
  function absenden() {
    if (sendetGerade) return;
    var vertrieb = vertriebAn() && $('f_vertrieb').checked;
    if (!emailOk($('f_email').value) || !($('f_haken').checked || (vertrieb && nurVertriebMoeglich()))) return;
    sendetGerade = true; pruefen();
    var mitTelPos = vertrieb && V.telPosVerfuegbar(lang);
    var eingabe = {
      email: $('f_email').value, anrede: chipWert('anrede'), vorname: $('f_vorname').value,
      nachname: $('f_nachname').value, einrichtung: $('f_einrichtung').value, bereich: chipWerte('bereich'),
      bereichSonst: $('bereichSonstBox').classList.contains('an') ? $('f_bereich_sonst').value : '',
      interessen: chipWerte('interessen'), land: $('f_land').value,
      telefon: mitTelPos ? $('f_telefon').value : '', position: mitTelPos ? $('f_position').value : '',
      newsletter: $('f_haken').checked, vertrieb: vertrieb
    };
    zeige('sendet');
    V.anmelden(eingabe, lang).then(function (erg) {
      eingabe = null;
      leeren();
      $('dankeOnline').style.display = erg.art === 'online' ? '' : 'none';
      $('dankeOffline').style.display = erg.art === 'offline' ? '' : 'none';
      $('dankeZwei').style.display = erg.anzahl > 1 ? '' : 'none';
      $('off2').style.display = erg.anzahl > 1 ? 'none' : '';
      if (K.testmodus) testUebertragungZeigen(erg);
      sendetGerade = false;
      zeige('danke');
      zaehlerZeigen();
      var n = K.dankeSekunden; $('countdown').textContent = n;
      clearInterval(dankeTimer);
      dankeTimer = setInterval(function () { n--; $('countdown').textContent = n; if (n <= 0) neu(); }, 1000);
    }, function () {
      sendetGerade = false; leeren(); neu();
    });
  }
  $('senden').addEventListener('click', absenden);
  $('los').addEventListener('click', function () { zeige('formular'); });
  document.addEventListener('click', function (ev) {
    var fl = ev.target.closest('.fl');
    if (fl) { setzeSprache(fl.getAttribute('data-l')); return; }
    var a = ev.target.closest('[data-aktion]'); if (!a) return;
    var w = a.getAttribute('data-aktion');
    if (w === 'neu') neu();
    if (w === 'datenschutz') datenschutz(true);
    if (w === 'datenschutz-zu') datenschutz(false);
    if (w === 'vk-abbrechen') vkAbbrechen();
  });
  $('datenschutz').addEventListener('click', function (ev) { if (ev.target === $('datenschutz')) datenschutz(false); });
  function datenschutz(an) { $('datenschutz').classList.toggle('an', an); }
  var VK = window.Visitenkarte, vkLaufNr = 0;
  var VK_ZIELE = { email: 'f_email', vorname: 'f_vorname', nachname: 'f_nachname', einrichtung: 'f_einrichtung', telefon: 'f_telefon', position: 'f_position' };
  function vkAn() { return !!VK && V.vkVerfuegbar(lang) && typeof WebAssembly === 'object' && 'createImageBitmap' in window; }
  function vkZeigen() {
    $('vkBox').classList.toggle('an', vkAn());
    var tp = V.telPosVerfuegbar(lang);
    $('telPos').classList.toggle('an', tp);
    if (!tp) ['f_telefon', 'f_position'].forEach(function (i) { $(i).value = ''; $(i).classList.remove('vorschlag'); });
  }
  function vkMeldung(t, warn) {
    var m = $('vkMeldung');
    m.textContent = t || ''; m.classList.toggle('an', !!t); m.classList.toggle('warn', !!warn);
  }
  function vkKameraZu() {
    if (VK) VK.kameraSchliessen($('vkVideo'));
    $('vkKamera').classList.remove('an'); $('vkAusloeser').disabled = true;
  }
  function vkAbbrechen() {
    vkLaufNr++;
    vkKameraZu();
    $('vkLesen').classList.remove('an');
    kameraAussen = false; $('vkDatei').value = '';
    vkWacheEnde();
    if (VK) VK.beenden();
  }
  var IN_APP = !!VK && VK.inAppBrowser(navigator.userAgent);
  function vkImBrowser() {
    vkWacheEnde();
    kameraAussen = false; clearTimeout(kameraAussenUhr);
    if (VK) VK.beenden();
    vkMeldung(text('vkImBrowser'), true);
  }
  var vkWache = null;
  function vkWacheEnde() {
    if (!vkWache) return;
    clearTimeout(vkWache.uhr); clearTimeout(vkWache.schluss);
    window.removeEventListener('blur', vkWache.auf); window.removeEventListener('pagehide', vkWache.auf);
    document.removeEventListener('visibilitychange', vkWache.sicht);
    vkWache = null;
  }
  function vkWachen() {
    vkWacheEnde();
    var w = { hinweis: false };
    w.auf = function () {
      if (w.hinweis && $('vkMeldung').textContent === text('vkImBrowser')) vkMeldung('');
      if (w.hinweis) kameraAussen = true;
      vkWacheEnde();
    };
    w.sicht = function () { if (document.hidden) w.auf(); };
    w.uhr = setTimeout(function () {
      w.hinweis = true; kameraAussen = false; VK.beenden();
      vkMeldung(text('vkImBrowser'), true);
    }, 2000);
    w.schluss = setTimeout(vkWacheEnde, 30000);
    window.addEventListener('blur', w.auf); window.addEventListener('pagehide', w.auf);
    document.addEventListener('visibilitychange', w.sicht);
    vkWache = w;
  }
  function vkDateiWeg() {
    if (IN_APP) { vkImBrowser(); return; }
    try { kameraAussen = true; $('vkDatei').value = ''; $('vkDatei').click(); vkWachen(); }
    catch (e) { kameraAussen = false; VK.beenden(); vkMeldung(text('vkKeineKamera'), true); }
  }
  var kameraInSeiteGesperrt = false;
  function vkStarten() {
    if (!vkAn()) return;
    vkAbbrechen(); vkMeldung('');
    VK.vorwaermen().catch(function () { });
    if (!VK.kameraMoeglich() || kameraInSeiteGesperrt) { vkDateiWeg(); return; }
    var nr = vkLaufNr;
    $('vkKamera').classList.add('an');
    VK.kameraOeffnen($('vkVideo')).then(function () {
      if (nr !== vkLaufNr) { VK.kameraSchliessen($('vkVideo')); return; }
      $('vkAusloeser').disabled = false;
    }, function () {
      if (nr !== vkLaufNr) return;
      vkKameraZu();
      kameraInSeiteGesperrt = true;
      if (IN_APP) vkImBrowser();
      else if (!navigator.userActivation || navigator.userActivation.isActive) vkDateiWeg();
      else vkMeldung(text('vkNochmal'), true);
    });
  }
  $('vkKnopf').addEventListener('click', vkStarten);
  $('vkAusloeser').addEventListener('click', function () {
    var bild;
    try { bild = VK.ausVideo($('vkVideo'), $('vkRahmen')); } catch (e) { bild = null; }
    vkKameraZu();
    if (!bild) { VK.beenden(); vkMeldung(text('vkSchlecht'), true); return; }
    vkLesen(bild);
  });
  function vkKameraWarDa() {
    if ($('vkMeldung').textContent === text('vkImBrowser')) vkMeldung('');
    vkWacheEnde();
  }
  $('vkDatei').addEventListener('change', function () {
    vkKameraWarDa();
    kameraAussen = false; clearTimeout(kameraAussenUhr);
    var f = this.files && this.files[0];
    this.value = '';
    if (!f) { VK.beenden(); return; }
    var nr = vkLaufNr;
    $('vkLesen').classList.add('an');
    VK.ausDatei(f).then(function (bild) { f = null; if (nr !== vkLaufNr) { VK._verwerfen(bild); return; } vkLesen(bild); },
      function () { f = null; $('vkLesen').classList.remove('an'); VK.beenden(); vkMeldung(text('vkSchlecht'), true); });
  });
  $('vkDatei').addEventListener('cancel', function () { vkKameraWarDa(); kameraAussen = false; clearTimeout(kameraAussenUhr); VK.beenden(); });
  function vkLesen(bild) {
    var nr = vkLaufNr;
    $('vkLesen').classList.add('an');
    VK.erkennen(bild, { mitTelPos: V.telPosVerfuegbar(lang), zeitlimitSekunden: (K.visitenkarte || {}).zeitlimitSekunden }).then(function (erg) {
      if (nr !== vkLaufNr) return;
      $('vkLesen').classList.remove('an');
      vkUebernehmen(erg.felder);
      erg = null;
    }, function () {
      if (nr !== vkLaufNr) return;
      $('vkLesen').classList.remove('an');
      vkMeldung(text('vkSchlecht'), true);
    });
  }
  function vkUebernehmen(f) {
    var n = 0, tp = V.telPosVerfuegbar(lang);
    Object.keys(VK_ZIELE).forEach(function (k) {
      var el = $(VK_ZIELE[k]);
      if (!f[k]) return;
      if ((k === 'telefon' || k === 'position') && !tp) return;
      if (el.value && !el.classList.contains('vorschlag')) return;
      el.value = f[k]; el.classList.add('vorschlag'); n++;
    });
    pruefen();
    if (!n) vkMeldung(text('vkSchlecht'), true);
    else if (!f.email) vkMeldung(text('vkOhneEmail'), true);
    else vkMeldung(text('vkPruefen'));
    emailMarkieren();
  }
  function emailMarkieren() {
    var e = $('f_email');
    if (e.value && !e.classList.contains('vorschlag')) { emailMarkeWeg(); return; }
    e.classList.add('pruefen');
    var h = $('emailPruefen'), k = e.value ? 'vkEmailPruefen' : 'vkEmailEintippen';
    h.setAttribute('data-t', k);
    h.textContent = text(k);
    h.classList.add('an');
  }
  function emailMarkeWeg() {
    var h = $('emailPruefen');
    $('f_email').classList.remove('pruefen'); h.classList.remove('an'); h.removeAttribute('data-t'); h.textContent = '';
  }
  $('f_email').addEventListener('input', emailMarkeWeg);
  Object.keys(VK_ZIELE).forEach(function (k) { $(VK_ZIELE[k]).addEventListener('input', function () { this.classList.remove('vorschlag'); }); });
  function zaehlerZeigen() {
    return S.anzahl().then(function (n) {
      $('wartend').textContent = n > 0 ? ('Standteam: ' + n + (n === 1 ? ' Anmeldung wartet' : ' Anmeldungen warten')) : '';
      var w = V.warnung();
      $('warnung').textContent = w ? ('Technik: Rückmeldung enthält ' + w + ' – bitte Technik informieren') : '';
      $('warnung').classList.toggle('an', !!w);
      return n;
    });
  }
  function nachsenden() {
    return S.anzahl().then(function (n) {
      if (n === 0) return;
      return V.nachsenden().then(zaehlerZeigen);
    }).catch(function () {  });
  }
  window.addEventListener('online', function () { setTimeout(nachsenden, 1500); });
  setInterval(nachsenden, K.nachsendenSekunden * 1000);
  function testleisteZeigen() {
    var l = $('testleiste');
    if (!K.testmodus) { l.classList.remove('an'); return; }
    l.classList.add('an');
    l.innerHTML = '<span>TESTMODUS<span class="tl-lang"> – nichts geht an CleverReach</span></span> ' +
      '<button id="tNetz" class="' + (V.Testnetz.an ? '' : 'aus') + '">Netz (gespielt): ' + (V.Testnetz.an ? 'an' : 'AUS') + '</button>' +
      '<button id="tSenden">Jetzt nachsenden</button>' +
      '<span class="tl-mass">Bildschirm ' + window.innerWidth + '×' + window.innerHeight + ' · Pixel ×' + (window.devicePixelRatio || 1) + '</span>';
    $('tNetz').onclick = function () { V.Testnetz.an = !V.Testnetz.an; netzPruefen(); if (V.Testnetz.an) nachsenden(); };
    $('tSenden').onclick = function () { V.nachsenden().then(zaehlerZeigen); };
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function testUebertragungZeigen(erg) {
    var b = $('testUebertragung'), p = V.protokoll[V.protokoll.length - 1];
    var kopf = erg.art === 'offline'
      ? '<b>Testmodus:</b> kein Netz (gespielt) – verschlüsselt zwischengespeichert, nichts gesendet.'
      : '<b>Testmodus:</b> Das würde jetzt an CleverReach gehen (nichts wurde gesendet):';
    var zeilen = '';
    if (erg.art === 'online' && p) {
      zeilen = V.protokoll.slice(-(erg.anzahl || 1)).map(function (q) {
        return '<tr><td>Ziel (' + esc(q.art || '') + ')</td><td>' + esc(q.ziel) + '</td></tr>' +
          Object.keys(q.felder).map(function (k) { return '<tr><td>' + esc(k) + '</td><td>' + esc(q.felder[k]) + '</td></tr>'; }).join('');
      }).join('');
    }
    b.innerHTML = kopf + (zeilen ? '<table>' + zeilen + '</table>' : '');
    b.classList.add('an');
  }
  var sperre = null;
  function wachHalten() {
    if (!('wakeLock' in navigator) || document.hidden) return;
    navigator.wakeLock.request('screen').then(function (s) { sperre = s; }).catch(function () {});
  }
  function nichtEingerichtetZeigen() {
    $('fehltListe').textContent = V.sprachePruefen(K.standardSprache).join(', ') || '–';
    document.querySelectorAll('#fuss [data-t="nichts"]').forEach(function (e) { e.innerHTML = text('nichts'); });
    document.querySelectorAll('.seite').forEach(function (s) { s.classList.toggle('aktiv', s.id === 'nichtEingerichtet'); });
  }
  function starten() {
    $('version').textContent = 'v' + K.version + (K.testmodus ? ' TEST' : '');
    $('versionHandy').textContent = $('version').textContent;
    $('testHinweis').classList.toggle('an', !!K.testmodus);
    if (!K.testmodus && V.sprachePruefen(K.standardSprache).length) { nichtEingerichtetZeigen(); return; }
    flaggenBauen();
    setzeSprache(K.standardSprache);
    testleisteZeigen();
    S.aufraeumen(K.hoechstdauerStunden).then(zaehlerZeigen).then(nachsenden);
    wachHalten();
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      var hatteSteuerung = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (!hatteSteuerung) { hatteSteuerung = true; return; }
        neueFassung = true; neuLadenWennRuhig();
      });
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(function () {});
    }
    ansichtAusAdresse();
  }
  function ansichtAusAdresse() {
    var q = {};
    location.hash.replace(/^#/, '').split('&').forEach(function (p) { var a = p.split('='); if (a[0]) q[a[0]] = decodeURIComponent(a[1] || '1'); });
    if (!K.testmodus) { zeige('start'); return; }
    if (q.s === 'nichteingerichtet') { nichtEingerichtetZeigen(); return; }
    if (q.netz === 'aus') V.Testnetz.an = false;
    if (q.lang) setzeSprache(q.lang);
    if (q.demo) {
      $('f_email').value = 'max.muster@example.com'; $('f_vorname').value = 'Max'; $('f_nachname').value = 'Muster';
      $('f_einrichtung').value = 'Tierarztpraxis Beispiel (Testdaten)';
      document.querySelector('.chips[data-gruppe="anrede"] .chip[data-wert="herr"]').classList.add('an');
    }
    if (q.mehr) {
      (q.bereich ? q.bereich.split(',') : ['tiermedizin']).forEach(function (w) {
        var c = document.querySelector('.chips[data-gruppe="bereich"] .chip[data-wert="' + w + '"]');
        if (c) { c.classList.add('an'); c.setAttribute('aria-pressed', 'true'); }
      });
      bereichSonstZeigen();
      if (q.sonst && $('bereichSonstBox').classList.contains('an')) $('f_bereich_sonst').value = q.sonst.slice(0, 60);
      ['versand', 'patho'].forEach(function (w) { document.querySelector('.chips[data-gruppe="interessen"] .chip[data-wert="' + w + '"]').classList.add('an'); });
      $('f_land').value = 'DE';
    }
    if (q.vertrieb && vertriebAn()) $('f_vertrieb').checked = true;
    if (q.nurvertrieb) { $('f_haken').checked = false; }
    if (q.haken) $('f_haken').checked = true;
    pruefen();
    if (q.s === 'danke' || q.s === 'dankeoffline') {
      var off = q.s === 'dankeoffline';
      $('dankeOnline').style.display = off ? 'none' : ''; $('dankeOffline').style.display = off ? '' : 'none';
      zeige('danke');
      return;
    }
    if (q.s === 'absenden') { zeige('formular'); setTimeout(absenden, 300); return; }
    zeige(q.s || 'start');
    if (q.ds) datenschutz(true);
    if (q.vk === 'kamera') vkStarten();
    if (q.vk === 'liest') $('vkLesen').classList.add('an');
    if (q.vk === 'schlecht') vkMeldung(text('vkSchlecht'), true);
    if (q.vk === 'vorschlag') vkUebernehmen({ email: 'max.muster@example.com', vorname: 'Max', nachname: 'Muster', einrichtung: 'Tierklinik Beispielstadt GmbH', telefon: '+49 5603 000-12', position: 'Fachtierarzt für Pathologie · Leitung Labor' });
    if (q.vk === 'ohneemail') vkUebernehmen({ email: '', vorname: 'Max', nachname: 'Muster', einrichtung: 'Tierklinik Beispielstadt GmbH', telefon: '+49 5603 000-12', position: 'Fachtierarzt für Pathologie · Leitung Labor' });
    if (q.vk === 'echt' &&/^karte-[\w-]+\.jpg$/.test(q.bild || '')) {
      VK.vorwaermen().catch(function () { });
      fetch('test/karten/' + q.bild).then(function (r) { return r.blob(); }).then(VK.ausDatei).then(vkLesen, function () { vkMeldung(text('vkSchlecht'), true); });
    }
    testleisteZeigen();
  }
  starten();
})();
