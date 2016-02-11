var HtmlWebpackPlugin = require("html-webpack-plugin"),
    path = require("path"),
    process = require("process"),
    webpack = require("webpack");

var isProd = !!(process.env.NODE_ENV === "production");

var DEV_SERVER_PORT = 3000;
var DEV_SERVER_PATH = "http://localhost:" + DEV_SERVER_PORT + "/";

// http://webpack.github.io/docs/tutorials/getting-started/
var webpackConfig = {
    entry: {
        javascript: ["./src/index.js"]
    },
    output: {
        pathinfo: !isProd,
        path: path.join(__dirname, "build"),
        filename: "bundle.js",
        // Full URL required for fonts to work correctly
        // http://stackoverflow.com/questions/30762323/webpack-must-i-specify-the-domain-in-publicpath-for-url-directive-to-work-in
        publicPath: isProd ? "" : DEV_SERVER_PATH
    },
    debug: !isProd,
    devServer: {
        contentBase: path.join(__dirname, "src"),
        port: DEV_SERVER_PORT,
        stats: {
            colors: true
        }
    },
    devtool: isProd ? "source-map" : "cheap-module-eval-source-map",
    plugins: [
        new webpack.NoErrorsPlugin(),
        new HtmlWebpackPlugin({
            template: "src/index.html",
            inject: "body",
            minify: isProd ? {
                collapseWhitespace: true,
                removeComments: true
            } : false
        }),
    ],
    stats: {
        colors: true,
        progress: true
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                loaders: ["babel"],
                exclude: /node_modules/
            }
        ]
    }
};

if (isProd) {
    webpackConfig.plugins = webpackConfig.plugins.concat([
        new webpack.optimize.OccurenceOrderPlugin(true),
        new webpack.optimize.UglifyJsPlugin()
    ]);
}

module.exports = webpackConfig;
