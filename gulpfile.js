/*
  Gulp.js configuration
  Minifies changed images, compiles Sass, auto-prefixes and LiveReloads

  [sudo]
  npm install --save-dev -g gulp
  npm install --save-dev gulp
  npm install --save-dev gulp-changed gulp-sass gulp-autoprefixer gulp-imagemin browser-sync

  If a package.json file has been defined, '[sudo] npm install' will install dependencies.
*/

// include gulp and plug-ins
var
  gulp = require('gulp'),
  changed = require('gulp-changed'),
  sass = require('gulp-sass'),
  autoprefix = require('gulp-autoprefixer'),
  imagemin = require('gulp-imagemin'),
  browsersync = require('browser-sync');

// constants
var
  src = 'src/',
  dst = '',
  images = {
    'in':  src + 'images/**/*',
    'out': dst + 'images/'
  },
  css = {
    'in':  src + 'scss/**/*',
    'out': dst + 'css/'
  },
  js = {
    'out': dst + 'js/'
  },
  update = [dst + 'index.html', images.out + '*.*', css.out + '*.css', js.out + '*.js'];

// minify images
gulp.task('images', function() {
  return gulp.src(images.in)
    .pipe(changed(images.out))
    .pipe(imagemin())
    .pipe(gulp.dest(images.out));
});

// compile Sass
gulp.task('sass', function() {
  return gulp.src(css.in)
    .pipe(sass({errLogToConsole: true}))
    .pipe(autoprefix("last 1 version", "> 1%", "ie 8"))
    .pipe(gulp.dest(css.out));
});

// browser sync
gulp.task('browsersync', function() {
  browsersync.init(update, {
    server: {
      baseDir: "./"
    }
  });
});

// default task
gulp.task('default', ['sass', 'images', 'browsersync'], function() {

  // CSS changes
  gulp.watch(css.in, ['sass']);

  // image changes
  gulp.watch(images.in, ['images']);

});
