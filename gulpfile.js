// ######################################################
// ## Variables
// ######################################################

var gulp = require('gulp');

// ======================================================
// =  Server & Browsersync
// ======================================================
var connect = require('gulp-connect');
var browserSync = require('browser-sync');
var reload  = browserSync.reload;

// ======================================================
// =  CSS variables
// ======================================================
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var cleanCss = require('gulp-clean-css');

// ======================================================
// =  JS variables
// ======================================================
var uglify = require('gulp-uglify');
var ngAnnotate = require('gulp-ng-annotate');
var htmlify = require('gulp-angular-htmlify');
var templateCache = require('gulp-angular-templatecache');

// ======================================================
// =  Misc variables
// ======================================================
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
//var rev = require('gulp-rev');
//var replace = require('gulp-replace');
var rename = require('gulp-rename');

//var request = require('request');
var runSequence = require('run-sequence');
var shell = require('gulp-shell');
var gutil = require('gulp-util');
var fs = require("fs");
var del = require('del');

// ======================================================
// =  Path variables
// ======================================================
var static_dir = 'src/static/';
var bower_dir = 'bower_components/';
var scss_dir = 'src/assets/scss/';
var js_dir = 'src/assets/js/';


var paths = {
    js_vendor: [
        bower_dir + 'angular/angular.js',
        bower_dir + 'ngFlowchart/dist/ngFlowchart.js',
        bower_dir + 'ng-file-upload/ng-file-upload.js',
        bower_dir + 'ng-file-upload/ng-file-upload-shim.js',
        bower_dir + 'angular-file-saver/dist/angular-file-saver.bundle.js',
        bower_dir + 'angular-cookies/angular-cookies.js',
    ],
    css_vendor: [
        //bower_dir + 'bootstrap/dist/css/bootstrap.css',
        bower_dir + 'normalize-css/normalize.css',
        //bower_dir + 'ngFlowchart/dist/flowchart.css',
        //bower_dir + 'ngFlowchart/dist/onedatastyle.css',
        bower_dir + 'font-awesome/css/font-awesome.css',
    ],
    fonts: [
        //bower_dir + 'bootstrap/dist/fonts/*',
        bower_dir + 'font-awesome/fonts/*'
    ],
    images: [
        'assets/src/images/*'
    ]
};

// ======================================================
// =  Config variables
// ======================================================
var config = {
    scss: {
        src: [
            scss_dir + '**/main.scss',
            scss_dir + '**/*.scss'
        ]
    },
    js: {
        src: [
            js_dir + '**/main.js',
            //js_dir + '**/app.config.js',
            js_dir + '**/*.js'
        ],
        templates: [
            js_dir + '/**/*.html'
        ]
    }
};


// ######################################################
// ## Server
// ######################################################

// ======================================================
// = Simple server
// ======================================================

gulp.task('server-dev', function () {
  connect.server({
    root: ['src'],
    port: 3000
  });
});

// ======================================================
// =  Browser sync proxy
// ======================================================
gulp.task('browser-sync', function() {
    browserSync({
        proxy: '0.0.0.0:3000',
        port: 4000,
        open: false,
        notify: false,
        files: [
            "src/static/css/**/*.css",
            "src/static/js/**/*.js",
            "src/*.html"
            //"templates/**/*.html"
        ]
    });
});

// ======================================================
// =  Watch for file changes and compile
// ======================================================
gulp.task('watch', ['browser-sync', 'compile', 'fonts', 'images'], function () {
    // CSS
    gulp.watch(config.scss.src, ['css:main']);
    // JS
    gulp.watch(config.js.src, ['js:main']);
    //gulp.watch(config.js.templates, ['js:templates']);
});


// ######################################################
// ## CSS
// ######################################################

// ======================================================
// =  Compile vendor CSS
// ======================================================
gulp.task('css:vendor', function() {
    return gulp.src(paths.css_vendor)
        .pipe(sourcemaps.init())
        .pipe(concat('vendor.css'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('src/static/css'));
});

gulp.task('css:vendor:prod', function() {
    return gulp.src(paths.css_vendor)
        .pipe(concat('vendor.css'))
        .pipe(gulp.dest('src/static/css'));
});

// ======================================================
// =  Compile main CSS
// ======================================================
gulp.task('css:main', function() {
    return gulp.src(config.scss.src)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer('last 3 version'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('src/static/css'));
});

gulp.task('css:main:prod', function() {
    return gulp.src(config.scss.src)
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer('last 3 version'))
        .pipe(gulp.dest('src/static/css'));
});

// ------------------------------------------------------
gulp.task('css.compile', ['css:main', 'css:vendor']);
gulp.task('css.compile:prod', ['css:main:prod', 'css:vendor:prod']);

// ######################################################
// ## JS & templates
// ######################################################

// ======================================================
// =  Compile vendor JS for panel
// ======================================================

gulp.task('js:vendor', function() {
    return gulp.src(paths.js_vendor, { base: 'js' })
        .pipe(sourcemaps.init())
        .pipe(concat('vendor.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('src/static/js'));
});

gulp.task('js:vendor:prod', function() {
    return gulp.src(paths.js_vendor, { base: 'js' })
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest('src/static/js'));
});

// ======================================================
// =  Compile main JS
// ======================================================
gulp.task('js:main', function () {
    return gulp.src(config.js.src, { base: 'js' })
        .pipe(sourcemaps.init({debug: true}))
        .pipe(ngAnnotate({
            add: true,
            map: true
        }))
        .pipe(concat('main.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('src/static/js'));
});

gulp.task('js:main:prod', function () {
    return gulp.src(config.js.src, { base: 'js' })
        .pipe(ngAnnotate({
            add: true,
            map: true
        }))
        .pipe(concat('main.js'))
        .pipe(gulp.dest('src/static/js'));
});

// ------------------------------------------------------
gulp.task('js.compile', ['js:main', 'js:vendor']);
gulp.task('js.compile:prod', ['js:main:prod', 'js:vendor:prod']);


// ######################################################
// ## Other assets
// ######################################################

// ======================================================
// =  Copy fonts to static folder
// ======================================================
gulp.task('fonts', function() {
    return gulp.src(paths.fonts)
        .pipe(gulp.dest('src/static/fonts'));
});

// ======================================================
// =  Copy images to static folder
// ======================================================
gulp.task('images', function() {
    return gulp.src(paths.images)
        .pipe(gulp.dest('src/static/images'));
});

// ######################################################
// ## Compile assets
// ######################################################

gulp.task('compile', ['css.compile', 'js.compile']);
//gulp.task('compile:prod', ['css.compile:prod', 'js.compile:prod']);