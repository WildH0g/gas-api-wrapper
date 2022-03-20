// jshint esversion: 9
// jshint laxbreak: true

const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    path: path.resolve('./src', 'APIBuilder.js'),
  },
  output: {
    path: path.resolve(__dirname, 'gas'),
    filename: 'APIWrapper.js',
    library: {
      name: 'APIWrapperBuilder',
      type: 'var',
    },
  },
};
