#!/usr/bin/env node
/**
 * Created by AlexanderC on 6/19/15.
 */

'use strict';

module.exports = function(mainPath) {
  let path = require('path');
  let esPreset = require('./helper/es-preset');
  let Exec = require('../../../lib.compiled/Helpers/Exec').Exec;

  mainPath = this.normalizeInputPath(mainPath);
  let extension = this.opts.locate('extension').value || '.es6';
  let outDirectory = this.opts.locate('out-dir').value || mainPath;
  let compileES5 = this.opts.locate('es5').exists;
  let pipeSource = this.opts.locate('source').exists;
  let nodeModules = path.join(__dirname, '../../../node_modules');

  let babelCompileCommand = () => {
    let babelCmd = path.join(nodeModules, 'babel-cli/bin/babel.js');
    let presets = [];
    let babelES6Preset = null;
    let plugins = [ path.join(nodeModules, 'babel-plugin-add-module-exports') ];
    
    if (compileES5) {
      presets.push(path.join(nodeModules, 'babel-preset-es2015'));
    } else {
      babelES6Preset =  esPreset();
      
      presets.push(path.join(nodeModules, babelES6Preset));
    }
    
    if (compileES5 || babelES6Preset === 'babel-preset-es2015-node4') {
      plugins.push(path.join(nodeModules, 'babel-plugin-transform-es2015-classes'));
    }

    let compileCmd = new Exec(
      this.nodeBinary,
      babelCmd,
      mainPath
    );

    console.log(`Plugins: ${plugins.map(p => path.basename(p)).join(', ')}`);
    console.log(`Presets: ${presets.map(p => path.basename(p)).join(', ')}`);

    compileCmd.addArg(`--extensions=${extension}`);
    
    if (presets.length > 0) {
      compileCmd.addArg(`--presets=${presets.join(',')}`);
    }
      
    if (plugins.length > 0) {
      compileCmd.addArg(`--plugins=${plugins.join(',')}`);
    }

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
