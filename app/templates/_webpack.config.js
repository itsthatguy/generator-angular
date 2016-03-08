var webpack = require('webpack');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var environment = process.env.NODE_ENV || 'development';
var docker = process.env.DOCKER === 'true';

var ForceCaseSensitivityPlugin = function () {};
ForceCaseSensitivityPlugin.prototype.apply = function (compiler) {
  compiler.plugin('normal-module-factory', function(nmf) {
    nmf.plugin('after-resolve', function(data, done) {
      var parentDir = path.dirname(data.resource);
      var resourceName = path.basename(data.resource);

      fs.readdir(parentDir, function(err, files) {
        if (err) { done(err); }

        if (files.indexOf(resourceName) === -1) {
          var realName = _.find(files, function(filename) {
            return filename.toLowerCase() === resourceName.toLowerCase();
          });

          var error = new Error('ForceCaseSensitivityPlugin: `'
            + resourceName
            + '` does not match the corresponding file on disk `'
            + realName + '`');

          done(error);
          if (environment !== 'development') {
            throw error;
          }
          return;
        }
        done(null, data);
      });
    });
  });
};

var entry = [];
<% if (react) { %>
if (environment === 'development' && !docker) {
  entry = [
    'webpack/hot/dev-server',
    'webpack-hot-middleware/client'
  ];
}
<% } %>
var environmentConfig = require(path.join(__dirname, 'src', 'config', 'environment', environment + '.js'));
environmentConfig.environment = environment;
environmentConfig.docker = docker;

function getLoader (name) {
  return {
    test: /\.jsx?$/,
    exclude: /node_modules/,
    loader: name,
    query: {
      presets: ['es2015', 'react']
    }
  };
}

module.exports = {
  devtool: '#inline-source-map',
  context: path.join(__dirname, 'src', 'app'),
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist'),
    sourcemapFilename: '[name].map',
    publicPath: '/'
  },

  entry: entry.concat('./index.jsx'),

  plugins: [
    new ForceCaseSensitivityPlugin(),
    new webpack.DefinePlugin({
      CONFIG: JSON.stringify(environmentConfig)
    })<% if (react) { %>,
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  <% } %>],

  module: {
    loaders: [
      // Note: order matters
      getLoader('react-hot'),
      getLoader('babel-loader')
    ]
  },

  resolve: {
    extensions: ['', '.js', '.jsx']
  }
};
