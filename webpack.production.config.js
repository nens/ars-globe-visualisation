const path = require("path");
var webpack = require("webpack");

var libraryName = "ars-globe";

const definePlugin = new webpack.DefinePlugin({
  'process.env': {
    'NODE_ENV': '"production"',
  },
});

var config = {
  context: path.join(__dirname, "src"),
  entry: [
    __dirname + "/src/index.js"
  ],
  devtool: false,
  output: {
    path: __dirname + "/dist",
    filename: libraryName + ".js",
    // publicPath: "/scripts/",
    library: libraryName,
    libraryTarget: "umd",
    umdNamedDefine: true
  },
  resolve: {
    extensions: [".js", ".jsx"]
  },
  module: {
    loaders: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader?modules", "postcss-loader"]
      },
      {
        test: /(\.jsx|\.js)$/,
        loader: "babel-loader",
        exclude: /(node_modules|bower_components)/
      },
      {
        test: /\.js$/,
        loader: "eslint-loader",
        exclude: /node_modules|LizardApiClient/
      },
      {
        test: /\.(png|jpg|svg|woff|eot|ttf|otf)$/,
        loader: "url-loader?limit=100000"
      }
    ]
  },
  plugins: [
    // new webpack.HotModuleReplacementPlugin(),
    // enable HMR globally

    // new webpack.NamedModulesPlugin(),
    // prints more readable module names in the browser console on HMR updates

    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': '"production"'
      },
    }),
  ]
};

module.exports = config;
