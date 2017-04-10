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
const pify = require('pify');

module.exports = function (lambdaPath, debug) {
  const dry = debug ? '[DRY] ' : '';
  
  console.log(`Compiling lambda "${lambdaPath}"`);
  console.debug(`${dry}Running "npm install" on "${lambdaPath}"`);
  
  return helpers.npmInstall(lambdaPath, debug) 
    .then(() => {
      console.debug(`${dry}Running "npm prune" on "${lambdaPath}"`);
      
      return helpers.npmPrune(lambdaPath, debug);
    })
    .then(() => {
      const buildPath = path.join(
        tmp.dirSync().name,
        `${Hash.md5(lambdaPath)}_${new Date().getTime()}`
      );
      const configFile = path.join(buildPath, 'webpack.prod.js');
      const bundlePath = path.join(buildPath, 'bundle');

      console.debug(`Ensure working env in "${buildPath}"`);
      
      return pify(fse.ensureDir)(bundlePath)
        .then(() => {
          return webpackConfig(lambdaPath, bundlePath, debug)
            .then(webpackConfig => {
              const { rawConfig, tmpBootstrapJs } = webpackConfig;
              
              return pify(fse.outputFile)(configFile, rawConfig)
                .then(() => Promise.resolve(tmpBootstrapJs));
            });
        })
        .then(tmpBootstrapJs => {
          console.debug(`Bundle "${lambdaPath}" using Webpack to "${bundlePath}"`);
          
          return helpers.bundle(configFile, debug)
            .then(() => {
              console.debug(`Removing temporary bootstrap file "${tmpBootstrapJs}"`);
              
              return pify(fse.remove)(tmpBootstrapJs)
                .catch(() => Promise.resolve());
            });
        })
        .then(() => Promise.resolve({ bundlePath, buildPath }));
    })
    .then(result => {
      const { bundlePath, buildPath } = result;
      const bundleDestination = path.join(
        lambdaPath, 
        '..', 
        `${path.basename(lambdaPath)}.zip`
      );
      
      console.debug(`Archive "${lambdaPath}" build to "${bundleDestination}"`);
      
      return pify(fse.remove)(bundleDestination)
        .catch(() => Promise.resolve())
        .then(() => helpers.zip(bundlePath, bundleDestination))
        .then(() => Promise.resolve(buildPath));
    })
    .then(buildPath => {
      console.debug(`Cleanup temporary data for "${lambdaPath}"`);
      
      fse.removeSync(buildPath);
      
      return Promise.resolve();
    });
};
