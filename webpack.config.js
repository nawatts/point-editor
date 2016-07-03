const childProcess = require('child_process');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const process = require('process');
const webpack = require('webpack');

const isGhPagesDeploy = !!(process.env.GH_PAGES_DEPLOY);
const isProd = !!(process.env.NODE_ENV === 'production');

const DEV_SERVER_PORT = 3000;

let outputPublicPath;
if (isGhPagesDeploy) {
  const repoURL = childProcess.execSync('git config --get remote.origin.url').toString().trim();
  const repoName = repoURL.split('/').slice(-1)[0].replace(/\.git$/, '');
  outputPublicPath = `/${repoName}`;
} else if (isProd) {
  outputPublicPath = '/';
} else {
  outputPublicPath = `http://localhost:${DEV_SERVER_PORT}/`;
}

// http://webpack.github.io/docs/tutorials/getting-started/
const webpackConfig = {
  debug: !isProd,
  devServer: {
    contentBase: path.join(__dirname, 'src'),
    port: DEV_SERVER_PORT,
    stats: {
      colors: true,
    },
  },
  devtool: isProd ? 'source-map' : 'cheap-module-eval-source-map',
  entry: './src/index.js',
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel'],
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'build'),
    pathinfo: !isProd,
    publicPath: outputPublicPath,
  },
  plugins: [
    new webpack.NoErrorsPlugin(),
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      inject: 'body',
      minify: isProd ? {
        collapseWhitespace: true,
        removeComments: true,
      } : false,
    }),
  ],
  stats: {
    colors: true,
    progress: true,
  },
};

if (isProd) {
  webpackConfig.plugins = webpackConfig.plugins.concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
      },
    }),
    new webpack.optimize.OccurenceOrderPlugin(true),
    new webpack.optimize.UglifyJsPlugin(),
  ]);
}

module.exports = webpackConfig;
