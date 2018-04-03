var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    pump = require('pump'),
    rename = require('gulp-rename');


gulp.task('build', function(callback) {
    pump([
        gulp.src('src/jquery.depend.js'),
        uglify({
            output: {
                comments: /^!/i 
            }
        }),
        rename({suffix: '.min'}),
        gulp.dest('dist')
    ], callback);
});
