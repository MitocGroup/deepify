#!/usr/bin/env node

/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(mainPath) {
  const LambdaExtractor = require('../../../lib.compiled/Helpers/LambdasExtractor').LambdasExtractor;
  const NpmInstall = require('../../../lib.compiled/NodeJS/NpmInstall').NpmInstall;
  const ValidationSchemasSync = require('../../../lib.compiled/Helpers/ValidationSchemasSync').ValidationSchemasSync;
  const Property = require('deep-package-manager').Property_Instance;
  const validateNodeVersion = require('../helper/validate-node-version');
  const helpers = require('./helper/compile-prod');
  const compileLambda = require('./helper/compile-lambda');
  const fse = require('fs-extra');
  const PromisePool = require('es6-promise-pool');

  validateNodeVersion.call(this);

  const buildOpts = {
    microservices: helpers.getMicroservicesToCompile(this.opts.locate('partial').value),
    debug: this.opts.locate('debug-build').exists,
  }
  
  console.log('Compilation start');
  
  (new Promise((resolve, reject) => {
    console.debug('Initialize Property instance');
    
    const property = Property.create(this.normalizeInputPath(mainPath));
    
    property.assureFrontendEngine(error => {
      if (error) {
        return reject(error);
      }

      resolve(property);
    });
  }))
  .then(property => {
    console.debug('Extracting lambdas');
    
    const lambdasObj = new LambdaExtractor(property, buildOpts.microservices)
      .extract(LambdaExtractor.NPM_PACKAGE_FILTER, LambdaExtractor.EXTRACT_OBJECT);
    const lambdas = helpers.arrayUnique(helpers.objectValues(lambdasObj));
    
    if ( lambdas.length > 0 ) {
      console.debug(`The following lambdas detected:\n  - ${lambdas.join('\n  - ')}`);
    } else {
      console.log('There are no lambdas depected. Skipping...');
      process.exit(0);
    }
    
    return Promise.resolve({ property, lambdas });
  })
  .then(result => {
    if (!buildOpts.debug) {
      console.log(`Syncing validation schemas`);
      
      new ValidationSchemasSync(result.property)
        .syncWorking(ValidationSchemasSync.NPM_PACKAGE_FILTER);
    } else {
      console.log(`Skip syncing validation schemas`);
    }
      
    return Promise.resolve(result);
  })
  .then(result => {
    const { property, lambdas } = result;
    const maxThreads = NpmInstall.DEFAULT_CHUNK_SIZE;
    
    console.log(`Start compiling ${lambdas.length} lambdas`);
    console.debug(`Setting max threads to ${maxThreads}`);
    
    const lambdasIterator = function *() {
      for (let lambdaPath of lambdas) {
        yield compileLambda(lambdaPath, buildOpts.debug);
      }
    };
    
    return new PromisePool(
      lambdasIterator(), 
      maxThreads
    ).start();
  })
  .then(() => {
    console.log('Compilation finished successfully');
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
};
