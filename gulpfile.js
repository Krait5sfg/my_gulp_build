"use strict";

var gulp = require("gulp");
var browserSync = require("browser-sync").create();
var htmlmin = require("gulp-htmlmin");
var sass = require("gulp-sass");
var csso = require("gulp-csso");
var rename = require("gulp-rename");
var plumber = require("gulp-plumber");
var sourcemaps = require("gulp-sourcemaps");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var del = require("del");
var imagemin = require("gulp-imagemin");
var webp = require("gulp-webp");
var svgstore = require("gulp-svgstore");
var posthtml = require("gulp-posthtml");
var include = require("posthtml-include");
var uglify = require("gulp-uglify");
var pipeline = require("readable-stream").pipeline;

gulp.task("server", function () {
  browserSync.init({
    server: "build" //запускает сервер из файлов в папке build
  });

  //при изменении svg запускает задачу по сборке спрайта и обновляет браузер
  gulp.watch("source/img/*.svg", gulp.series("sprite", "html", "refresh"));
  //при изменении js файлов запускает задачу min-js и обновляет браузер
  gulp.watch("source/js/*.js", gulp.series("min-js", "refresh"));
  //при изменении любых scss файлов запускает задачу css и обновляет браузер
  gulp.watch("source/sass/**/*.scss", gulp.series("css", "refresh"));
  //при измненении Html файлов в source запускает задачу html
  //которая копирует и минифицирует файлы Html в папку build
  gulp.watch("source/*.html", gulp.series("html", "refresh"));
});

gulp.task("html", function () {
  return gulp.src("source/*.html")
    .pipe(posthtml([
      include()
    ]))
    .pipe(htmlmin({
      collapseWhitespace: true
    }))
    .pipe(gulp.dest("build"));
})

gulp.task("css", function () {
  return gulp.src("source/sass/style.scss")
    .pipe(plumber()) //предотвращяет от pipe breaking
    .pipe(sourcemaps.init()) //инициализируем sourcemaps
    .pipe(sass())
    .pipe(postcss([
      autoprefixer() //добавляет префиксы
    ]))
    .pipe(gulp.dest("build/css")) //неминифицированный css
    .pipe(csso()) //минификация
    .pipe(rename({ //добавляет к файлу суфикс .min
      suffix: ".min"
    }))
    .pipe(sourcemaps.write(".")) //записывает файл style.min.css.map в текущую папку
    .pipe(gulp.dest("build/css")); //минифицированный css
});

//оптимизирует все изображения (png, jpg, svg)
//оригинальные изображения остаются в source
//сжатые переносятся в build/img
gulp.task("images", function () {
  return gulp.src("source/img/**/*.{png,jpg,svg}")
    .pipe(imagemin([
      imagemin.optipng({ optimizationLevel: 3 }),
      imagemin.mozjpeg({ progressive: true }),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest("build/img"));
});

//конвертирует изображения в webp
gulp.task("webp", function () {
  return gulp.src("source/img/**/*.{png,jpg}")
    .pipe(webp({
      quality: 90
    }))
    .pipe(gulp.dest("build/img"));
});

gulp.task("refresh", function (done) {
  browserSync.reload();
  done();
});

gulp.task("delete", function () {
  return del("build");
});

//собирает из svg спрайт. в спрайты есть смысл собирать иконки и логотипы
//поэтому такие svg лучше называть с приставкой в начале icon (например icon-logo.svg)
gulp.task("sprite", function () {
  return gulp.src("source/img/icon-*.svg")
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("build/img"));
});

//минимизируем js
gulp.task("min-js", function () {
  return pipeline(
    gulp.src("source/js/*.js"),
    uglify(),
    rename({
      suffix: ".min"
    }),
    gulp.dest("build/js")
  );
});

//Копируем шрифты. Задача должна быть записана именно так
//иначе выдаст ошибку
gulp.task("copy", function () {
  return gulp.src([
    "source/fonts/**/*.{woff,woff2}"
  ], {
    base: "source"
  })
    .pipe(gulp.dest("build"));
});

gulp.task("build", gulp.series("delete", "copy", "css", "sprite", "min-js", "html"))
gulp.task("start", gulp.series("build", "server"));