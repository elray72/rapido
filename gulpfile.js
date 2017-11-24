/** ====================================================================================================================
 Gulpfile
===================================================================================================================== */

var gulp = require('gulp'),
    plugins = require('gulp-load-plugins')({
        pattern: ['gulp-*', '*'],
        replaceString: 'gulp-',
        camelize: true,
        lazy: true
    }),
    _target = 'dev',
    _isRunning = false;

// TASK: Html
gulp.task('html', function () {

    // clean
    plugins.del.sync(['./dist/pages/**']);

    var index = gulp.src(['./src/pages/index.html'])
        .pipe(plugins.plumber())
        .pipe(gulp.dest('./dist'));

    var pages = gulp.src(['./src/pages/**/*.html', '!./src/pages/index.html'])
        .pipe(plugins.plumber())
        //.pipe(plugins.fileInclude())
        .pipe(gulp.dest('./dist/pages'));

    var components = gulp.src(['./src/components/*/*.html'])
        .pipe(plugins.plumber())
        //.pipe(plugins.fileInclude())
        .pipe(plugins.flatten())
        .pipe(gulp.dest('./dist/pages/components'));

    return plugins.mergeStream(index, pages, components);
});

// TASK: Css
gulp.task('css', function () {

    // clean
    plugins.del.sync(['./dist/css']);

    var css = gulp.src([
        './src/scss/main.scss'
    ])
    .pipe(plugins.plumber())
    .pipe(plugins.sourcemaps.init({loadMaps: true}))
    .pipe(plugins.sass({errLogToConsole: true, outputStyle: 'expanded'}).on('error', plugins.sass.logError))
    .pipe(plugins.autoprefixer('last 4 version'))
    .pipe(plugins.concat('style.css'))
    .pipe(plugins.sourcemaps.write())
    .pipe(gulp.dest('./dist/css'))
    .pipe(plugins.browserSync.reload({ stream: true }));

    if (_target === 'prod') {
        return css
            .pipe(plugins.cssnano())
            .pipe(plugins.rename({suffix: '.min'}))
            .pipe(plugins.sourcemaps.write('./'))
            .pipe(gulp.dest('./dist/css'));
    }

    return css;
});

// TASK: Js
gulp.task('js', function () {

    plugins.del.sync(['./dist/scripts/app.*']);

    var js = plugins.browserify({
        entries: ['src/js/app.js'],
        debug: true
    }).bundle()
        .on('error', function (err) {
            console.log(err.stack);
            this.emit('end');
        })
        .pipe(plugins.plumber())
        .pipe(plugins.vinylSourceStream('app.js'))
        .pipe(plugins.vinylBuffer())
        .pipe(plugins.sourcemaps.init({loadMaps: true}))
        .pipe(plugins.sourcemaps.write())
        .pipe(plugins.flatten())
        .pipe(gulp.dest('dist/scripts'));

    if (_target === 'prod') {
        return js
            .pipe(plugins.uglify())
            .pipe(plugins.rename({suffix: '.min'}))
            .pipe(plugins.sourcemaps.write('./'))
            .pipe(gulp.dest('dist/scripts'));
    }

    return js;
});

// TASK: Images
gulp.task('images', function () {

    // clean
    plugins.del.sync(['./dist/images']);

    var images = gulp.src(['./src/images/**/*'])
        .pipe(gulp.dest('./dist/images'));

    var components = gulp.src(['./src/components/**/images/*'])
        .pipe(plugins.flatten({ includeParents: 1} ))
        .pipe(gulp.dest('./dist/images/components'));

    return plugins.mergeStream(images, components);
});

// TASK: Fonts
gulp.task('fonts', function () {

    plugins.del.sync(['./dist/fonts']);

    var fonts = gulp.src(['./src/fonts/**/*', './src/components/_bootstrap/fonts/**/*'])
        .pipe(gulp.dest('./dist/fonts'));

    return fonts;
});

// TASK: SERVER
gulp.task('server', function () {
    plugins.browserSync({
        server: {
            //directory: true,
            baseDir: './dist'
        }
    });
});

// WATCH
gulp.task('watch', function () {

    // Html
    gulp.watch(['./src/pages/**/*.html', './src/components/**/*.html'], gulp.series('html'));

    // Css
    gulp.watch(['./src/scss/style.scss', './src/components/**/*.scss'], gulp.series('css'));

    // Js
    gulp.watch(['./src/js/app.js', './src/components/**/*.js'], gulp.series('js'));

    // Images
    gulp.watch(['./src/images/**/*', './src/components/**/images/*'], gulp.series('images'));

    // Fonts
    gulp.watch(['./src/fonts/**/*', './src/components/*/fonts/**/*'], gulp.series('fonts'));
});

//
// BUILD
gulp.task('build', gulp.parallel('html', 'css', 'js', 'images', 'fonts'));

//
// DEFAULT
gulp.task('default', gulp.series('build', gulp.parallel('server', 'watch')));

//
// DEPLOY:
gulp.task('target:prod', function () { _target = 'prod'; });
gulp.task('prod', gulp.series('target:prod','default'));