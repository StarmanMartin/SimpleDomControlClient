const path = require('path');

module.exports = {experiments: {
        outputModule: true,
    },

    output: {
        path: path.resolve('dist'),
        filename: "index.js",
        library: {
            type: "module",
        },
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: ['babel-loader']
        }
        ]
    }
};