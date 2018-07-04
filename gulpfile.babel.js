import fs from 'fs';
import del from 'del';
import path from 'path';
import cssnano from 'cssnano';
import atImport from 'postcss-import';
import cssnext from 'postcss-cssnext';
import plumber from 'gulp-plumber';
import notify from 'gulp-notify';

import gulp from 'gulp';
import shell from 'gulp-shell';
import replace from 'gulp-replace';
import runSequence from 'run-sequence';
import htmlmin from 'gulp-htmlmin';
import rev from 'gulp-rev';
import revReplace from 'gulp-rev-replace';
import postcss from 'gulp-postcss';
import concat from 'gulp-concat';

import webpack from 'webpack';
import MinifyPlugin from 'babel-minify-webpack-plugin';
import browserSync from 'browser-sync';

import "babel-register";


const DATA = ['data/*.json'];
const CRITICAL_STYLES = ['styles/critical/main.css'];
const STYLES = ['styles/*.css'];
const ALLSTYLES = ['styles/**/*.css'];
const ALLJS = ['scripts/**/*.js'];
const IMAGES = ['images/**/*.{svg,png}'];
const ROOT = ['*.{txt,ico,go}', 'manifest.json', 'sw.js', 'app.yaml'];
const HTML = ['*.html'];
const WELL_KNOWN = ['well_known/**.*'];

const BROWSERS = ['last 2 Chrome versions', 'last 2 Firefox versions',
  'last 2 Safari versions', '> 1%', 'not last 2 OperaMini versions'];
const CSS_AT_IMPORT = [atImport()];
const CSS_NEXT = [
  cssnext({browsers: BROWSERS, features: {
    customProperties: {preserve: true, warnings: false},
    colorFunction: false,
  }}),
];
const CSS_NANO = [
  cssnano({
    autoprefixer: false,
    browsers: BROWSERS,
    zindex: false,
    discardComments: {removeAll: true},
  }),
];

const REV_MANIFEST = '.temp/rev-manifest.json';

const errorHandler = function() {
  var args = Array.prototype.slice.call(arguments);
  notify.onError({
      title: 'Compile Error',
      message: '<%= error.message %>',
      sound: 'Submarine'
  }).apply(this, args);
  this.emit('end');
};

gulp.task('clean', () => {
  return del(['.temp', 'dist']);
});

gulp.task('critical-styles', () => {
  return gulp.src(CRITICAL_STYLES)
    .pipe(plumber({
          errorHandler: errorHandler
    }))
    .pipe(postcss(CSS_AT_IMPORT))
    .pipe(concat('critical.css'))
    .pipe(postcss(CSS_NEXT))
    .pipe(gulp.dest('.temp/styles'));
});

gulp.task('critical-styles-min', ['critical-styles'], () => {
  return gulp.src('.temp/styles/critical.css')
      .pipe(plumber({
        errorHandler: errorHandler
    }))
    .pipe(concat('critical.min.css'))
    .pipe(postcss(CSS_NANO))
    .pipe(gulp.dest('.temp/styles'));
});

gulp.task('styles', ['critical-styles-min'], () => {
  let processedCritical =
      fs.readFileSync('.temp/styles/critical.css', 'utf8');
  return gulp.src(CRITICAL_STYLES.concat(STYLES))
    .pipe(plumber({
        errorHandler: errorHandler
    }))
    .pipe(postcss(CSS_AT_IMPORT))
    .pipe(concat('styles.css'))
    .pipe(postcss(CSS_NEXT))
    // Remove all critical styles from the generated file.
    // This allows us to maintain our build pipeline and use information in the
    // critical styles without repeating it in the lazy-loaded ones.
    // Assumes that the pipeline produces deterministic and incremental code.
    .pipe(replace(processedCritical, ''))
    .pipe(gulp.dest('.temp/styles'));
});

gulp.task('styles-min', ['styles'], () => {
  return gulp.src('.temp/styles/styles.css')
    .pipe(plumber({
          errorHandler: errorHandler
      }))
    .pipe(concat('styles.min.css'))
    .pipe(postcss(CSS_NANO))
    .pipe(gulp.dest('.temp/styles'));
});

gulp.task('styles-rev', ['styles-min'], () => {
  return gulp.src('.temp/styles/styles.min.css')
    .pipe(rev())
    .pipe(gulp.dest('dist/styles'))
    .pipe(rev.manifest(REV_MANIFEST, {
      base: '.temp',
      merge: true,
    }))
    .pipe(gulp.dest('.temp'));
});

gulp.task('webpack', (callback) => {
  // Run WebPack.
  webpack([
    {
      entry: {
        main: './scripts/main.js',
      },
      module: {
        rules: [
          {
            test: /\.js$/,
            use: {
              loader: 'babel-loader',
              options: {
                shouldPrintComment: () => false,
                compact: true,
                presets: [['env', {
                  targets: {
                    browsers: BROWSERS,
                  },
                  modules: false,
                }]],
                plugins: ['syntax-dynamic-import'],
              },
            },
          },
        ],
      },
      plugins: [
        new MinifyPlugin({simplify: false, mangle: false}),
      ],

      output: {
        filename: 'scripts/[name].js',
        chunkFilename: 'scripts/views/view-[name].js',
        path: path.resolve(__dirname, '.temp/'),
      },
    },
  ], function(err, stats) {
    if (err) {
      throw new gutil.PluginError('webpack', err);
    }
    callback();
  });
});

gulp.task('scripts', ['webpack'], () => {
  return gulp.src('.temp/scripts/views/**/*')
      .pipe(gulp.dest('dist/scripts/views'));
});

gulp.task('data', () => {
  return gulp.src(DATA)
    .pipe(rev())
    .pipe(gulp.dest('dist/data'))
    .pipe(rev.manifest(REV_MANIFEST, {
      base: '.temp',
      merge: true,
    }))
    .pipe(gulp.dest('.temp'));
});

gulp.task('images', () => {
  return gulp.src(IMAGES)
    .pipe(rev())
    .pipe(gulp.dest('dist/images/'))
    .pipe(rev.manifest(REV_MANIFEST, {
      base: '.temp',
      merge: true,
    }))
    .pipe(gulp.dest('.temp'));
});

gulp.task('root', () => {
  return gulp.src(ROOT)
    // Replace links with revisioned URLs.
    .pipe(revReplace({
      replaceInExtensions: ['.js', '.yaml', '.json', '.txt', '.html'],
      manifest: gulp.src(REV_MANIFEST),
    }))
    .pipe(gulp.dest('dist/'));
});

gulp.task('html', () => {
  return gulp.src(HTML)
    // Inline critical path CSS.
    .pipe(replace('<!-- {% include critical css %} -->', (s) => {
      let style = fs.readFileSync('.temp/styles/critical.min.css', 'utf8');
      return '<style>\n' + style + '\n</style>';
    }))
    // Inline main JS.
    .pipe(replace('<!-- {% include main js %} -->', (s) => {
      let script = fs.readFileSync('.temp/scripts/main.js', 'utf8');
      return '<script>\n' + script + '\n</script>';
    }))
    // Replace links with revisioned URLs.
    .pipe(revReplace({
      manifest: gulp.src(REV_MANIFEST),
    }))
    // Minify HTML.
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true,
    }))
    .pipe(gulp.dest('dist/'));
});

gulp.task('wellknown', () => {
  return gulp.src(WELL_KNOWN).pipe(gulp.dest('dist/well-known/'));
});

gulp.task('build', (callback) => {
  runSequence(
    'clean',
    ['styles-rev', 'scripts', 'data', 'images', 'wellknown'],
    ['root', 'html'],
    callback
  );
});


gulp.task('watch', (callback) => {
  runSequence(
    ['styles-rev', 'scripts', 'data', 'wellknown'],
    ['root', 'html'],
    callback
  )
});

gulp.task('serve', function () {

  var watchFiles =  [ALLSTYLES, ALLJS, IMAGES, ROOT, HTML].reduce((acc, cur) => acc.concat(cur), []);
  gulp.watch(watchFiles, ['watch']);

  browserSync.create().init({
      server: {
          baseDir: './dist',
          directory: false,
          serveStaticOptions: {
              extensions: ['html']
          }
      },
      files:[
        './dist/**/*'
      ],
      port:  8080,
      logLevel: 'info', // 'debug', 'info', 'silent', 'warn'
      logConnections: false,
      logFileChanges: true,
      open: false,
      notify: false,
      ghostMode: false,
      online: false,
      tunnel: null
  });

});

