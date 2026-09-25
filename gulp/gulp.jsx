const sass = require('gulp-sass')(require('sass'));
const {src, dest, series, parallel} = require('gulp');
const fs = require('fs');
const exec = require('gulp-exec');
const dotenv = require("dotenv");
const gulp = require('gulp');

function scss(bundle_mode = false) {
  const src_path = bundle_mode ? './src/*/*.scss' : './src/*.scss';
  const dest_path = bundle_mode ? './bin' : '../static';
  return function scss() {
    return src(src_path, {follow: true})
      .pipe(sass().on('error', sass.logError))
      .pipe(dest(dest_path));
  }
}

/**
 * Copies the client sources (following the linked app directories) to ./_build,
 * which the bundle tasks use as input.
 *
 * @returns {*}
 */
function pre_compile_javascript() {
  let fileExtensions = process.env.JS_CILENT_FILE_EXTENTIONS?.split(',') || ['.js', '.json'];
  return src(fileExtensions.map((x) => `./src/**/*${x}`), {follow: true})
    .pipe(dest('./_build'));
}

function clean(done) {
  fs.rm('./_build', {recursive: true, force: true}, done);
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
      .pipe(exec(file => `${python} ${file.path} sdc_update_links`, options))
      .pipe(exec(file => `${python} ${file.path} sdc_make_model_js`, options)
        .on('error', function (err) {
          console.error('Error:', err.message);
          console.error(error_msg);
          this.emit('end'); // Continue with the next task
        }))
      .on('end', () => {
        process.chdir('./Assets');
      });
  } catch {
    console.error(error_msg);
    process.chdir('./Assets');
    cb();
  }

}


exports.sdc_watch_scss = function () {
  const watcher = gulp.watch('./src/**/*.scss', {followSymlinks: true});
  watcher.on('change', (a) => {
    console.log(`${a} has changed! SCSS is recompiling...`);
    scss()().on('end', () => {
      console.log(`... recompiling done!`);
    });
  });
}

function webpack_series_factory(webpack_task) {

  return series(clean, pre_compile_javascript, webpack_task, clean);
}

exports.sdc_webpack_series_factory = webpack_series_factory

exports.sdc_watch_webpack_factory = (webpack_task, cb) => {
  return function () {
    // const watcher = chokidar.watch('./src/**/*.js', {followSymlinks: true});

    const watcher = gulp.watch('src/**/*.js', {
      followSymlinks: true,   // ✅ this enables following symlinks
      usePolling: false,      // optional
      ignored: /node_modules/,
    })
    watcher.on('change', (a) => {
      console.log(`${a} has changed! javascript is recompiling...`);
      webpack_series_factory(webpack_task)();
      cb && cb();
    });
  };
};

exports.sdc_default_build_factory = (webpack_task) => {
  return series(link_files, parallel(scss(), webpack_series_factory(webpack_task)));
};

exports.sdc_default_bundle_factory = (webpack_task) => {
  return series(link_files, parallel(scss(true), webpack_series_factory(webpack_task)));
};

exports.sdc_scss = scss();
exports.sdc_bundle_scss = scss();
exports.sdc_clean = clean;
exports.sdc_link_files = link_files;
exports.sdc_pre_compile_javascript = pre_compile_javascript;
