let default_conf = require('./webpack.default.config.cjs');
const _ = require("lodash");


const prod_conf = {
    mode: 'production'
};

default_conf.output.filename = "ugly.[name].js"

module.exports = _.merge(default_conf, prod_conf);