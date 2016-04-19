#!/usr/bin/env node
/**
 * Created by AlexanderC on 6/19/15.
 */

'use strict';

module.exports = function(mainPath) {
  let path = require('path');
  let Exec = require('../../lib.compiled/Helpers/Exec').Exec;

  mainPath = this.normalizeInputPath(mainPath);
  let extension = this.opts.locate('extension').value || '.es6';
  let outDirectory = this.opts.locate('out-dir').value || mainPath;
  let compileEs5 = this.opts.locate('es5').exists;
  let pipeSource = this.opts.locate('source').exists;

  let assureBabel6 = (callback) => {
    let cmd = new Exec('babel -V');
    cmd.runSync();

    if (cmd.failed) {
      let installBabelCmd = new Exec('npm install -g babel-cli@6');
      installBabelCmd.run(callback, true);
      return;
    }

    let babelVersion = cmd.result;

    if (!/^6\.\d/.test(babelVersion)) {
      console.warn(`Seems like your babel ${babelVersion} is not compatible with deepify.`);
      console.warn(`We'd recommend you using babel@6.*.* (npm install babel-cli@6.*.* -g')...`);
      this.exit(1);
    }

    callback();
  };

  let babelCompileCommand = () => {
    let presets = [path.join(__dirname, `../../node_modules/babel-preset-es2015${ compileEs5 ? '' : '-node4' }`)];
    let plugins = [
      path.join(__dirname, '../../node_modules/babel-plugin-transform-es2015-classes'),
      path.join(__dirname, '../../node_modules/babel-plugin-add-module-exports'),
    ];

    let cmd = new Exec('babel', mainPath)
      .addArg(`--extensions=${extension}`)
      .addArg(`--presets=${presets.join(',')}`)
      .addArg(`--plugins=${plugins.join(',')}`);

    if (!pipeSource) {
      cmd.addArg(`--out-dir=${outDirectory}`);
    }

    return cmd;
  };

  assureBabel6(() => {
    if (!pipeSource) {
      console.log(`Start compiling *${extension}`);
    }

    let babelCompile = babelCompileCommand();
    babelCompile.run((result) => {
      if (result.failed) {
        console.error(result.error);
        this.exit(1);
      }
    }, true);
  });
};
