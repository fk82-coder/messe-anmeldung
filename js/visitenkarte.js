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
  var MOBIL_ETIKETT = /(mobil\w*|handy|cell\w*|\bmob\b\.?|\bM\b)(\s*(phone|tel\.?|telefon|nr\.?|no\.?))?[\s.:]*$/i;
  var FEST_ETIKETT = /(tel\.?|telefon|phone|fon|\bT\b|\bP\b)[\s.:]*$/i;
  var TEL_TEILE = /\s+[·•|∙◦]\s+|\s{2,}|(?=\b(?:Tel|Fon|Phone|Telefon|Mobil|Mobile|Handy|Fax|T|M|F)\b\.?\s*:?\s*\+?\d)/i;
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
      else if (w.length > 1 && /^[A-Za-zÀ-ÿ]$/.test(w[0]) && !/^[TMFPEWtmfpew]$/.test(w[0]) && /^(\+|\(|\d|www\.|\S+@)/i.test(w[1]) &&
        !(/^[a-zß-ÿ]$/.test(w[0]) && /@/.test(w[1]))) w.shift();
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
  var EMAIL_ETIKETT = /^(e-?mail|email|mail|e)$/i;
  var EMAIL_NACH = /^($|[\s,;:.!?)\]}>»"'’|·•\/])/;
  function emailPruefen(text) {
    var kand = [], verworfen = 0, ganz = String(text || '');
    ganz.split('\n').forEach(function (zeile) {
      var z = zeile.replace(/[ \t]*[\(\[][ \t]*at[ \t]*[\)\]][ \t]*/gi, '@')
        .replace(/([A-Za-z0-9])[ \t]*[©®][ \t]*([A-Za-z0-9])/g, '$1@$2')
        .replace(/[ \t]*@[ \t]*/g, '@');
      if (z.indexOf('@') >= 0) z = z.replace(/(\w)[ \t]+\.[ \t]*(?=\w)|(\w)[ \t]*\.[ \t]+(?=\w)/g, function (m, a, b) { return (a || b) + '.'; });
      var re = /[A-Za-z0-9._%+\-]+(?:@[A-Za-z0-9._%+\-]+)+/g, t;
      while ((t = re.exec(z))) {
        var tok = t[0], vorher = z.slice(0, t.index), danach = z.slice(t.index + tok.length);
        var klebt = (vorher.match(/\S*$/) || [''])[0];
        var vor = vorher.match(/(\S+)(\s+)$/), vorneOk = true;
        if (klebt) {
          var etikett = /:$/.test(klebt) && EMAIL_ETIKETT.test(klebt.replace(/:$/, ''));
          if (/[A-Za-z0-9À-ÿ]/.test(klebt) && !etikett) vorneOk = false;
        } else if (vor) {
          var spalteDavor = vor[2].replace(/\t/g, '   ').length >= 3;
          var stueck = spalteDavor ? vorher.replace(/\s+$/, '').split(/ {3,}|\t/).pop() : vor[1];
          if ((spalteDavor ? /^[a-zß-ÿ]{1,3}$/ : /^[a-zß-ÿ]{1,6}$/).test(stueck) && !EMAIL_ETIKETT.test(stueck)) vorneOk = false;
        }
        var p = tok.split('@'), letzte = p.length - 1;
        for (var i = 1; i < p.length; i++) {
          var roh = p[i - 1];
          var lokal = roh.replace(/^[._\-]+|[._\-]+$/g, '');
          var dom = p[i].replace(/^[._\-]+/, '').toLowerCase();
          var m = dom.match(/^((?:[a-z0-9\-]+\.)+([a-z]{2,}))/);
          if (!lokal || !m) continue;
          if (m[2].length > 6 && !ENDUNG_LANG.test(m[2])) continue;
          if (i < letzte) continue;
          var ok = /^[._\-]/.test(roh) ? false : i === 1 ? vorneOk : !/[A-Za-zÀ-ÿ]/.test(p[i - 2]);
          if (ok && dom.slice(m[1].length).replace(/[._\-]+$/, '')) ok = false;
          if (ok && !EMAIL_NACH.test(danach)) ok = false;
          if (!ok) { if (/[a-z]/i.test(lokal)) verworfen++; continue; }
          kand.push((lokal + '@' + m[1]).toLowerCase());
        }
      }
    });
    var gut = kand.filter(function (e) { return /[a-z]/.test(e.split('@')[0]); });
    if (gut.length) kand = gut;
    var persoenlich = kand.filter(function (e) { return !ALLGEMEIN.test(e.split('@')[0]); });
    if (persoenlich.length) return { email: persoenlich[0], verworfen: verworfen };
    if (!kand.length) return { email: '', verworfen: verworfen };
    var domain = kand[0].split('@')[1];
    var rest = (ganz.toLowerCase().match(/(^|\s)[a-z0-9\-]+(\.[a-z0-9\-]+)*\.[a-z]{2,}(?=$|[\s,;])/gm) || [])
      .some(function (x) { return x.trim() === domain; });
    if (verworfen || rest) return { email: '', verworfen: verworfen + (rest ? 1 : 0) };
    return { email: kand[0], verworfen: 0 };
  }
  function emailFinden(text) { return emailPruefen(text).email; }
  function domainName(email) {
    var d = umlautFrei(((email || '').split('@')[1] || '').split('.')[0] || '');
    return d.length >= 4 && !FREEMAIL.test(d) ? firmenSchluessel(d) : '';
  }
  function firmenSchluessel(s) { return umlautFrei(s).replace(/ue|ii|ti|li|il/g, 'u'); }
  function nurZiffern(s) { return String(s || '').replace(/\D/g, ''); }
  function istMobilnummer(n) {
    var d = String(n || '').replace(/\(0\)/g, '').replace(/[^\d+]/g, '').replace(/^00/, '+').replace(/^\+(3[1349]|4[1349])0/, '+$1');
    return /^(\+49|0)1[5-7]\d/.test(d) || /^\+436[5-9]\d/.test(d) || /^\+417[5-9]\d/.test(d) || /^\+447[1-9]\d/.test(d) ||
      /^\+316\d/.test(d) || /^\+33[67]\d/.test(d) || /^\+393\d/.test(d) || /^\+34[67]\d/.test(d);
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
    if (mitTelPos) { f.telefon = ''; f.mobil = ''; f.position = ''; }
    var ep = emailPruefen(z.map(function (x) { return x.zeile; }).join('\n'));
    f.email = ep.email;
    f.emailVerworfen = ep.verworfen > 0;
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
    if (bester && f.email) {
      var lt = f.email.split('@')[0].split(/[._\-]/), vnS = umlautFrei(bester.vorname.split(' ')[0]), nnS = umlautFrei(bester.nachname).replace(/-/g, '');
      var a = lt[0].replace(/^[^a-z]+/, ''), b = umlautFrei(lt.slice(1).join(''));
      if (lt.length > 1 && a && b && nnS.length > 1 && b.indexOf(nnS) === 0 && vnS.length > a.length &&
        vnS.slice(-a.length) === a && vnS.indexOf(a) !== 0) { f.email = ''; f.emailVerworfen = true; }
    }
    if (bester && f.email) {
      var lokalS = umlautFrei(f.email.split('@')[0]), vnG = umlautFrei(bester.vorname.split(' ')[0]);
      var nnTeile = bester.nachname.split(/[\s\-]+/).map(umlautFrei).filter(Boolean), nnG = nnTeile.join(''), ganz = vnG + nnG;
      if (lokalS && vnG.length > 1 && nnG.length > 1) {
        var nachnamen = nnTeile.map(function (x, i) { return nnTeile.slice(i).join(''); });
        var rest = lokalS.length < ganz.length && ganz.slice(-lokalS.length) === lokalS && nachnamen.indexOf(lokalS) < 0;
        var vnRest = lokalS.length < vnG.length && vnG.slice(-lokalS.length) === lokalS;
        var kurz = lokalS.length <= 2 && [vnG[0], nnG[0], vnG[0] + nnG[0], nnG[0] + vnG[0]].indexOf(lokalS) < 0;
        if (rest || vnRest || kurz) { f.email = ''; f.emailVerworfen = true; }
      }
    }
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
      var nummern = [];
      z.forEach(function (x) {
        x.spalten.forEach(function (s) {
          s.split(TEL_TEILE).forEach(function (t) {
            if (!t || FAX.test(t) || t.indexOf('@') >= 0 || istAnschrift(t) && !TELEFON_ZEICHEN.test(t)) return;
            if (ziffern(t) < 7) return;
            var m = t.match(NUMMER);
            if (!m) return;
            var nummer = m[0].replace(/[\s.\-–]+$/, '').trim();
            if (ziffern(nummer) < 7) return;
            var vor = t.slice(0, m.index);
            var art = MOBIL_ETIKETT.test(vor) ? 'mobil' : FEST_ETIKETT.test(vor) ? 'fest' : (istMobilnummer(nummer) ? 'mobil' : 'fest');
            nummern.push({ nummer: nummer, art: art });
          });
        });
      });
      var fest = nummern.filter(function (n) { return n.art === 'fest'; })[0], mob = nummern.filter(function (n) { return n.art === 'mobil'; })[0];
      f.telefon = fest ? fest.nummer : (mob ? mob.nummer : '');
      f.mobil = fest && mob && nurZiffern(fest.nummer) !== nurZiffern(mob.nummer) ? mob.nummer : '';
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
  function schwelle() { return +einst().schaerfeSchwelle || 80; }
  function aufnahmeMs() { return +einst().aufnahmeMs || 1500; }
  function rahmenBereich(video, rahmen) {
    var vw = video.videoWidth, vh = video.videoHeight;
    var ev = video.getBoundingClientRect(), er = rahmen.getBoundingClientRect();
    var m = Math.max(ev.width / vw, ev.height / vh), ox = (ev.width - vw * m) / 2, oy = (ev.height - vh * m) / 2;
    var x = Math.max(0, (er.left - ev.left - ox) / m), y = Math.max(0, (er.top - ev.top - oy) / m);
    return { x: x, y: y, b: Math.max(8, Math.min(vw - x, er.width / m)), h: Math.max(8, Math.min(vh - y, er.height / m)) };
  }
  function streifenBereich(video, rahmen) {
    var vw = video.videoWidth, vh = video.videoHeight;
    var ev = video.getBoundingClientRect(), er = rahmen.getBoundingClientRect();
    var m = Math.max(ev.width / vw, ev.height / vh), oy = (ev.height - vh * m) / 2;
    var rand = ev.height > ev.width ? 0.5 : 0.2;
    var y = (er.top - ev.top - oy) / m, h = er.height / m;
    y -= h * rand; h *= 1 + 2 * rand;
    y = Math.max(0, y); h = Math.min(vh - y, h);
    return { x: 0, y: y, b: vw, h: h };
  }
  var SCHAERFE_BREITE = 800;
  function schaerfeMessen(quelle, a, lw) {
    var sb = SCHAERFE_BREITE, sh = Math.max(8, Math.round(sb * a.h / a.b));
    if (lw.width !== sb || lw.height !== sh) { lw.width = sb; lw.height = sh; }
    var ctx = lw.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(quelle, a.x, a.y, a.b, a.h, 0, 0, sb, sh);
    var p = ctx.getImageData(0, 0, sb, sh).data, n = sb * sh, g = new Float32Array(n), i, x, y, j, L, su = 0, sq = 0, k = 0;
    for (i = 0; i < n; i++) g[i] = p[i * 4] * 0.299 + p[i * 4 + 1] * 0.587 + p[i * 4 + 2] * 0.114;
    for (y = 1; y < sh - 1; y++) for (x = 1; x < sb - 1; x++) {
      j = y * sb + x; L = g[j - 1] + g[j + 1] + g[j - sb] + g[j + sb] - 4 * g[j]; su += L; sq += L * L; k++;
    }
    return k ? sq / k - (su / k) * (su / k) : 0;
  }
  var liveLw = null;
  function schaerfeLive(video, rahmen) {
    if (!video.videoWidth || !video.videoHeight) return 0;
    if (!liveLw) liveLw = leinwand(SCHAERFE_BREITE, 8);
    return schaerfeMessen(video, rahmenBereich(video, rahmen), liveLw);
  }
  function liveEnde() { verwerfen(liveLw); liveLw = null; }
  function besteAufnahme(video, rahmen, opt) {
    opt = opt || {};
    var vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh) return Promise.reject(new Error('Kamera liefert kein Bild'));
    var a = rahmenBereich(video, rahmen), s = streifenBereich(video, rahmen), grenze = schwelle(), dauer = opt.dauerMs || aufnahmeMs();
    var klein = leinwand(SCHAERFE_BREITE, 8), arbeit = leinwand(vw, vh), beste = leinwand(vw, vh);
    var besterWert = -1, kleinster = Infinity, n = 0, start = Date.now();
    return new Promise(function (ok, fehler) {
      function ende(ergebnis, f) {
        verwerfen(klein); verwerfen(arbeit);
        if (f) { verwerfen(beste); fehler(f); return; }
        if (!ergebnis) { verwerfen(beste); ok(null); return; }
        ok({ bild: beste, wert: Math.round(besterWert), schwelle: grenze, scharf: besterWert >= grenze, bilder: n,
          kleinster: Math.round(kleinster), ms: Date.now() - start, video: vw + '×' + vh, rahmen: a, streifen: s });
      }
      function schritt() {
        if (opt.abbrechen && opt.abbrechen()) { ende(false); return; }
        try {
          if (video.videoWidth !== vw || video.videoHeight !== vh) { if (n) { ende(true); return; } throw new Error('Kamerabild geändert'); }
          arbeit.getContext('2d').drawImage(video, 0, 0, vw, vh);
          var w = schaerfeMessen(arbeit, a, klein); n++;
          if (w < kleinster) kleinster = w;
          if (w > besterWert) { besterWert = w; var t = beste; beste = arbeit; arbeit = t; }
          if (opt.jeBild) opt.jeBild(w, besterWert, grenze);
        } catch (e) { ende(false, e); return; }
        var zeit = Date.now() - start;
        if (zeit >= dauer || (n >= 6 && zeit >= 600 && besterWert >= 2 * grenze)) { ende(true); return; }
        setTimeout(schritt, 80);
      }
      schritt();
    });
  }
  function karteFinden(quelle, qb, qh, ziel) {
    var B = 480, sk = B / qb, H = Math.max(8, Math.round(qh * sk));
    var c = leinwand(B, H), ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(quelle, 0, 0, qb, qh, 0, 0, B, H);
    var p = ctx.getImageData(0, 0, B, H).data, n = B * H, g = new Uint8Array(n), hist = new Float64Array(256), i;
    verwerfen(c);
    for (i = 0; i < n; i++) { g[i] = (p[i * 4] * 299 + p[i * 4 + 1] * 587 + p[i * 4 + 2] * 114) / 1000; hist[g[i]]++; }
    var summe = 0, sB = 0, wB = 0, best = 0, t = 128, v;
    for (i = 0; i < 256; i++) summe += i * hist[i];
    for (i = 0; i < 256; i++) {
      wB += hist[i]; if (!wB) continue;
      var wF = n - wB; if (!wF) break;
      sB += i * hist[i];
      var mB = sB / wB, mF = (summe - sB) / wF; v = wB * wF * (mB - mF) * (mB - mF);
      if (v > best) { best = v; t = i; }
    }
    var lab = new Int32Array(n), stapel = new Int32Array(n), komp = [], nr = 0;
    var zx0 = (ziel.x + ziel.b * 0.3) * sk, zx1 = (ziel.x + ziel.b * 0.7) * sk, zy0 = (ziel.y + ziel.h * 0.3) * sk, zy1 = (ziel.y + ziel.h * 0.7) * sk;
    for (i = 0; i < n; i++) {
      if (g[i] <= t || lab[i]) continue;
      nr++; var sp = 0, anz = 0, x0 = B, x1 = 0, y0 = H, y1 = 0, mitte = 0;
      stapel[sp++] = i; lab[i] = nr;
      while (sp) {
        var j = stapel[--sp], x = j % B, y = (j - x) / B; anz++;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        if (x >= zx0 && x <= zx1 && y >= zy0 && y <= zy1) mitte++;
        if (x > 0 && g[j - 1] > t && !lab[j - 1]) { lab[j - 1] = nr; stapel[sp++] = j - 1; }
        if (x < B - 1 && g[j + 1] > t && !lab[j + 1]) { lab[j + 1] = nr; stapel[sp++] = j + 1; }
        if (y > 0 && g[j - B] > t && !lab[j - B]) { lab[j - B] = nr; stapel[sp++] = j - B; }
        if (y < H - 1 && g[j + B] > t && !lab[j + B]) { lab[j + B] = nr; stapel[sp++] = j + B; }
      }
      komp.push({ nr: nr, anz: anz, x0: x0, x1: x1, y0: y0, y1: y1, mitte: mitte });
    }
    var k = komp.filter(function (q) { return q.mitte > 0; }).sort(function (a, b) { return b.anz - a.anz; })[0];
    g = null; stapel = null;
    if (!k) return null;
    var m0 = 0, mx = 0, my = 0, mxx = 0, myy = 0, mxy = 0, y2, xa, xb;
    function s1(q) { return q * (q + 1) / 2; }
    function s2(q) { return q * (q + 1) * (2 * q + 1) / 6; }
    for (y2 = k.y0; y2 <= k.y1; y2++) {
      xa = -1; xb = -1;
      for (i = k.x0; i <= k.x1; i++) if (lab[y2 * B + i] === k.nr) { if (xa < 0) xa = i; xb = i; }
      if (xa < 0) continue;
      var cnt = xb - xa + 1, sx = s1(xb) - s1(xa - 1), sxx = s2(xb) - s2(xa - 1);
      m0 += cnt; mx += sx; my += y2 * cnt; mxx += sxx; myy += y2 * y2 * cnt; mxy += y2 * sx;
    }
    lab = null;
    var cx = mx / m0, cy = my / m0, u20 = mxx / m0 - cx * cx, u02 = myy / m0 - cy * cy, u11 = mxy / m0 - cx * cy;
    var wurzel = Math.sqrt(Math.max(0, (u20 - u02) * (u20 - u02) / 4 + u11 * u11));
    var l1 = (u20 + u02) / 2 + wurzel, l2 = (u20 + u02) / 2 - wurzel;
    var lang = Math.sqrt(12 * Math.max(0, l1)), kurz = Math.sqrt(12 * Math.max(0, l2));
    var theta = 0.5 * Math.atan2(2 * u11, u20 - u02);
    var info = { anteil: m0 / n, seiten: (lang / Math.max(1, kurz)), fuellung: m0 / Math.max(1, lang * kurz),
      raender: (k.x0 <= 0 ? 1 : 0) + (k.x1 >= B - 1 ? 1 : 0) + (k.y0 <= 0 ? 1 : 0) + (k.y1 >= H - 1 ? 1 : 0), grad: theta * 180 / Math.PI };
    var ok = info.anteil >= 0.06 && info.anteil <= 0.92 && info.seiten >= 1.25 && info.seiten <= 2.1 &&
      info.fuellung >= 0.85 && info.fuellung <= 1.15 && info.raender <= 1;
    var grad = info.grad, quer = Math.abs(grad) <= 45, dreh = quer ? grad : (grad > 0 ? grad - 90 : grad + 90);
    if (Math.abs(dreh) > 20) ok = false;
    if (!ok) return { gefunden: false, info: info };
    return { gefunden: true, info: info, cx: cx / sk, cy: cy / sk, breite: (quer ? lang : kurz) / sk, hoehe: (quer ? kurz : lang) / sk, dreh: dreh };
  }
  function karteZeichnen(quelle, k) {
    var bw = k.breite * 0.96, bh = k.hoehe * 0.96, g = Math.max(bw, bh), m = Math.min(1, GROESSTE_SEITE / g);
    if (g < KLEINSTE_SEITE) m = Math.min(2, KLEINSTE_SEITE / g);
    var c = leinwand(Math.round(bw * m), Math.round(bh * m)), ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.translate(c.width / 2, c.height / 2); ctx.scale(m, m);
    if (Math.abs(k.dreh) >= 1.5) ctx.rotate(-k.dreh * Math.PI / 180);
    ctx.translate(-k.cx, -k.cy);
    ctx.drawImage(quelle, 0, 0);
    return grau(c);
  }
  function ausAufnahme(a) {
    var q = a.bild, k = null, bild;
    try { k = karteFinden(q, q.width, q.height, a.rahmen); } catch (e) { k = null; }
    if (k && k.gefunden) bild = karteZeichnen(q, k);
    else bild = zeichnen(q, q.width, q.height, a.streifen);
    verwerfen(q); a.bild = null;
    return { bild: bild, karte: k && k.gefunden ? { breite: Math.round(k.breite), hoehe: Math.round(k.hoehe), dreh: Math.round(k.dreh * 10) / 10 } : null,
      pruefung: k ? k.info : null, anTexterkennung: bild.width + '×' + bild.height };
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
          if (spaltenText && !f.email && !f.emailVerworfen) { var f2 = auswerten(text, mitTelPos); if (f2.email) { f = f2; spaltenText = ''; } }
          if (o.rohtext) roh = spaltenText || text;
          text = null; tsv = null; spaltenText = null;
          if (i > 0) verwerfen(c);
          if (!bestes || f.punkte > bestes.punkte || f.emailVerworfen) bestes = f;
          if (f.email || f.punkte >= 3 || f.emailVerworfen) return bestes;
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
    schwelle: schwelle, rahmenBereich: rahmenBereich, schaerfeMessen: schaerfeMessen, schaerfeLive: schaerfeLive, liveEnde: liveEnde,
    besteAufnahme: besteAufnahme, karteFinden: karteFinden, ausAufnahme: ausAufnahme, istMobilnummer: istMobilnummer,
    _verwerfen: verwerfen
  };
})();
