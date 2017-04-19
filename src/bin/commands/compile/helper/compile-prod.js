'use strict';

const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const pify = require('pify');
const Bin = require('../../../../lib.compiled/NodeJS/Bin').Bin;
const NpmInstall = require('../../../../lib.compiled/NodeJS/NpmInstall').NpmInstall;
const NpmInstallLibs = require('../../../../lib.compiled/NodeJS/NpmInstallLibs').NpmInstallLibs;
const NpmLink = require('../../../../lib.compiled/NodeJS/NpmLink').NpmLink;
const Exec = require('../../../../lib.compiled/Helpers/Exec').Exec;

function fileExists(filePath) {
  return new Promise(resolve => {
    fs.exists(filePath, exists => {
      resolve(exists);
    });
  });
}

function zip (workingDir, outputFile) {
  return new Promise((resolve, reject) => {
    const zip = new Exec(
      Bin.resolve('zip', true),
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
      Bin.resolve('webpack', true),
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

function npmInstallLib(libs, global, dryRun) {
  return new Promise(resolve => {
    const cmd = new NpmInstallLibs()
      .addExtraArg(
        '--no-bin-links',
        '--only=prod',
        '--silent',
        '--depth=0'
      )
      .dry(dryRun);
    
    cmd.global = global;
    cmd.libs = libs;
    
    cmd.run(resolve);
  });
}

function hasDependency (packagePath, lib) {
  const packageJsonPath = path.join(packagePath, 'package.json');
  
  return fileExists(packageJsonPath)
    .then(hasPackageJson => {
      if (!hasPackageJson) {
        return Promise.resolve(false);
      }
      
      return pify(fse.readJson)(packageJsonPath)
        .then(packageJsonContent => {
          let deps = [];
          
          [
            'dependencies',
            'devDependencies',
            'peerDependencies',
            'optionalDependencies',
          ].map(depKey => {
            if (packageJsonContent.hasOwnProperty(depKey)) {
              const localDeps = packageJsonContent[depKey] || {};
              
              deps = deps.concat(Object.keys(localDeps));
            }
          });
          
          return Promise.resolve(deps.indexOf(lib) !== -1);
        });
    });
}

function npmLink (packagePath, libs, dryRun) {
  return new Promise(resolve => {
    const cmd = new NpmLink(packagePath)
      .addExtraArg(
        '--silent',
        '--depth=0'
      )
      .dry(dryRun);
      
    cmd.libs = libs;
    
    cmd.run(resolve);
  });
}

function npmInstall (packagePath, dryRun) {
  return new Promise(resolve => {
    new NpmInstall(packagePath)
      .addExtraArg(
        '--no-bin-links',
        '--only=prod',
        '--silent',
        '--link',
        '--no-shrinkwrap',
        '--depth=0'
      )
      .dry(dryRun)
      .run(resolve);
  });
}

module.exports = {
  arrayUnique, getMicroservicesToCompile, 
  objectValues, npmInstall, npmInstallLib, 
  npmLink, bundle, zip, fileExists, hasDependency,
};
