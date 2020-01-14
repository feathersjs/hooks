const path = require('path');

module.exports = {
  entry: './src/index.ts',
  mode: 'production',
  output: {
    library: 'hooks',
    libraryTarget: 'umd',
    globalObject: 'this',
    path: path.resolve(__dirname, '..', 'dist'),
    filename: 'hooks.js'
  },
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  module: {
    rules: [
      { test: /\.tsx?$/, use: ['ts-loader'], exclude: /node_modules/ }
    ]
  }
}
