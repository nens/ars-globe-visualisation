module.exports = {
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: "style!css?modules"
      },
      {
        test: /\.(png|jpg|svg|woff|eot|ttf|otf)$/,
        loader: "url-loader?limit=100000"
      }
    ]
  }
};
