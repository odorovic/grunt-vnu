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
      customtags: [],
      customattrs: [],
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
      }
      fs.writeFileSync(tmpPath, itemContent);
      return tmpPath;
    });

    options.customtags = _.map(options.customtags, function(tag) {
        return tag.replace(/\*/g, '(.*)');
    });

    options.customattrs = _.map(options.customattrs, function(tag) {
        return tag.replace(/\*/g, '(.*)');
    });

    var vnuPath = ['-jar', path.normalize(path.join(__dirname, '../vnu/vnu.jar'))]
    var vnuOptions = ['--format', 'json']

    var args = [].concat(vnuPath).concat(vnuOptions).concat(tmpFiles);

    var child = spawn('java', args, {encoding:'UTF-8'});

    var errorReport = JSON.parse(child.stderr); //.replace(
            //new RegExp('file:' + temp.dir + '/', 'g'), '');

    errorReport.messages = _.filter(errorReport.messages, function(message) {
        var text = message.message;

        var customtag = _.find(options.customtags, function(tag) {
            var re = new RegExp('Element (.?)' + tag + '(.?) not allowed as child of element (.*)');

            if (re.test(text)) {
                return true;
            } else {
                return false;
            }
        })

        if (customtag === undefined) {
            return true;
        } else {
            return false;
        }
    });

    errorReport.messages = _.filter(errorReport.messages, function(message) {
        var text = message.message;

        var customattr = _.find(options.customattrs, function(attr) {
            var re = new RegExp('Attribute (.?)' + attr + '(.?) not allowed on element (.*) at this point.(.*)');

            if (re.test(text)) {
                return true;
            } else {
                return false;
            }
        })

        if (customattr === undefined) {
            return true;
        } else {
            return false;
        }
    })

    var prefixdir = temp.dir.replace(new RegExp('\\\\', 'g'), '/');

    if (errorReport.messages.length > 0) {
      _.each(errorReport.messages, function(message) {
        var file = message.url.replace(new RegExp('file:(.*)' + prefixdir + '/', 'g'), '');
        var msg = file + ':' + message.lastLine + ':' + message.firstColumn + ': ' + message.message;
        grunt.log.writeln(msg);
      });
      grunt.warn('HTML validation failed.')
    }
  });

};
