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
const Core = require('deep-core');

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
      
      const schemasPath = path.join(lambdaPath, Core.AWS.Lambda.Runtime.VALIDATION_SCHEMAS_DIR);
      
      if (fs.existsSync(schemasPath)) {
        // @todo move folder to bundlePath...
      } else {
        console.debug('No validation schemas found. Skipping...');
      }
      
      console.debug(`Bundle "${lambdaPath}" using Webpack to "${bundlePath}"`);
      
      fse.ensureDirSync(bundlePath);
      fse.outputFileSync(configFile, webpackConfig(lambdaPath, bundlePath, debug));
      
      return helpers.bundle(configFile, debug)
        .then(() => Promise.resolve({ bundlePath, buildPath }));
    })
    .then(result => {
      const { bundlePath, buildPath } = result;
      const bundleDestination = path.join(
        lambdaPath, 
        '..', 
        `${path.basename(lambdaPath)}.zip`
      );
      
      // Remove old build if exists
      try {
        fse.removeSync(bundleDestination);
      } catch (error) { }
      
      console.debug(`Archive "${lambdaPath}" build to "${bundleDestination}"`);
      
      return helpers.zip(bundlePath, bundleDestination)
        .then(() => Promise.resolve(buildPath));
    })
    .then(buildPath => {
      console.debug(`Cleanup temporary data for "${lambdaPath}"`);
      
      fse.removeSync(buildPath);
      
      return Promise.resolve();
    });
};
