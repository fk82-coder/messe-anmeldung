(function () {
  var K = window.KONFIG;
  var BASIS = new URL('../', (document.currentScript && document.currentScript.src) || location.href).href;
  var DATEIEN = ['lib/tesseract-7.0.0/tesseract.min.js', 'lib/tesseract-7.0.0/worker.min.js', 'lib/tesseract-7.0.0/stumm-worker.js',
    'lib/tesseract-7.0.0/tesseract-core-simd-lstm.js', 'lib/tesseract-7.0.0/tesseract-core-simd-lstm.wasm',
    'lib/tessdata-fast-4.1.0/deu.traineddata.gz', 'lib/tessdata-fast-4.1.0/eng.traineddata.gz'];
  var PFAD = {
    programm: BASIS + 'lib/tesseract-7.0.0/tesseract.min.js',
    worker:   BASIS + 'lib/tesseract-7.0.0/stumm-worker.js',
    kern:     BASIS + 'lib/tesseract-7.0.0/tesseract-core-simd-lstm.js',
    sprachen: BASIS + 'lib/tessdata-fast-4.1.0'
  };
  function einst() { return K.visitenkarte || {}; }
  var TITEL = ['prof', 'dr', 'med', 'vet', 'rer', 'nat', 'dent', 'dipl', 'ing', 'phd', 'msc', 'bsc', 'mba', 'md', 'dvm', 'mag',
    'univ', 'habil', 'dipling', 'diplbiol', 'diplchem', 'drmed', 'drmedvet', 'drrernat', 'frau', 'herr', 'mr', 'mrs', 'ms', 'miss', 'sen', 'jun', 'ba', 'ma', 'priv', 'doz', 'pd', 'biol', 'chem', 'oec', 'mult',
    'jr', 'sr', 'ii', 'iii', 'iv'];
  var PARTIKEL = ['von', 'van', 'de', 'der', 'den', 'zu', 'zum', 'zur', 'del', 'della', 'da', 'di', 'du', 'la', 'le', 'ten', 'ter', 'vom'];
  var RECHTSFORM = /\b(GmbH|GMBH|Gmbh|gGmbH|mbH|AG|KG|KGaA|OHG|GbR|PartG|e\.\s?V\.|eG|Ltd\.?|LTD\.?|Limited|LIMITED|Inc\.?|INC\.?|LLC|Corp\.?|CORP\.?|S\.A\.|S\.L\.|S\.r\.l\.|SpA|S\.p\.A\.|B\.V\.|N\.V\.|SE|SAS|plc|PLC)(?=$|[\s,.;)])/;
  var EINRICHTUNG = /(praxis|klinik|klinikum|kliniken|tierarzt|tierärzt|labor\b|labore|laboratori|laborator|institut|universit|hochschule|hospital|krankenhaus|clinic|zentrum|center|centre|\bmvz\b|patholog|veterin|medizin|diagnosti|biotech|pharma|forschung|research|stiftung|foundation|gesundheit|health|apotheke|pharmacy|amt\b|behörde|ministerium|university|college|school|schule)/i;
  var POSITION = /(leiter|leiterin|leitung|head\b|director|direktor|manager|geschäftsführ|geschaeftsfuehr|inhaber|owner|\bceo\b|\bcfo\b|\bcoo\b|\bcto\b|chefarzt|oberarzt|oberärzt|fachtierarzt|fachtierärzt|facharzt|fachärzt|tierärztin|assistent|assistant|einkauf|purchas|procurement|beschaffung|vertrieb|\bsales\b|technolog|\bmta\b|\bmtla\b|\btfa\b|biolog|chemiker|scientist|researcher|wissenschaftl|professor|consultant|berater|referent|sachbearbeit|koordinator|coordinator|officer|specialist|spezialist|engineer|ingenieur|laborant|präsident|president|vorstand|partner|gesellschafter|prokurist|abteilung|department|bereich\b|team ?lead)/i;
  var ANSCHRIFT_PLZ = /\b(D-|A-|CH-)?\d{4,5}\s+[A-ZÄÖÜ][a-zäöüß]/;
  var ANSCHRIFT_STRASSE = /(straße|strasse|str\.|\bweg\b|platz|allee|gasse|\bring\b|damm|ufer|chaussee|\broad\b|\bstreet\b|\bavenue\b|\blane\b|\bdrive\b|\bpostfach\b|\bp\.?o\.? box\b)/i;
  var UK_POSTLEITZAHL = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/;
  var WEB = /(www\.|https?:|\.(de|com|org|net|eu|at|ch|nl|fr|it|es|uk)\b)/i;
  var FAX = /(fax|telefax|\bF\b\s*[:.]?\s*\+?\d)/i;
  var TELEFON_ZEICHEN = /(tel|fon|phone|telefon|mobil|mobile|handy|cell|\bT\b|\bM\b|\bP\b)\s*[.:]?\s*\+?\(?\d/i;
  var NUMMER = /\+?\(?\d[\d\s()\/.\-–]{5,}\d/;
  var ALLGEMEIN = /^(info|kontakt|contact|office|mail|email|service|sales|vertrieb|labor|lab|empfang|praxis|team|hello|hallo|admin|post|zentrale|anfrage|bestellung|order|einkauf|purchasing)$/i;
  function ziffern(s) { return (s.match(/\d/g) || []).length; }
  function umlautFrei(s) { return s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z]/g, ''); }
  function gross(s) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }
  var SPALTE = '     ';
  function symbolWeg(s) {
    var w = String(s || '').trim().split(/\s+/), alt;
    do {
      alt = w.length;
      if (w.length > 1 && !/[A-Za-z0-9ÄÖÜäöüßÀ-ÿ]/.test(w[0]) && !/^[+(]/.test(w[0])) w.shift();
      else if (w.length > 1 && /^[A-Za-zÀ-ÿ]$/.test(w[0]) && !/^[TMFPEWtmfpew]$/.test(w[0]) && /^(\+|\(|\d|www\.|\S+@)/i.test(w[1])) w.shift();
    } while (w.length < alt);
    return w.join(' ');
  }
  var RECHTSFORM_ALLE = new RegExp(RECHTSFORM.source, 'g');
  function nurRechtsform(s) {
    return RECHTSFORM.test(s) && !s.replace(RECHTSFORM_ALLE, '').replace(/&|\+|\bCo\b\.?|\bund\b|\band\b|[,.\s]/gi, '');
  }
  function zerlegen(text) {
    var aus = [];
    String(text || '').replace(/\r/g, '').split('\n').forEach(function (z) {
      var spalten = z.replace(/\t/g, SPALTE).split(/ {3,}/).map(function (s) { return symbolWeg(s.replace(/\s+/g, ' ')); }).filter(Boolean);
      if (!spalten.length) return;
      aus.push({ zeile: spalten.join(SPALTE), spalten: spalten, teile: [] });
    });
    aus.forEach(function (x, i) {
      x.spalten = x.spalten.filter(function (s) {
        if (i === 0 || !nurRechtsform(s)) return true;
        var oben = aus[i - 1], k = oben.spalten.length - 1, o = oben.spalten[k];
        if (!o || nurRechtsform(o) || /\d|@/.test(o) || istWeb(o)) return true;
        oben.spalten[k] = o + ' ' + s; oben.zeile = oben.spalten.join(SPALTE);
        return false;
      });
      x.zeile = x.spalten.join(SPALTE);
    });
    aus = aus.filter(function (x) { return x.spalten.length; });
    aus.forEach(function (x) {
      x.spalten.forEach(function (s) {
        s.split(/\s+[·•|∙◦®«»*]\s+|\s+[-–—]\s+/).forEach(function (t) { t = t.trim(); if (t) x.teile.push(t); });
      });
    });
    return aus;
  }
  var ENDUNG_LANG = /^(example|museum|agency|company|digital|online|solutions|services|systems|network|technology|international|consulting|management|clinic|dental|academy|training|software|science|berlin|hamburg|koeln|cologne|bayern|saarland|tirol|vlaanderen|brussels|amsterdam|london|paris|madrid|barcelona|zuerich)$/;
  var FREEMAIL = /^(gmail|googlemail|gmx|web|yahoo|outlook|hotmail|live|msn|icloud|me|aol|tonline|freenet|posteo|mailbox|protonmail|proton|arcor|vodafone|ionos|email|mail)$/;
  function emailFinden(text) {
    var kand = [];
    String(text || '').split('\n').forEach(function (z) {
      z = z.replace(/[ \t]*[\(\[][ \t]*at[ \t]*[\)\]][ \t]*/gi, '@')
        .replace(/([A-Za-z0-9])[ \t]*[©®][ \t]*([A-Za-z0-9])/g, '$1@$2')
        .replace(/[ \t]*@[ \t]*/g, '@');
      if (z.indexOf('@') >= 0) z = z.replace(/(\w)[ \t]+\.[ \t]*(?=\w)|(\w)[ \t]*\.[ \t]+(?=\w)/g, function (m, a, b) { return (a || b) + '.'; });
      (z.match(/[A-Za-z0-9._%+\-]+(?:@[A-Za-z0-9._%+\-]+)+/g) || []).forEach(function (tok) {
        var p = tok.split('@');
        for (var i = 1; i < p.length; i++) {
          var lokal = p[i - 1].replace(/^[._\-]+|[._\-]+$/g, '');
          var m = p[i].replace(/^[._\-]+/, '').toLowerCase().match(/^((?:[a-z0-9\-]+\.)+([a-z]{2,}))/);
          if (!lokal || !m) continue;
          if (m[2].length > 6 && !ENDUNG_LANG.test(m[2])) continue;
          kand.push((lokal + '@' + m[1]).toLowerCase());
        }
      });
    });
    if (!kand.length) return '';
    var gut = kand.filter(function (e) { return /[a-z]/.test(e.split('@')[0]); });
    if (gut.length) kand = gut;
    var persoenlich = kand.filter(function (e) { return !ALLGEMEIN.test(e.split('@')[0]); });
    return (persoenlich[0] || kand[0]);
  }
  function domainName(email) {
    var d = umlautFrei(((email || '').split('@')[1] || '').split('.')[0] || '');
    return d.length >= 4 && !FREEMAIL.test(d) ? firmenSchluessel(d) : '';
  }
  function firmenSchluessel(s) { return umlautFrei(s).replace(/ue|ii|ti|li|il/g, 'u'); }
  function istTelefon(s) { return ziffern(s) >= 7 && (TELEFON_ZEICHEN.test(s) || /^\+?\(?\d[\d\s()\/.\-–]+$/.test(s)); }
  function istAnschrift(s) { return ANSCHRIFT_PLZ.test(s) || (ANSCHRIFT_STRASSE.test(s) && /\d/.test(s)) || UK_POSTLEITZAHL.test(s) || /^\d+[a-z]?\s+\w+\s+(road|street|avenue|lane)/i.test(s); }
  function istWeb(s) { return s.indexOf('@') < 0 && WEB.test(s); }
  function istAusschluss(s) { return s.indexOf('@') >= 0 || istTelefon(s) || istAnschrift(s) || istWeb(s) || FAX.test(s) && ziffern(s) >= 5; }
  function nameAusZeile(s) {
    if (/\d|@/.test(s) || RECHTSFORM.test(s) || POSITION.test(s) || EINRICHTUNG.test(s)) return null;
    var w = s.replace(/,/g, ' ').split(/\s+/).map(function (x) { return x.replace(/^[^A-Za-zÄÖÜäöüßÀ-ÿ]+|[^A-Za-zÄÖÜäöüßÀ-ÿ'’-]+$/g, ''); }).filter(Boolean);
    w = w.filter(function (x) { return TITEL.indexOf(x.toLowerCase().replace(/[.\-]/g, '')) < 0; });
    if (w.length < 2 || w.length > 4) return null;
    var wortOk = /^[A-ZÄÖÜÀ-Ý][a-zäöüßà-ÿ'’]+(-[A-ZÄÖÜÀ-Ý][a-zäöüßà-ÿ'’]+)*$/;
    for (var i = 0; i < w.length; i++) {
      var mitte = i > 0 && i < w.length - 1;
      if (!(wortOk.test(w[i]) || (mitte && PARTIKEL.indexOf(w[i]) >= 0) || (mitte && /^[A-ZÄÖÜ]\.$/.test(w[i])))) return null;
    }
    var p = 1;
    while (p < w.length - 1 && PARTIKEL.indexOf(w[p]) < 0) p++;
    if (PARTIKEL.indexOf(w[p]) < 0) p = w.length - 1;
    return { vorname: w.slice(0, p).join(' '), nachname: w.slice(p).join(' ') };
  }
  function nameAusEmail(email) {
    var lokal = (email || '').split('@')[0];
    var t = lokal.split(/[._]/);
    if (t.length !== 2 || !/^[a-z]{2,}$/i.test(t[0]) || !/^[a-z]{2,}(-[a-z]{2,})?$/i.test(t[1]) || ALLGEMEIN.test(t[0])) return null;
    return { vorname: gross(t[0]), nachname: t[1].split('-').map(gross).join('-') };
  }
  function schoenSchreiben(s) {
    var buchst = s.replace(/[^A-Za-zÄÖÜäöüß]/g, '');
    if (buchst.length < 4 || buchst !== buchst.toUpperCase()) return s;
    return s.split(' ').map(function (w) {
      if (RECHTSFORM.test(w) || /^[A-ZÄÖÜ]{2,4}$/.test(w) && /^(MVZ|AG|KG|SE|UK|USA|EU|GMBH)$/.test(w)) return w.replace(/^GMBH$/, 'GmbH');
      return w.split('-').map(function (x) { return x ? gross(x) : x; }).join('-');
    }).join(' ');
  }
  function aufraeumen(s) { return s.replace(/^[\s.,;:·•|\-–]+|[\s,;:·•|\-–]+$/g, '').replace(/\s+/g, ' ').trim(); }
  function auswerten(text, mitTelPos) {
    var z = zerlegen(text), f = { email: '', vorname: '', nachname: '', einrichtung: '' };
    if (mitTelPos) { f.telefon = ''; f.position = ''; }
    f.email = emailFinden(z.map(function (x) { return x.zeile; }).join('\n'));
    var ePlain = umlautFrei((f.email.split('@')[0] || ''));
    var firma = domainName(f.email);
    var bester = null, besterWert = -99;
    z.forEach(function (x, nr) {
      var kandidaten = x.teile.slice();
      x.spalten.forEach(function (s) { if (kandidaten.indexOf(s) < 0) kandidaten.push(s); });
      kandidaten.forEach(function (t) {
        if (istAusschluss(t)) return;
        var n = nameAusZeile(t); if (!n) return;
        var nn = umlautFrei(n.nachname), vn = umlautFrei(n.vorname.split(' ')[0]);
        if (firma && (firmenSchluessel(vn) === firma || firmenSchluessel(n.vorname + n.nachname) === firma)) return;
        var wert = 1 - nr * 0.05;
        if (ePlain && nn.length > 1 && ePlain.indexOf(nn.replace(/-/g, '')) >= 0) wert += 5;
        if (ePlain && vn.length > 1 && ePlain.indexOf(vn) >= 0) wert += 2;
        if (wert > besterWert) { besterWert = wert; bester = n; }
      });
    });
    if (!bester && f.email) bester = nameAusEmail(f.email);
    if (bester) { f.vorname = bester.vorname; f.nachname = bester.nachname; }
    var einr = '', einrWert = 0;
    z.forEach(function (x, nr) {
      x.teile.forEach(function (t) {
        var rf = t.match(RECHTSFORM);
        if (rf && istAusschluss(t) && t.indexOf('@') < 0) t = t.slice(0, rf.index + rf[0].length);
        if (istAusschluss(t) || POSITION.test(t) && !RECHTSFORM.test(t)) return;
        if (nurRechtsform(t)) return;
        var mitFirma = firma && firmenSchluessel(t).indexOf(firma) >= 0;
        if (bester && t.indexOf(bester.nachname) >= 0 && !RECHTSFORM.test(t) && !EINRICHTUNG.test(t) && (!mitFirma || t.indexOf(bester.vorname) >= 0)) return;
        var w = 0;
        if (RECHTSFORM.test(t) && t.replace(RECHTSFORM_ALLE, '').replace(/&|\+|\bCo\b\.?|[^A-Za-zÄÖÜäöüßÀ-ÿ]/g, '').length >= 4) w += 3;
        if (EINRICHTUNG.test(t)) w += 2;
        if (mitFirma) w += 2 + ((t.match(/[A-Za-zÄÖÜäöüßÀ-ÿ]{3,}/g) || []).length > 1 ? 0.5 : 0);
        if (/^(department|abteilung|fachbereich|dept\.?)\b/i.test(t)) w -= 1.5;
        if (w <= 0) return;
        w -= nr * 0.05;
        if (w > einrWert) { einrWert = w; einr = t; }
      });
    });
    f.einrichtung = einr ? aufraeumen(schoenSchreiben(einr)) : '';
    if (mitTelPos) {
      z.some(function (x) {
        return x.spalten.some(function (s) {
          return s.split(/\s+[·•|∙◦]\s+|\s{2,}|(?=\b(?:Tel|Fon|Phone|Telefon|Mobil|Mobile|Handy|Fax|T|M|F)\b\.?\s*:?\s*\+?\d)/i).some(function (t) {
            if (FAX.test(t) || t.indexOf('@') >= 0 || istAnschrift(t) && !TELEFON_ZEICHEN.test(t)) return false;
            if (ziffern(t) < 7) return false;
            var m = t.match(NUMMER);
            if (!m) return false;
            var nummer = m[0].replace(/[\s.\-–]+$/, '').trim();
            if (ziffern(nummer) < 7) return false;
            f.telefon = nummer; return true;
          });
        });
      });
      z.some(function (x) {
        return x.spalten.some(function (t) {
          if (istAusschluss(t) || RECHTSFORM.test(t) || !POSITION.test(t)) return false;
          if (/^(department|abteilung)\b/i.test(t) && !/[·•|]/.test(t) && !/(head|leit)/i.test(t)) return false;
          f.position = aufraeumen(t); return true;
        });
      });
    }
    f.punkte = (f.email ? 3 : 0) + (f.nachname ? 1 : 0) + (f.einrichtung ? 1 : 0);
    return f;
  }
  function kastenAbstand(a, b) {
    var dx = Math.max(b.x0 - a.x1, a.x0 - b.x1), dy = Math.max(b.y0 - a.y1, a.y0 - b.y1);
    return Math.max(dx, dy);
  }
  function textAusTsv(tsv) {
    var zeilen = {}, folge = [];
    String(tsv || '').split('\n').forEach(function (r) {
      var s = r.split('\t');
      if (s.length < 12 || s[0] !== '5') return;
      var t = s.slice(11).join(' ').trim();
      if (!t) return;
      var k = s[2] + '.' + s[3] + '.' + s[4];
      if (!zeilen[k]) { zeilen[k] = []; folge.push(k); }
      zeilen[k].push({ x0: +s[6], y0: +s[7], x1: +s[6] + +s[8], y1: +s[7] + +s[9], t: t });
    });
    var linien = folge.map(function (k) {
      var w = zeilen[k];
      var hs = w.filter(function (x) { return /[A-Za-z0-9ÄÖÜäöüß]{2,}/.test(x.t); }).map(function (x) { return Math.min(x.x1 - x.x0, x.y1 - x.y0); });
      if (!hs.length) hs = w.map(function (x) { return Math.min(x.x1 - x.x0, x.y1 - x.y0); });
      hs.sort(function (a, b) { return a - b; });
      var hm = Math.max(1, hs[Math.floor(hs.length / 2)]), segs = [], akt = null;
      w.forEach(function (x) {
        if (!akt || kastenAbstand(akt.letztes, x) > 1.8 * hm) { akt = { x0: x.x0, y0: x.y0, x1: x.x1, y1: x.y1, w: [] }; segs.push(akt); }
        akt.w.push(x.t); akt.letztes = x;
        akt.x0 = Math.min(akt.x0, x.x0); akt.y0 = Math.min(akt.y0, x.y0); akt.x1 = Math.max(akt.x1, x.x1); akt.y1 = Math.max(akt.y1, x.y1);
      });
      segs.forEach(function (s) { s.text = symbolWeg(s.w.join(' ')); });
      return { segs: segs, hm: hm };
    });
    linien.forEach(function (L, i) {
      L.segs.forEach(function (s) {
        if (!s.text || !nurRechtsform(s.text)) return;
        for (var j = i - 1; j >= 0 && j >= i - 3; j--) {
          var oben = linien[j].segs.filter(function (o) {
            return o.text && kastenAbstand(o, s) < 1.5 * L.hm && !nurRechtsform(o.text) && !/\d|@/.test(o.text);
          })[0];
          if (oben) { oben.text += ' ' + s.text; s.text = ''; return; }
        }
      });
    });
    return linien.map(function (L) { return L.segs.filter(function (s) { return s.text; }).map(function (s) { return s.text; }).join(SPALTE); })
      .filter(Boolean).join('\n');
  }
  var GROESSTE_SEITE = 2600, KLEINSTE_SEITE = 2000;
  function leinwand(b, h) { var c = document.createElement('canvas'); c.width = b; c.height = h; return c; }
  function grau(c) {
    var ctx = c.getContext('2d', { willReadFrequently: true }), d = ctx.getImageData(0, 0, c.width, c.height), p = d.data;
    for (var i = 0; i < p.length; i += 4) { var g = (p[i] * 299 + p[i + 1] * 587 + p[i + 2] * 114) / 1000; p[i] = p[i + 1] = p[i + 2] = g; }
    ctx.putImageData(d, 0, 0);
    return c;
  }
  function zeichnen(quelle, qb, qh, ausschnitt) {
    var a = ausschnitt || { x: 0, y: 0, b: qb, h: qh };
    var g = Math.max(a.b, a.h), m = Math.min(1, GROESSTE_SEITE / g);
    if (g < KLEINSTE_SEITE) m = Math.min(2, KLEINSTE_SEITE / g);
    var c = leinwand(Math.round(a.b * m), Math.round(a.h * m));
    c.getContext('2d').drawImage(quelle, a.x, a.y, a.b, a.h, 0, 0, c.width, c.height);
    return grau(c);
  }
  function drehen(c, grad) {
    var r = leinwand(c.height, c.width), ctx = r.getContext('2d');
    ctx.translate(r.width / 2, r.height / 2); ctx.rotate(grad * Math.PI / 180); ctx.drawImage(c, -c.width / 2, -c.height / 2);
    return r;
  }
  function verwerfen(c) { if (c && c.getContext) { try { c.getContext('2d').clearRect(0, 0, c.width, c.height); } catch (e) { } c.width = 0; c.height = 0; } }
  function ausDatei(blob) {
    return createImageBitmap(blob, { imageOrientation: 'from-image' }).then(function (bm) {
      var c = zeichnen(bm, bm.width, bm.height); bm.close(); return c;
    });
  }
  var strom = null;
  function kameraMoeglich() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && window.isSecureContext !== false; }
  function kameraOeffnen(video) {
    if (!kameraMoeglich()) return Promise.reject(new Error('keine Kamera'));
    return navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } } })
      .then(function (s) {
        strom = s; video.muted = true; video.setAttribute('playsinline', ''); video.srcObject = s;
        return video.play();
      });
  }
  function kameraSchliessen(video) {
    if (strom) { strom.getTracks().forEach(function (t) { try { t.stop(); } catch (e) { } }); }
    strom = null;
    if (video) { try { video.pause(); } catch (e) { } video.srcObject = null; video.removeAttribute('src'); }
  }
  function ausVideo(video, rahmen) {
    var vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh) throw new Error('Kamera liefert kein Bild');
    var a = null;
    if (rahmen) {
      var ev = video.getBoundingClientRect(), er = rahmen.getBoundingClientRect();
      var m = Math.max(ev.width / vw, ev.height / vh);
      var oy = (ev.height - vh * m) / 2;
      var rand = ev.height > ev.width ? 0.5 : 0.2;
      var y = (er.top - ev.top - oy) / m, h = er.height / m;
      y -= h * rand; h *= 1 + 2 * rand;
      y = Math.max(0, y); h = Math.min(vh - y, h);
      a = { x: 0, y: y, b: vw, h: h };
    }
    return zeichnen(video, vw, vh, a);
  }
  function inAppBrowser(ua) {
    ua = String(ua || '');
    if (!/Android/i.test(ua)) return false;
    return /;\s*wv\)/.test(ua) || /(FBAN|FBAV|FB_IAB|Instagram|WhatsApp|LinkedInApp|BytedanceWebview|musical_ly|\bLine\/)/.test(ua);
  }
  var programmLaden = null, arbeiterV = null, arbeiter = null;
  function programm() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (!programmLaden) {
      programmLaden = new Promise(function (ok, fehler) {
        var s = document.createElement('script');
        s.src = PFAD.programm;
        s.onload = function () { window.Tesseract ? ok(window.Tesseract) : fehler(new Error('Programm fehlt')); };
        s.onerror = function () { programmLaden = null; fehler(new Error('Programm nicht ladbar')); };
        document.head.appendChild(s);
      });
    }
    return programmLaden;
  }
  function vorwaermen() {
    if (arbeiterV) return arbeiterV;
    arbeiterV = programm().then(function (T) {
      return T.createWorker(einst().sprachen || 'deu+eng', 1, {
        workerPath: PFAD.worker, corePath: PFAD.kern, langPath: PFAD.sprachen,
        workerBlobURL: false,
        cacheMethod: 'none',
        gzip: true,
        logger: function () { }, errorHandler: function () { }
      });
    }).then(function (w) {
      arbeiter = w;
      return w.setParameters({ tessedit_pageseg_mode: String(einst().seitenmodus || 3), user_defined_dpi: '300' }).then(function () { return w; });
    });
    arbeiterV.catch(function () { arbeiterV = null; });
    return arbeiterV;
  }
  function beenden() {
    var w = arbeiter, v = arbeiterV;
    arbeiter = null; arbeiterV = null;
    if (w) { try { w.terminate(); } catch (e) { } }
    else if (v) v.then(function (x) { try { x.terminate(); } catch (e) { } }, function () { });
  }
  function erkennen(bild, optionen) {
    var o = optionen || {}, start = Date.now();
    var limit = (o.zeitlimitSekunden || einst().zeitlimitSekunden || 30) * 1000;
    var mitTelPos = !!o.mitTelPos, versuche = 0, abgelaufen = false, roh = null;
    var meinV = vorwaermen();
    function meinenBeenden() {
      if (arbeiterV === meinV) { arbeiterV = null; arbeiter = null; }
      meinV.then(function (w) { try { w.terminate(); } catch (e) { } }, function () { });
    }
    var arbeit = meinV.then(function (w) {
      var drehungen = [0, -90, 90], bestes = null;
      function naechste(i) {
        if (i >= drehungen.length || abgelaufen || (i > 0 && Date.now() - start > limit * 0.6)) return bestes;
        var c = i === 0 ? bild : drehen(bild, drehungen[i]);
        versuche++;
        return w.recognize(c, {}, { text: true, tsv: true }).then(function (r) {
          var text = r && r.data ? r.data.text : '', tsv = r && r.data ? r.data.tsv : '';
          r = null;
          var spaltenText = tsv ? textAusTsv(tsv) : '';
          var f = auswerten(spaltenText || text, mitTelPos);
          if (spaltenText && !f.email) { var f2 = auswerten(text, mitTelPos); if (f2.email) { f = f2; spaltenText = ''; } }
          if (o.rohtext) roh = spaltenText || text;
          text = null; tsv = null; spaltenText = null;
          if (i > 0) verwerfen(c);
          if (!bestes || f.punkte > bestes.punkte) bestes = f;
          if (f.email || f.punkte >= 3) return bestes;
          return naechste(i + 1);
        });
      }
      return naechste(0);
    });
    var uhr;
    var wache = new Promise(function (ok, fehler) { uhr = setTimeout(function () { abgelaufen = true; fehler(new Error('zeitlimit')); }, limit); });
    return Promise.race([arbeit, wache]).then(function (f) {
      clearTimeout(uhr); verwerfen(bild); meinenBeenden();
      var erg = { felder: f || auswerten('', mitTelPos), dauerMs: Date.now() - start, versuche: versuche };
      if (o.rohtext) erg.roh = roh;
      roh = null;
      return erg;
    }, function (e) {
      clearTimeout(uhr); verwerfen(bild); meinenBeenden();
      throw new Error(e && e.message === 'zeitlimit' ? 'zeitlimit' : 'fehler');
    });
  }
  window.Visitenkarte = {
    PFAD: PFAD, DATEIEN: DATEIEN,
    auswerten: auswerten, textAusTsv: textAusTsv,
    kameraMoeglich: kameraMoeglich, kameraOeffnen: kameraOeffnen, kameraSchliessen: kameraSchliessen,
    ausVideo: ausVideo, ausDatei: ausDatei, inAppBrowser: inAppBrowser,
    vorwaermen: vorwaermen, erkennen: erkennen, beenden: beenden,
    _verwerfen: verwerfen
  };
})();
