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
    'univ', 'habil', 'dipling', 'diplbiol', 'diplchem', 'drmed', 'drmedvet', 'drrernat', 'frau', 'herr', 'mr', 'mrs', 'ms', 'miss', 'sen', 'jun', 'ba', 'ma', 'priv', 'doz', 'pd', 'biol', 'chem', 'oec', 'mult'];
  var PARTIKEL = ['von', 'van', 'de', 'der', 'den', 'zu', 'zum', 'zur', 'del', 'della', 'da', 'di', 'du', 'la', 'le', 'ten', 'ter', 'vom'];
  var RECHTSFORM = /\b(GmbH|gGmbH|mbH|AG|KG|KGaA|OHG|GbR|PartG|e\.\s?V\.|eG|Ltd\.?|Limited|Inc\.?|LLC|Corp\.?|S\.A\.|S\.L\.|S\.r\.l\.|SpA|S\.p\.A\.|B\.V\.|N\.V\.|SE|SAS|plc)(?=$|[\s,.;)])/i;
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
  function zerlegen(text) {
    var aus = [];
    String(text || '').replace(/\r/g, '').split('\n').forEach(function (z) {
      z = z.replace(/[ \t]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!z) return;
      var teile = z.split(/\s+[·•|∙◦®«»*]\s+|\s+[-–—]\s+|\s{3,}/).map(function (t) { return t.trim(); }).filter(Boolean);
      aus.push({ zeile: z, teile: teile });
    });
    return aus;
  }
  function emailFinden(text) {
    var t = String(text || '')
      .replace(/\s*[\(\[]\s*at\s*[\)\]]\s*/gi, '@')
      .replace(/(\w)\s*[©®]\s*(\w)/g, '$1@$2')
      .replace(/\s*@\s*/g, '@')
      .split('\n').map(function (z) { return z.indexOf('@') >= 0 ? z.replace(/(\w)\s+\.\s*(?=\w)|(\w)\s*\.\s+(?=\w)/g, function (m, a, b) { return (a || b) + '.'; }) : z; }).join('\n');
    var alle = t.match(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}/g) || [];
    alle = alle.map(function (e) { return e.replace(/^[._\-]+|[._\-]+$/g, '').toLowerCase(); })
      .filter(function (e) { return /^[^@]+@[^@]+\.[a-z]{2,}$/.test(e); });
    if (!alle.length) return '';
    var persoenlich = alle.filter(function (e) { return !ALLGEMEIN.test(e.split('@')[0]); });
    return (persoenlich[0] || alle[0]);
  }
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
    f.email = emailFinden(text);
    var ePlain = umlautFrei((f.email.split('@')[0] || ''));
    var bester = null, besterWert = -99;
    z.forEach(function (x, nr) {
      x.teile.concat(x.teile.length > 1 ? [x.zeile] : []).forEach(function (t) {
        if (istAusschluss(t)) return;
        var n = nameAusZeile(t); if (!n) return;
        var wert = 1 - nr * 0.05;
        var nn = umlautFrei(n.nachname), vn = umlautFrei(n.vorname.split(' ')[0]);
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
        if (bester && t.indexOf(bester.nachname) >= 0 && !RECHTSFORM.test(t) && !EINRICHTUNG.test(t)) return;
        var w = 0;
        if (RECHTSFORM.test(t)) w += 3;
        if (EINRICHTUNG.test(t)) w += 2;
        if (/^(department|abteilung|fachbereich|dept\.?)\b/i.test(t)) w -= 1.5;
        if (w <= 0) return;
        w -= nr * 0.05;
        if (w > einrWert) { einrWert = w; einr = t; }
      });
    });
    f.einrichtung = einr ? aufraeumen(schoenSchreiben(einr)) : '';
    if (mitTelPos) {
      z.some(function (x) {
        var ok = false;
        x.zeile.split(/\s+[·•|∙◦]\s+|\s{2,}|(?=\b(?:Tel|Fon|Phone|Telefon|Mobil|Mobile|Handy|Fax|T|M|F)\b\.?\s*:?\s*\+?\d)/i).some(function (t) {
          if (FAX.test(t) || t.indexOf('@') >= 0 || istAnschrift(t) && !TELEFON_ZEICHEN.test(t)) return false;
          if (ziffern(t) < 7) return false;
          var m = t.match(NUMMER);
          if (!m) return false;
          var nummer = m[0].replace(/[\s.\-–]+$/, '').trim();
          if (ziffern(nummer) < 7) return false;
          f.telefon = nummer; ok = true; return true;
        });
        return ok;
      });
      z.some(function (x) {
        var t = x.zeile;
        if (istAusschluss(t) || RECHTSFORM.test(t) || !POSITION.test(t)) return false;
        if (/^(department|abteilung)\b/i.test(t) && x.teile.length === 1 && !/(head|leit)/i.test(t)) return false;
        f.position = aufraeumen(t); return true;
      });
    }
    f.punkte = (f.email ? 3 : 0) + (f.nachname ? 1 : 0) + (f.einrichtung ? 1 : 0);
    return f;
  }
  var GROESSTE_SEITE = 1800;
  function leinwand(b, h) { var c = document.createElement('canvas'); c.width = b; c.height = h; return c; }
  function grau(c) {
    var ctx = c.getContext('2d', { willReadFrequently: true }), d = ctx.getImageData(0, 0, c.width, c.height), p = d.data;
    for (var i = 0; i < p.length; i += 4) { var g = (p[i] * 299 + p[i + 1] * 587 + p[i + 2] * 114) / 1000; p[i] = p[i + 1] = p[i + 2] = g; }
    ctx.putImageData(d, 0, 0);
    return c;
  }
  function zeichnen(quelle, qb, qh, ausschnitt) {
    var a = ausschnitt || { x: 0, y: 0, b: qb, h: qh };
    var m = Math.min(1, GROESSTE_SEITE / Math.max(a.b, a.h));
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
      var ox = (ev.width - vw * m) / 2, oy = (ev.height - vh * m) / 2;
      var rand = 0.2;
      var x = (er.left - ev.left - ox) / m, y = (er.top - ev.top - oy) / m, b = er.width / m, h = er.height / m;
      x -= b * rand; y -= h * rand; b *= 1 + 2 * rand; h *= 1 + 2 * rand;
      x = Math.max(0, x); y = Math.max(0, y); b = Math.min(vw - x, b); h = Math.min(vh - y, h);
      a = { x: x, y: y, b: b, h: h };
    }
    return zeichnen(video, vw, vh, a);
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
    var mitTelPos = !!o.mitTelPos, versuche = 0, abgelaufen = false;
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
        return w.recognize(c, {}, { text: true }).then(function (r) {
          var text = r && r.data ? r.data.text : '';
          r = null;
          var f = auswerten(text, mitTelPos);
          text = null;
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
      return { felder: f || auswerten('', mitTelPos), dauerMs: Date.now() - start, versuche: versuche };
    }, function (e) {
      clearTimeout(uhr); verwerfen(bild); meinenBeenden();
      throw new Error(e && e.message === 'zeitlimit' ? 'zeitlimit' : 'fehler');
    });
  }
  window.Visitenkarte = {
    PFAD: PFAD, DATEIEN: DATEIEN,
    auswerten: auswerten,
    kameraMoeglich: kameraMoeglich, kameraOeffnen: kameraOeffnen, kameraSchliessen: kameraSchliessen,
    ausVideo: ausVideo, ausDatei: ausDatei,
    vorwaermen: vorwaermen, erkennen: erkennen, beenden: beenden,
    _verwerfen: verwerfen
  };
})();
