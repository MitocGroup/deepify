#!/usr/bin/env node
/**
 * Created by AlexanderC on 6/19/15.
 */

'use strict';

module.exports = function(mainPath) {
  var path = require('path');
  var spawn = require('child_process').spawn;

  if (mainPath.indexOf('/') !== 0) {
    mainPath = path.join(process.cwd(), mainPath);
  }

  var childProcess = spawn(path.join(__dirname, 'bin/compile-es6.sh'), [mainPath]);

  childProcess.stdout.pipe(process.stdout);
  childProcess.stderr.pipe(process.stderr);
};
