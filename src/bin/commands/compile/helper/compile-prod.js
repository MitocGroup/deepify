'use strict';

const path = require('path');
const Bin = require('../../../../lib.compiled/NodeJS/Bin').Bin;
const NpmInstall = require('../../../../lib.compiled/NodeJS/NpmInstall').NpmInstall;
const NpmPrune = require('../../../../lib.compiled/NodeJS/NpmPrune').NpmPrune;
const Exec = require('../../../../lib.compiled/Helpers/Exec').Exec;

function zip (workingDir, outputFile) {
  return new Promise((resolve, reject) => {
    const zip = new Exec(
      Bin.resolve('zip'),
      '-q',
      '-y',
      '-r',
      outputFile,
      '.'
    );

    zip.cwd = workingDir;
    
    zip.run((result) => {
      if (result.failed) {
        return reject(result.error);
      }
  
      resolve(outputFile);
    }, true);
  });
}

function bundle (configFile, debug) {
  return new Promise((resolve, reject) => {
    const execOpts = [
      Bin.resolve('webpack'),
      '--env.production',
      '--progress',
      '--color',
      `--config=${path.basename(configFile)}`,
    ];
    
    if (debug) {
      execOpts.push('--display-error-details', '--debug=true');
    } else {
      execOpts.push('--hide-modules');
    }
    
    const webpack = new Exec(...execOpts);
    webpack.cwd = path.dirname(configFile);
    
    webpack.run((result) => {
      if (result.failed) {
        return reject(result.error);
      }
  
      resolve();
    }, true);
  });
}

function arrayUnique (a) {
  return a.reduce((p, c) => {
    if (p.indexOf(c) < 0) {
      p.push(c);
    }
    
    return p;
  }, []);
}

function getMicroservicesToCompile (microservicesToCompileString) {
  if (!microservicesToCompileString) {
    return [];
  }

  const msIdentifiers = arrayUnique(microservicesToCompileString.split(',').map(id => id.trim()));

  return typeof msIdentifiers === 'string' ? [msIdentifiers] : msIdentifiers;
}

function objectValues (object) {
  return Object.keys(object).map(key => object[key]);
}

function npmInstall (packagePath, dryRun) {
  return new Promise(resolve => {
    new NpmInstall(packagePath)
      .addExtraArg(
        '--no-bin-links',
        '--no-optional',
        '--production',
        '--silent',
        '--depth=0'
      )
      .dry(dryRun)
      .run(resolve);
  });
}

function npmPrune (packagePath, dryRun) {
  return new Promise(resolve => {
    new NpmPrune(packagePath)
      .addExtraArg(
        '--production', 
        '--silent'
      )
      .dry(dryRun)
      .run(resolve);
  });
}

module.exports = { arrayUnique, getMicroservicesToCompile, objectValues, npmInstall, npmPrune, bundle, zip };
