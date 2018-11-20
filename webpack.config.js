const path = require('path');

module.exports = {
  entry: './src/js/main.js',
  output: {
    filename: 'force_directed_graph.js',
    path: path.resolve(__dirname, 'dist')
  }, 
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      }
    ]
  }
};