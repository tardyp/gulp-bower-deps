Q = require("q")
fs = require('fs')
path = require('path')
Logger = require("bower-logger")
Project = require("bower/lib/core/Project")
Tracker = require("bower/lib/util/analytics").Tracker
defaultConfig = require('bower/lib/config')
fs = require("fs")
gutil = require("gulp-util")
through = require("through2")
path = require('path')
mout = require('mout')


module.exports = (opts) ->
    opts = directory: opts    if typeof opts is "string"
    opts = opts or {}

    unless opts.directory
        bowerrc = (opts.cwd or ".") + "/.bowerrc"
        if fs.existsSync(bowerrc)
            bower_config = JSON.parse(fs.readFileSync(bowerrc))
            opts.directory = bower_config.directory
        opts.directory = opts.directory or "./bower_components"

    dir = opts.directory
    summaryfile = path.join(dir, 'bowerdeps.js')

    # generate bowerjson automatically
    bowerjson = {
        name: 'foo'
        dependencies:{}
    }
    process_deps = (deps) ->
        unless deps?
            return []

        file_list = []
        for name, spec of deps
            if not Array.isArray(spec.files)
                spec.files = [spec.files]

            moduledir = path.resolve(dir, name)
            unless fs.existsSync(moduledir)
                all_exist = false

            for file in spec.files
                file = path.resolve(dir, name, file)
                file_list.push(file)

            bowerjson.dependencies[name] = spec.version
        return file_list
    deps = process_deps(opts.deps)
    deps.push(summaryfile)
    testdeps = process_deps(opts.testdeps)
    opts.interactive ?= false

    installtask: (gulp, taskname = "bower") ->
        gulp.task taskname, [], ->
            gutil.log "Bower: Using cwd: ", opts.cwd or process.cwd()
            gutil.log "Bower: Using bower dir: ", dir
            stream = through.obj((file, enc, callback) ->
                @push file
                callback()
                return
            )
            logger = new Logger()
            logger.on "log", (log) ->
                gutil.log [
                    "Bower"
                    gutil.colors.cyan(log.id)
                    log.message
                ].join(" ")
            config = opts
            options = {}
            config = mout.object.deepFillIn(config || {}, defaultConfig)
            options.save ?= config.defaultSave
            project = new Project(config, logger)
            project._json = bowerjson
            project._jsonFile = "bower.json"
            project.saveJson = -> Q.resolve()
            tracker = new Tracker(config)
            decEndpoints = []
            tracker.trackDecomposedEndpoints('install', decEndpoints)
            project.install(decEndpoints, options, config).then (installed) ->
                summary = "(function(){ var _global = (0, eval)('this');\n"
                summary += "if (typeof _global.BOWERDEPS === 'undefined') { _global.BOWERDEPS = {}; }\n"
                for k, v of project._manager._installed
                    if v?
                        installed[k] = {pkgMeta: v}
                console.log installed
                stripPrivate = (a) ->
                    r = {}
                    for k, v of a
                        if k[0] != '_'
                            r[k] = v
                    return JSON.stringify(r)
                for k, v of opts.deps
                    if installed.hasOwnProperty(k)
                        summary += "\n_global.BOWERDEPS['#{k}'] = "
                        summary += "#{stripPrivate(installed[k].pkgMeta)};"
                summary += "})();"
                fs.writeFileSync(summaryfile, summary)
                stream.end()
                stream.emit "end"
            , (error) ->
                stream.emit "error", new gutil.PluginError("gulp-bower-deps", error)
                stream.end()

            stream
        return

    deps: deps
    testdeps: testdeps
