bower = require("bower")
fs = require("fs")
gutil = require("gulp-util")
through = require("through2")
path = require('path')

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
    gutil.log "Bower: Using cwd: ", opts.cwd or process.cwd()
    gutil.log "Bower: Using bower dir: ", dir

    bowerspecs = []
    process_deps = (deps) ->
        unless deps?
            return []

        file_list = []
        for name, spec of deps
            if not Array.isArray(spec.files)
                spec.files = [spec.files]
            all_exist = true

            moduledir = path.resolve(dir, name)
            unless fs.existsSync(moduledir)
                all_exist = false

            for file in spec.files
                file = path.resolve(dir, name, file)
                file_list.push(file)
                unless fs.existsSync(file)
                    all_exist = false

            unless all_exist
                bowerspecs.push(name + "#" + spec.version)
        return file_list
    deps = process_deps(opts.deps)
    testdeps = process_deps(opts.testdeps)
    opts.interactive ?= false

    installtask: (gulp, taskname) ->
        taskname ?= "bower"
        gulp.task taskname, [], ->
            stream = through.obj((file, enc, callback) ->
                @push file
                callback()
                return
            )
            if bowerspecs.length > 0
                bower.commands.install(bowerspecs, {}, opts).on("log", (result) ->
                    gutil.log [
                        "bower"
                        gutil.colors.cyan(result.id)
                        result.message
                    ].join(" ")
                    return
                ).on("error", (error) ->
                    stream.emit "error", new gutil.PluginError("gulp-bower-deps", error)
                    stream.end()
                    return
                ).on "end", ->
                    stream.end()
                    stream.emit "end"
                    return
            else
                gutil.log "Bower: everything installed! nothing to do"
                stream.end()
                stream.emit "end"

            stream
        return

    deps: deps
    testdeps: testdeps
