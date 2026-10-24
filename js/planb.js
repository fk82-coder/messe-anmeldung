(function () {
  var K = window.KONFIG;
  document.getElementById('version').textContent = 'v' + K.version;
  var fehlt = [];
  document.querySelectorAll('.planb-knopf').forEach(function (b) {
    var l = b.getAttribute('data-l'), ziel = (K.planB || {})[l];
    if (!ziel || /^FEHLT/.test(ziel)) { fehlt.push(l.toUpperCase()); b.disabled = true; return; }
    b.addEventListener('click', function () { location.replace(ziel); });
  });
  if (fehlt.length) {
    var m = document.getElementById('planbFehlt');
    m.textContent = 'Noch nicht eingerichtet: Link zur CleverReach-Formularseite ' + fehlt.join(', ') + ' fehlt in js/konfiguration.js (planB).';
    m.style.display = 'block';
  }
})();
