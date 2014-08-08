# gulp-bower-deps: defines your bower dependencies inside gulp configuration

### Yet another bower gulp plugin

This plugin is a tiny wrapper around bower api designed to avoid boilerplate as much as possible:

- no bower.json
- no bowerrc needed
- all bower configuration in one place, preferably not in a json file:
   * which bower package you need
   * where you place it
   * what file you use.

A problem with bower is that it does not defines clearly where files are supposed to be.
Developer can specify a main file, but they rarely do, and when they do this is never the version you want to have. Some prefer pre-minified, other prefer not minified, in order to debug.

This plugin allows you to specify in gulp the list of bower package you want to depend on, and which file you want to embed into your asset pipeline.

### Usage

{{{
opts = {
    directory: "libs",
    deps: {
        jquery: {
            version: "^2.0.0",
            files: "dist/jquery.js"
        },
        angular: {
            version: "~1.2.0",
            files: "angular.js"
        }
    },
    testdeps:{
        "angular-mock": {
            version: "~1.2.0",
            files: "angular-mock.js"
        }
    },
}
var bower = require("gulp-bower-deps")(opts);

bower.installtask(gulp);

...
gulp.src(bower.deps).pipe(...)

...
gulp.src(bower.testdeps).pipe(...)
}}}
The previous example is arguably much nicer in coffeescript.

* directory: directory, where bower will install the dependencies

* deps: dependencies specification, usually concatenated together for prod

* testdeps: dependencies specification for tests, concatenated in another file for tests


### Integration in a larger build system

This package is independent but made for guanlecoja, so you can see how it is used there.
https://www.npmjs.org/package/guanlecoja

### Credits

Some code based on:
https://github.com/zont/gulp-bower

### Changelog

#### 0.1.1
* fix bug where dep is not downloaded if files = []

#### 0.1.0
* initial release

