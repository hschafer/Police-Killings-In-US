var webpack = require('webpack');

module.exports = {
    entry: './js/main.js',
    devtool: 'cheap-module-source-map',
    output: {
        filename: './js/bundle.js'
    },
    module: {
        loaders: [
            {
                test: /\.scss$/,
                loaders: ["style-loader", "css-loader", "sass-loader"]
            },
            {
                test: /\.(jpe?g|png|gif|svg)$/,
                loader: "file-loader"
            }
        ]
    }
};
