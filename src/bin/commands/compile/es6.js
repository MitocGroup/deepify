#!/usr/bin/env node
/**
 * Created by AlexanderC on 6/19/15.
 */

'use strict';

module.exports = function(mainPath) {
  let path = require('path');
  let Exec = require('../../../lib.compiled/Helpers/Exec').Exec;

  mainPath = this.normalizeInputPath(mainPath);
  let extension = this.opts.locate('extension').value || '.es6';
  let outDirectory = this.opts.locate('out-dir').value || mainPath;
  let compileBrowser = this.opts.locate('browser').exists || this.opts.locate('es5').exists;
  let pipeSource = this.opts.locate('source').exists;
  let nodeModules = path.join(__dirname, '../../../node_modules');

  let babelCompileCommand = () => {
    let babelCmd = path.join(nodeModules, 'babel-cli/bin/babel.js');
    let presets = [
      compileBrowser 
        ? path.join(nodeModules, 'babel-preset-modern-browsers')
        : path.join(nodeModules, 'babel-preset-node6'),
    ];

    let compileCmd = new Exec(
      this.nodeBinary,
      babelCmd,
      mainPath
    );

    compileCmd
      .addArg(`--extensions=${extension}`)
      .addArg(`--presets=${presets.join(',')}`);

    if (!pipeSource) {
      compileCmd.addArg(`--out-dir=${outDirectory}`);
    }

    return compileCmd;
  };

  babelCompileCommand().run((result) => {
    if (result.failed) {
      console.error(result.error);
      this.exit(1);
    }
  }, true);
};
