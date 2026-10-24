(function () {
  var OBEN = ['DE', 'AT', 'CH', 'NL', 'BE', 'FR', 'IT', 'ES', 'PL', 'GB'];
  var ALLE = ('AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM ' +
    'CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ' +
    'ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML ' +
    'MM MN MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PS PT PW PY QA RO RS RU RW SA SB SC SD SE ' +
    'SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VN VU WS XK YE ZA ZM ZW').split(' ');
  var cache = {};
  function namen(lang) {
    if (cache[lang]) return cache[lang];
    var dn = null;
    try { dn = new Intl.DisplayNames([lang], { type: 'region' }); } catch (e) { dn = null; }
    var m = {};
    ALLE.forEach(function (c) { m[c] = dn ? (dn.of(c) || c) : c; });
    if (dn === null || m.XK === 'XK') m.XK = lang === 'de' ? 'Kosovo' : 'Kosovo';
    cache[lang] = m;
    return m;
  }
  window.Laender = {
    ANDERES: 'anderes',
    liste: function (lang) {
      var m = namen(lang);
      var rest = ALLE.filter(function (c) { return OBEN.indexOf(c) < 0; });
      rest.sort(function (a, b) { return m[a].localeCompare(m[b], lang); });
      return { oben: OBEN.map(function (c) { return { code: c, name: m[c] }; }), rest: rest.map(function (c) { return { code: c, name: m[c] }; }) };
    },
    wert: function (code) {
      if (!code) return '';
      if (code === 'anderes') return 'Anderes Land';
      return namen('de')[code] || code;
    }
  };
})();
