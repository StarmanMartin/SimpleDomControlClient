'use strict'

const gulp = require('gulp');
const webpack = require('webpack-stream');
var named = require('vinyl-named');

function javascript() {
    const webpack_config = (process.env.NODE_ENV === 'development' ? './webpack.config/webpack.development.config.cjs' : './webpack.config/webpack.production.config.cjs');

    return gulp.src('./src/index.js')
        .pipe(named())
        .pipe(webpack(require(webpack_config)))
        .pipe(gulp.dest('./dist'));
}


gulp.task('development', gulp.series((done) => {
    process.env.NODE_ENV = 'development'
    done();
}, javascript));

gulp.task('build', gulp.series((done) => {
    process.env.NODE_ENV = 'production'
    done();
}, javascript));
