(function () {
  var still = function () {};
  ['log', 'info', 'warn', 'error', 'debug', 'trace', 'dir', 'table'].forEach(function (k) { try { self.console[k] = still; } catch (e) {  } });
})();
importScripts('worker.min.js');
