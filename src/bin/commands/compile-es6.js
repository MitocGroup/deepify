#!/usr/bin/env node
/**
 * Created by AlexanderC on 6/19/15.
 */

'use strict';

module.exports = function(mainPath) {
  var path = require('path');
  var Exec = require('../../lib.compiled/Helpers/Exec').Exec;

  mainPath = this.normalizeInputPath(mainPath);

  new Exec(path.join(__dirname, 'bin', 'compile-es6.sh'), mainPath)
    .run(function(result) {
      if (result.failed) {
        console.error(result.error);
        this.exit(1);
      }
    }.bind(this), true);
};
