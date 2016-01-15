#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(dumpPath) {

  // @todo: put it anywhere in a config
  var helloWorldRepoUrl = 'https://github.com/MitocGroup/deep-microservices-helloworld.git';
  var searchRepoUrl = 'https://github.com/MitocGroup/deep-microservices-search.git';

  var Exec = require('../../lib.compiled/Helpers/Exec').Exec;
  var Bin = require('../../lib.compiled/NodeJS/Bin').Bin;

  new Exec(
    Bin.node,
    this.scriptPath,
    'install',
    helloWorldRepoUrl,
    dumpPath
  ).run(function(result) {
    if (result.failed) {
      console.error(result.error);
      this.exit(1);
    }

    new Exec(
      Bin.node,
      this.scriptPath,
      'install',
      searchRepoUrl,
      dumpPath
    ).run(function(result) {
      if (result.failed) {
        console.error(result.error);
        this.exit(1);
      }
    }.bind(this), true);
  }.bind(this), true);
};
