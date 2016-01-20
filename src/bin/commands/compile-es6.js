#!/usr/bin/env node
/**
 * Created by AlexanderC on 6/19/15.
 */

'use strict';

module.exports = function(mainPath) {
  console.log('Starting compile-es6');
  var path = require('path');
  var Exec = require('../../lib.compiled/Helpers/Exec').Exec;
  console.log('mainPath: ', mainPath);

  if (mainPath === '`pwd`') {
    mainPath = process.cwd();
  } else if (mainPath.indexOf(path.sep) !== 0) {
    mainPath = path.join(process.cwd(), mainPath);
  }

  new Exec(path.join(__dirname, 'bin/compile-es6.sh'), mainPath)
    .run(function(result) {
      if (result.failed) {
        console.error(result.error);
        this.exit(1);
      }
    }.bind(this), false);
};
