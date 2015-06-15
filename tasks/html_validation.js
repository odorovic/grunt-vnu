// Copyright

'use strict';

var fs = require('fs')
var mkdirp = require('mkdirp')
var spawn = require('child_process').spawnSync;
var path = require('path');
var temp = require('temp').track();
var _ = require('underscore');

module.exports = function (grunt) {

  grunt.registerMultiTask('validate_html', 'W3C nu html validation', function() {

    var options = this.options({
      templateSandwich: false,
    });

    var files = grunt.file.expand(this.filesSrc);

    var tmpFiles = _.map(files, function(item) {
        var tmpPath = path.join(temp.dir, item);
        mkdirp.sync(path.dirname(tmpPath))

        var itemContent = fs.readFileSync(item, {encoding: 'UTF-8'})
        if (options.templateSandwich === true) {
            var buns = '<!DOCTYPE html><html><head><title>NA</title></head>'+
                        '<body><!-- CONTENT --></body></html>';
            itemContent = buns.replace('<!-- CONTENT -->', itemContent);
            console.log(itemContent);
        }
        fs.writeFileSync(tmpPath, itemContent);
        return tmpPath
    });

    var args = ['-jar', path.normalize(path.join(__dirname, '../vnu/vnu.jar'))].concat(tmpFiles);

    var child = spawn('java', args, {encoding:'UTF-8'});

    if (child.status !== 0) {
        var errorStream = child.stderr.replace(
            new RegExp('file:' + temp.dir + '/', 'g'), '');
        grunt.log.writeln(errorStream);
        grunt.warn('HTML validation failed.');
    }
  });

};
