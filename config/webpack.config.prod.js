const path = require('path')
const webpack = require('webpack')
const HtmlWebPackPlugin = require('html-webpack-plugin')
const DirectoryNamedWebpackPlugin = require('directory-named-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: { index: path.resolve(__dirname, '..', 'client', 'client.jsx') },

  output: {
    path: path.resolve(__dirname, '..', 'public'),
    filename: 'bundle.js'
  },

  module: {
    rules: [

      {
        test: /\.(sass|scss)$/,
        exclude: /node_modules/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [{
            loader: 'css-loader'
          }, {
            loader: 'sass-loader',
            options: {
              data: '@import "variables"',
              includePaths: [path.resolve(__dirname, '..', 'client', 'helpers')]
            }
          }]
        })
      },

      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: ['babel-preset-env', 'react'],
            plugins: ['transform-object-rest-spread', 'transform-runtime']
          }
        }, {
          loader: 'standard-loader',
          options: {
            enforce: 'pre',
            parser: 'babel-eslint',
            global: ['React', 'PropTypes']
          }
        }]
      },

      {
        test: /\.html$/,
        exclude: /node_modules/,
        use: [{
          loader: 'html-loader',
          options: { minimize: true }
        }]
      },

      {
        test: /\.(png|svg|jpg|gif)$/,
        exclude: /node_modules/,
        use: ['file-loader']
      }
    ]
  },

  resolve: {
    modules: [
      path.resolve(__dirname, '..', 'client'),
      path.resolve(__dirname, '..', 'client', 'components'),
      'node_modules'
    ],
    extensions: ['.js', '.jsx'],
    plugins: [new DirectoryNamedWebpackPlugin(true)]
  },

  plugins: [
    new HtmlWebPackPlugin({
      template: path.resolve(__dirname, '..', 'client', 'index.html'),
      filename: 'index.html'
    }),

    new webpack.ProvidePlugin({
      React: 'react',
      PropTypes: 'prop-types'
    }),

    new ExtractTextPlugin('style.css'),

    new UglifyJSPlugin(),

    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),

    new CopyWebpackPlugin([{
      from: path.resolve(__dirname, '..', 'client', 'public'),
      to: path.resolve(__dirname, '..', 'public')
    }])
  ]
}
