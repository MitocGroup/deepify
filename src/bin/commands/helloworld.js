#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(dumpPath) {
  let fse = require('fs-extra');
  let Exec = require('../../lib.compiled/Helpers/Exec').Exec;
  let Bin = require('../../lib.compiled/NodeJS/Bin').Bin;

  dumpPath = this.normalizeInputPath(dumpPath);

  let cmd = new Exec(
    Bin.node,
    this.scriptPath,
    'install',
    'github://MitocGroup/deep-microservices-helloworld',
    '--init'
  );

  fse.ensureDirSync(dumpPath);

  cmd.cwd = dumpPath;

  cmd.run((result) => {
    if (result.failed) {
      console.error(result.error);
      this.exit(1);
    }
  }, true);
};
