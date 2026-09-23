'use strict'

const gulp = require('gulp');
const webpack = require('webpack');

function javascript(done) {
    const webpack_config = (process.env.NODE_ENV === 'development' ? './webpack.config/webpack.development.config.cjs' : './webpack.config/webpack.production.config.cjs');

    const config = Object.assign({entry: {index: './src/index.js'}}, require(webpack_config));

    webpack(config, (err, stats) => {
        if (err) {
            return done(err);
        }

        console.log(stats.toString({colors: true, chunks: false}));
        return done(stats.hasErrors() ? new Error('webpack build failed') : undefined);
    });
}


gulp.task('development', gulp.series((done) => {
    process.env.NODE_ENV = 'development'
    done();
}, javascript));

gulp.task('build', gulp.series((done) => {
    process.env.NODE_ENV = 'production'
    done();
}, javascript));
