var gulp = require("gulp");

opts = {
    directory: "libs",
    deps: {
        angular: {
            version: "1.2.3",
            files: "angular.js"
        }
    },
}
var bower = require("../main")(opts);

bower.installtask(gulp);

gulp.task("default", ['bower'])
