(function() {
  var bower, fs, gutil, path, through;

  bower = require("bower");

  fs = require("fs");

  gutil = require("gulp-util");

  through = require("through2");

  path = require('path');

  module.exports = function(opts) {
    var bower_config, bowerrc, bowerspecs, deps, dir, process_deps, testdeps;
    if (typeof opts === "string") {
      opts = {
        directory: opts
      };
    }
    opts = opts || {};
    if (!opts.directory) {
      bowerrc = (opts.cwd || ".") + "/.bowerrc";
      if (fs.existsSync(bowerrc)) {
        bower_config = JSON.parse(fs.readFileSync(bowerrc));
        opts.directory = bower_config.directory;
      }
      opts.directory = opts.directory || "./bower_components";
    }
    dir = opts.directory;
    gutil.log("Bower: Using cwd: ", opts.cwd || process.cwd());
    gutil.log("Bower: Using bower dir: ", dir);
    bowerspecs = [];
    process_deps = function(deps) {
      var all_exist, file, file_list, name, spec, _i, _len, _ref;
      if (deps == null) {
        return [];
      }
      file_list = [];
      for (name in deps) {
        spec = deps[name];
        if (!Array.isArray(spec.files)) {
          spec.files = [spec.files];
        }
        all_exist = true;
        _ref = spec.files;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          file = _ref[_i];
          file = path.resolve(dir, name, file);
          file_list.push(file);
          if (!fs.existsSync(file)) {
            all_exist = false;
          }
        }
        if (!all_exist) {
          bowerspecs.push(name + "#" + spec.version);
        }
      }
      return file_list;
    };
    deps = process_deps(opts.deps);
    testdeps = process_deps(opts.testdeps);
    if (opts.interactive == null) {
      opts.interactive = false;
    }
    return {
      installtask: function(gulp, taskname) {
        if (taskname == null) {
          taskname = "bower";
        }
        gulp.task(taskname, [], function() {
          var stream;
          stream = through.obj(function(file, enc, callback) {
            this.push(file);
            callback();
          });
          if (bowerspecs.length > 0) {
            bower.commands.install(bowerspecs, {}, opts).on("log", function(result) {
              gutil.log(["bower", gutil.colors.cyan(result.id), result.message].join(" "));
            }).on("error", function(error) {
              stream.emit("error", new gutil.PluginError("gulp-bower-deps", error));
              stream.end();
            }).on("end", function() {
              stream.end();
              stream.emit("end");
            });
          } else {
            gutil.log("Bower: everything installed! nothing to do");
            stream.end();
            stream.emit("end");
          }
          return stream;
        });
      },
      deps: deps,
      testdeps: testdeps
    };
  };

}).call(this);
