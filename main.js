(function() {
  var Logger, Project, Q, Tracker, defaultConfig, fs, gutil, mout, path, through;

  Q = require("Q");

  Logger = require("bower-logger");

  Project = require("bower/lib/core/Project");

  Tracker = require("bower/lib/util/analytics").Tracker;

  defaultConfig = require('bower/lib/config');

  fs = require("fs");

  gutil = require("gulp-util");

  through = require("through2");

  path = require('path');

  mout = require('mout');

  module.exports = function(opts) {
    var bower_config, bowerjson, bowerrc, deps, dir, process_deps, testdeps;
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
    bowerjson = {
      name: 'foo',
      dependencies: {}
    };
    process_deps = function(deps) {
      var all_exist, file, file_list, moduledir, name, spec, _i, _len, _ref;
      if (deps == null) {
        return [];
      }
      file_list = [];
      for (name in deps) {
        spec = deps[name];
        if (!Array.isArray(spec.files)) {
          spec.files = [spec.files];
        }
        moduledir = path.resolve(dir, name);
        if (!fs.existsSync(moduledir)) {
          all_exist = false;
        }
        _ref = spec.files;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          file = _ref[_i];
          file = path.resolve(dir, name, file);
          file_list.push(file);
        }
        bowerjson.dependencies[name] = spec.version;
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
          var config, decEndpoints, logger, options, project, stream, tracker;
          gutil.log("Bower: Using cwd: ", opts.cwd || process.cwd());
          gutil.log("Bower: Using bower dir: ", dir);
          stream = through.obj(function(file, enc, callback) {
            this.push(file);
            callback();
          });
          logger = new Logger();
          logger.on("log", function(log) {
            return gutil.log(["Bower", gutil.colors.cyan(log.id), log.message].join(" "));
          });
          config = opts;
          options = {};
          config = mout.object.deepFillIn(config || {}, defaultConfig);
          if (options.save == null) {
            options.save = config.defaultSave;
          }
          project = new Project(config, logger);
          project._json = bowerjson;
          project._jsonFile = "bower.json";
          project.saveJson = function() {
            return Q.resolve();
          };
          tracker = new Tracker(config);
          decEndpoints = [];
          tracker.trackDecomposedEndpoints('install', decEndpoints);
          project.install(decEndpoints, options, config).then(function(res) {
            stream.end();
            return stream.emit("end");
          }, function(error) {
            stream.emit("error", new gutil.PluginError("gulp-bower-deps", error));
            return stream.end();
          });
          return stream;
        });
      },
      deps: deps,
      testdeps: testdeps
    };
  };

}).call(this);
