/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

const NpmChain = require('../../../../lib.compiled/NodeJS/NpmChain').NpmChain;
const Hash = require('deep-package-manager').Helpers_Hash;
const helpers = require('./compile-prod');
const tmp = require('tmp');
const path = require('path');
const webpackConfig = require('./webpack.prod');
const fse = require('fs-extra');
const fs = require('fs');
const pify = require('pify');
const npmInstall = require('./npm-install-cache').install;

module.exports = function (lambdaPath, debug, optimize, purge, libsToLink) {
  const dry = debug ? '[DRY] ' : '';
  
  console.log(`Compiling lambda "${lambdaPath}" (purge=${purge ? 'true' : 'false'})`);
  console.debug(`${dry}Purge "node_modules" in "${lambdaPath}"`);
  
  const prepare = (purge && !debug)
    ? pify(fse.remove)(path.join(lambdaPath, 'node_modules'))
    : Promise.resolve();
  
  return prepare
    .then(() => {
      if (libsToLink.length <= 0) {
        console.debug(`No global libraries available to link for "${lambdaPath}"`);
        
        return Promise.resolve();
      }
      
      console.debug(`${dry}Linking global libraries in "${lambdaPath}" (${libsToLink.join(', ')})`);
      
      return Promise.all(libsToLink.map(lib => {
        return helpers.hasDependency(lambdaPath, lib)
          .then(hasLib => {
            if (!hasLib) {
              console.debug(`Skip linking extraneous library "${lib}" in "${lambdaPath}"`);
            }
            
            return Promise.resolve(hasLib);
          });
      })).then(libsVector => {
        const libs = libsToLink.filter((lib, i) => {
          return libsVector[i];
        });
        
        if (libs.length <= 0) {
          return Promise.resolve();
        }
        
        return helpers.npmLink(lambdaPath, libs, debug)
          .then(() => Promise.resolve(libs));
      });
    })
    .then(libsToUnlink => {
      console.debug(`${dry}Running "npm install" on "${lambdaPath}"`);
      
      return npmInstall(lambdaPath, debug)
        .then(() => Promise.resolve(libsToUnlink));
    })
    .then(libsToUnlink => {
      const buildPath = path.join(
        helpers.__tmpDir,
        `${Hash.md5(lambdaPath)}_${new Date().getTime()}`
      );
      const configFile = path.join(buildPath, 'webpack.prod.js');
      const bundlePath = path.join(buildPath, 'bundle');

      console.debug(`Ensure working env in "${buildPath}"`);
      
      return pify(fse.ensureDir)(bundlePath)
        .then(() => {
          return webpackConfig(
              lambdaPath, 
              bundlePath, 
              libsToLink, 
              debug, 
              optimize
            )
            .then(webpackConfigResult => {
              const { rawConfig, tmpBootstrapJs } = webpackConfigResult;
              
              return pify(fse.outputFile)(configFile, rawConfig)
                .then(() => Promise.resolve(tmpBootstrapJs));
            });
        })
        .then(tmpBootstrapJs => {
          console.debug(`Bundle "${lambdaPath}" using Webpack to "${bundlePath}"`);
          
          const removeTmpBootstrap = () => {
            console.debug(`Removing temporary bootstrap file "${tmpBootstrapJs}"`);

            return pify(fse.remove)(tmpBootstrapJs)
              .catch(() => Promise.resolve());
          };
          
          return helpers.bundle(configFile, debug)
            .then(() => removeTmpBootstrap())
            .catch(error => {
              return removeTmpBootstrap()
                .then(() => Promise.reject(error));
            });
        })
        .then(() => Promise.resolve({ bundlePath, buildPath, libsToUnlink }));
    })
    .then(result => {
      const { bundlePath, buildPath, libsToUnlink } = result;
      const bundleDestination = path.join(
        lambdaPath, 
        '..', 
        `${path.basename(lambdaPath)}.zip`
      );
      
      console.info(`Archive "${lambdaPath}" build to "${bundleDestination}"`);
      
      return pify(fse.remove)(bundleDestination)
        .catch(() => Promise.resolve())
        .then(() => helpers.zip(bundlePath, bundleDestination))
        .then(() => Promise.resolve(libsToUnlink));
    })
    .then(libsToUnlink => {
      if ((libsToUnlink || []).length <= 0) {
        return Promise.resolve();
      }
      
      console.debug(`${dry}Removed linked libraries from "${lambdaPath}" (${libsToUnlink.join(', ')})`);
      
      return debug ? Promise.resolve() : Promise.all(libsToUnlink.map(lib => {
        return pify(fs.unlink)(path.join(lambdaPath, 'node_modules', lib));
      }));
    });
};
