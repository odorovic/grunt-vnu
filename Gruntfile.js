
'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    validate_html: {
      standalone: {
        files: {
          src: ['test/html/index.html']
        },
      },

      templates: {
        files: {
          src: ['test/html/template.html']
        },
        options: {
            templateSandwich: true,
            customtags: ['ng-*'],
            customattrs: ['ng-*', 'layout']
        }
      }
    }
  });

  grunt.loadTasks('tasks');

  grunt.registerTask('default', ['validate_html']);
};
