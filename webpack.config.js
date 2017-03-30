const path = require('path')
const SplitByPathPlugin = require('webpack-split-by-path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const env = process.env['ENV'] || 'local'
const outputDir = 'dist-' + env

module.exports = {
  entry: {
    app: [
      `./src/config-${env}`,
      './entry'
    ]
  },
  output: {
    path: path.resolve(__dirname, outputDir),
    filename: 'js/[name].js',
    chunkFilename: 'js/[name].js'
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  devtool: 'source-map',
  debug: true,
  module: {
    loaders: [
      {
        test: /\.jsx?/,
        loader: 'babel',
        // exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react']
        }
      }
    ]
  },
  plugins: [
    new SplitByPathPlugin([
      {
        name: 'vendor',
        path: path.join(__dirname, 'node_modules')
      }
    ], {
      manifest: 'app-entry'
    }),
    new CopyWebpackPlugin([
        { from: 'src/static' }
    ])
  ]
}
