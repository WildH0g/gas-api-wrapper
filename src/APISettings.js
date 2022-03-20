// jshint esversion: 9
// jshint laxbreak: true

module.exports = {
  runtime() {
    if ('undefined' !== typeof ScriptApp) return 'gas';
    if ('undefined' !== typeof Buffer) return 'nodejs';
    return 'unknown';
  },
};
