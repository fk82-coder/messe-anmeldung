(function () {
  var imRahmen = false;
  try { imRahmen = window.self !== window.top; } catch (e) { imRahmen = true; }
  if (imRahmen) return;
  document.getElementById('okDanke').classList.add('aktiv');
  var n = 10, z = document.getElementById('ok-n');
  setInterval(function () { n--; z.textContent = n; if (n <= 0) location.replace('planb.html'); }, 1000);
})();
