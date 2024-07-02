const sass = require('gulp-sass')(require('sass'));
const through = require('through2');
const {src, dest, series, parallel} = require('gulp');
const gclean = require('gulp-clean');
const fs = require('fs');
const exec = require('gulp-exec');
const dotenv = require("dotenv");
const chokidar = require("chokidar");

function scss() {
    return src('./src/*.scss', {follow: true})
        .pipe(sass().on('error', sass.logError))
        .pipe(dest('../static'));
}

/**
 * Precompiler presets properties of the sdc controller.
 * Sets on_init argument names as _on_init_params names list
 * as prototype property to the controller
 *
 * @returns {*}
 */
function pre_compile_javascript() {
    let file_extentions = process.env.JS_CILENT_FILE_EXTENTIONS || ['.js', '.json'];
    return src(file_extentions.map((x)=> `./src/**/*${x}`), {follow: true})
        .pipe(through.obj(function (obj, enc, next) {
            let srcFile = obj.path
            if (!obj.isNull() && !obj.isDirectory() && obj.isBuffer() && /.js$/.test(srcFile)) {
                let file_content = obj.contents.toString().split('\n');
                let controller_name = null;
                let on_init_p_name = null;
                file_content.forEach((element) => {
                    if (!controller_name) {
                        let a = element.match(/class (.*)\s+extends\s*AbstractSDC /);
                        if (a) controller_name = a[1];
                    }
                    if (!on_init_p_name) {
                        let a = element.match(/^\s*onInit\s*\((.*)\)\s*\{/);
                        if (a) on_init_p_name = a[1].split(/\s*,\s*/).join('", "');
                    }


                });
                if (file_content && controller_name && on_init_p_name) {
                    file_content.push(`${controller_name}.prototype._on_init_params = function() {return ["${on_init_p_name}"]; };`);
                    obj.contents = Buffer.from(file_content.join('\n'));
                }

            }
            next(null, obj);
        }))
        .pipe(dest('./_build'));
}

function clean(done) {
    if (fs.existsSync('./_build')) {
        return src('./_build').pipe(gclean());
    } else {
        done()
    }
}

function link_files(cb) {
    dotenv.config({path: process.cwd() + '/.sdc_python_env'});
    let python = process.env.PYTHON
    if (!python) {
        console.error(`The environment variable PYTHON (Path to python interpreter) is not set. In this case link_files cannot be executed`);
    }

    process.chdir('..');
    const options = {
        continueOnError: true, // default = false, true means don't emit error event
        pipeStdout: true, // default = false, true means stdout is written to file.contents
    };
    const error_msg = `The environment variable PYTHON (Path to python interpreter) is not set. In this case link_files cannot be executed. Or the ${process.cwd()} is not correct`;
    try {
        return src('./manage.py')
            .pipe(exec(file => `${python} ${file.path} sdc_update_links`, options).on('error', function (err) {
                console.error('Error:', err.message);
                console.error(error_msg);
                this.emit('end'); // Continue with the next task
            })).on('end', () => {
                process.chdir('./Assets');
            });
    } catch {
        console.error(error_msg);
        process.chdir('./Assets');
        cb();
    }

}


exports.sdc_watch_scss = function () {
    const watcher = chokidar.watch('./src/**/*.scss', {followSymlinks: true});
    watcher.on('change', (a) => {
        console.log(`${a} has changed! SCSS is recompiling...`);
        scss().on('end', () => {
            console.log(`... recompiling done!`);
        });
    });
}

function webpack_series_factory(webpack_task) {
    return series(clean, pre_compile_javascript, webpack_task, clean);
}

exports.sdc_webpack_series_factory = webpack_series_factory

exports.sdc_watch_webpack_factory = (webpack_task) => {
    return function () {
        const watcher = chokidar.watch('./src/**/*.js', {followSymlinks: true});

        watcher.on('change', (a) => {
            console.log(`${a} has changed! javascript is recompiling...`);
            webpack_series_factory(webpack_task)();
        });
    };
};

exports.sdc_default_build_factory = (webpack_task) => {
    return series(link_files, parallel(scss, webpack_series_factory(webpack_task)));
};

exports.sdc_scss = scss;
exports.sdc_clean = clean;
exports.sdc_link_files = link_files;
exports.sdc_pre_compile_javascript = pre_compile_javascript;
