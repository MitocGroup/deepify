#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(dumpPath) {
  var path = require('path');
  var fse = require('fs-extra');
  var Exec = require('../../lib.compiled/Helpers/Exec').Exec;
  var Bin = require('../../lib.compiled/NodeJS/Bin').Bin;

  if (dumpPath.indexOf(path.sep) !== 0) {
    dumpPath = path.join(process.cwd(), dumpPath);
  }

  var cmd = new Exec(
    Bin.node,
    this.scriptPath,
    'install',
    'github://MitocGroup/deep-microservices-helloworld',
    '--init'
  );

  fse.ensureDirSync(dumpPath);

  cmd.cwd = dumpPath;

  cmd.run(function(result) {
    if (result.failed) {
      console.error(result.error);
      this.exit(1);
    }
  }.bind(this), true);
};
