#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(dumpPath) {
  console.log('Starting helloworld');
  // @todo: put it anywhere in a config
  var helloWorldRepoUrl = 'https://github.com/MitocGroup/deep-microservices-helloworld.git';

  var Exec = require('../../lib.compiled/Helpers/Exec').Exec;
  var Bin = require('../../lib.compiled/NodeJS/Bin').Bin;

  var cmd = new Exec(
    Bin.node,
    this.scriptPath,
    'install',
    helloWorldRepoUrl,
    dumpPath
  );

  cmd.run(function(result) {
    if (result.failed) {
      console.error(result.error);
      this.exit(1);
    }
  }, true);
};
