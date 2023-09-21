let _ = require('lodash');
const webpack = require("webpack");
let default_conf = require('./webpack.default.config.cjs');


let dev_conf = {
    mode: 'development',
    devtool: 'eval-source-map',
    plugins: [
        new webpack.SourceMapDevToolPlugin({})
    ]
};

default_conf.output.filename = "dev.[name].js"

module.exports = _.merge(default_conf, dev_conf);