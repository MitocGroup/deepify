'use strict';

const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const pify = require('pify');
const tmp = require('tmp');
const Bin = require('../../../../lib.compiled/NodeJS/Bin').Bin;
const NpmInstall = require('../../../../lib.compiled/NodeJS/NpmInstall').NpmInstall;
const NpmInstallLibs = require('../../../../lib.compiled/NodeJS/NpmInstallLibs').NpmInstallLibs;
const NpmLink = require('../../../../lib.compiled/NodeJS/NpmLink').NpmLink;
const Exec = require('../../../../lib.compiled/Helpers/Exec').Exec;
const BundleException = require('./exception/bundle-exception');

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
        return reject(new BundleException(result.error));
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
  return new Promise((resolve, reject) => {
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
    
    cmd.run((error) => {
      if (error) {
        return reject(error);
      }
  
      resolve();
    });
  });
}

function hasDependency (packagePath, lib) {
  return readDependencies(packagePath)
    .then(deps => {
      return Promise.resolve(Object.keys(deps).indexOf(lib) !== -1)
    });
}

function readDependencies (packagePath) {
  const packageJsonPath = path.join(packagePath, 'package.json');
  
  return fileExists(packageJsonPath)
    .then(hasPackageJson => {
      if (!hasPackageJson) {
        return Promise.resolve(false);
      }
      
      return pify(fse.readJson)(packageJsonPath)
        .then(packageJsonContent => {
          let deps = {};
          
          [
            'dependencies',
            'devDependencies',
            'peerDependencies',
            'optionalDependencies',
          ].map(depKey => {
            if (packageJsonContent.hasOwnProperty(depKey)) {
              const localDeps = packageJsonContent[depKey] || {};
              
              Object.keys(localDeps).map(depKey => {
                if (!deps.hasOwnProperty(depKey)) {
                  deps[depKey] = [];
                }
                
                deps[depKey].push(localDeps[depKey]);
              });
            }
          });
          
          return Promise.resolve(deps);
        });
    });
}

function npmLink (packagePath, libs, dryRun) {
  return new Promise((resolve, reject) => {
    const cmd = new NpmLink(packagePath)
      .addExtraArg(
        '--silent',
        '--depth=0'
      )
      .dry(dryRun);
      
    cmd.libs = libs;
    
    cmd.run((error) => {
      if (error) {
        return reject(error);
      }
  
      resolve();
    });
  });
}

function npmInstall (packagePath, dryRun) {
  return new Promise((resolve, reject) => {
    new NpmInstall(packagePath)
      .addExtraArg(
        '--no-bin-links',
        '--only=prod',
        '--silent',
        '--no-shrinkwrap',
        '--depth=0'
      )
      .dry(dryRun)
      .run((error) => {
        if (error) {
          return reject(error);
        }
    
        resolve();
      });
  });
}

// think on more flexible way of generating it
const __tmpDir = path.join(tmp.dirSync().name, `.deepify-${Date.now()}`);
fse.ensureDirSync(__tmpDir);

module.exports = {
  __tmpDir, // this is used internally!!!
  arrayUnique, getMicroservicesToCompile, 
  objectValues, npmInstall, npmInstallLib, 
  npmLink, bundle, zip, fileExists,
  hasDependency, readDependencies,
};
