#!/usr/bin/env node

/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(mainPath) {
  const LIBS_TO_LINK = [ 'deep-framework' ];
  
  const LambdaExtractor = require('../../../lib.compiled/Helpers/LambdasExtractor').LambdasExtractor;
  const NpmInstall = require('../../../lib.compiled/NodeJS/NpmInstall').NpmInstall;
  const Prompt = require('../../../lib.compiled/Terminal/Prompt').Prompt;
  const ValidationSchemasSync = require('../../../lib.compiled/Helpers/ValidationSchemasSync').ValidationSchemasSync;
  const Property = require('deep-package-manager').Property_Instance;
  const validateNodeVersion = require('../helper/validate-node-version');
  const helpers = require('./helper/compile-prod');
  const compileLambda = require('./helper/compile-lambda');
  const Semaphore = require('deep-package-manager').Helpers_Semaphore;
  const BundleException = require('./helper/exception/bundle-exception');
  const fse = require('fs-extra');
  const fs = require('fs');
  const PromisePool = require('es6-promise-pool');
  const prettyMs = require('pretty-ms');
  const path = require('path');
  const pify = require('pify');
  const npmInstallCache = require('./helper/npm-install-cache');

  validateNodeVersion.call(this);

  const compiledLambdasFile = '.deep.compile-prod.json';
  const compiledLambdasPath = path.join(
    this.normalizeInputPath(mainPath),
    compiledLambdasFile
  );
  const compiledLambdas = [];
  
  if (fs.existsSync(compiledLambdasPath)) {
    const prompt = new Prompt(
      'Do you want to resume unfinished compilation it? [y/n]\n'
    );

    prompt.syncMode = true;
    prompt.read((confirmation) => {
      if (['yes', 'y'].indexOf((confirmation || '').trim().toLowerCase()) !== -1) {
        const compiledLambdasCache = fse.readJsonSync(compiledLambdasPath);
        
        if (Array.isArray(compiledLambdasCache)) {
          compiledLambdasCache.forEach(lambdaPath => {
            compiledLambdas.push(lambdaPath);
          });
        }
      }
      
      fse.removeSync(compiledLambdasPath);
    });
  }
  
  const startTime = Date.now();
  const buildOpts = {
    microservices: helpers.getMicroservicesToCompile(this.opts.locate('partial').value),
    debug: this.opts.locate('debug-build').exists,
    purge: this.opts.locate('purge').exists,
    optimize: !this.opts.locate('skip-optimize').exists,
    optimizeRetry: !this.opts.locate('skip-optimize-retry').exists,
  };
  
  console.log('Compilation start');
  
  (new Promise((resolve, reject) => {
    console.info('Initialize Property instance');
    
    const property = Property.create(this.normalizeInputPath(mainPath));
    
    property.assureFrontendEngine(error => {
      if (error) {
        return reject(error);
      }

      resolve(property);
    });
  }))
  .then(property => {
    const dry = buildOpts.debug ? '[DRY] ' : '';
    
    console.info(`${dry}Ensure shared libraries are globally available (${LIBS_TO_LINK.join(', ')})`);
    
    return helpers.npmInstallLib(LIBS_TO_LINK, true, buildOpts.debug)
      .then(() => Promise.resolve(property));
  })
  .then(property => {
    console.info('Extracting lambdas');
    
    const lambdasObj = new LambdaExtractor(property, buildOpts.microservices)
      .extract(LambdaExtractor.NPM_PACKAGE_FILTER, LambdaExtractor.EXTRACT_OBJECT);
    const lambdas = helpers.arrayUnique(helpers.objectValues(lambdasObj));
    
    if (lambdas.length > 0) {
      const lambdasInfo = lambdas
        .map(lambdaPath => {
          return compiledLambdas.indexOf(lambdaPath) === -1
            ? lambdaPath
            : `[FINISHED] ${lambdaPath}`
        })
        .join('\n  - ');
      
      console.debug(`The following lambdas detected:\n  - ${lambdasInfo}`);
    } else {
      console.log('There are no lambdas detected. Skipping...');
      this.exit(0);
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
    console.info(`Setting max threads to ${maxThreads}`);
    
    const semaphor = new Semaphore('COMPILER');
    
    const lambdasIterator = function *() {
      for (let lambdaPath of lambdas) {
        if (compiledLambdas.indexOf(lambdaPath) === -1) {
          yield semaphor.wrap(
            () => {
              return compileLambda(
                lambdaPath, 
                buildOpts.debug, 
                buildOpts.optimize, 
                buildOpts.purge, 
                LIBS_TO_LINK
              ).catch(error => {
                if (error instanceof BundleException
                  && buildOpts.optimize
                  && buildOpts.optimizeRetry) {

                  console.error(error);
                  console.info(`Retry compiling ${lambdaPath} lambda without optimizations...`);
                  
                  return compileLambda(
                    lambdaPath, 
                    buildOpts.debug, 
                    false, // force buildOpts.optimize=false
                    buildOpts.purge, 
                    LIBS_TO_LINK
                  );
                }
                
                return Promise.reject(error);
              });
            },
            lambdaPath
          ).then(() => {
            compiledLambdas.push(lambdaPath);
            npmInstallCache.release(lambdaPath);
            
            // @todo remove cache stats?
            npmInstallCache.stats();
            
            return Promise.resolve();
          });
        } else {
          console.info(`Lambda ${lambdaPath} already compiled. Skipping...`);
          
          yield Promise.resolve();
        }
      }
    };
    
    return new PromisePool(
      lambdasIterator(), 
      maxThreads
    ).start();
  })
  .then(() => pify(fse.remove)(compiledLambdasPath))
  .then(() => {    
    const runTime = prettyMs(Date.now() - startTime, {compact: true});
    
    console.log(`Compilation of ${compiledLambdas.length} lambdas finished in ${runTime}`);
    
    return Promise.resolve(0);
  })
  .catch(error => {
    console.error(error);
    
    return pify(fse.outputJson)(compiledLambdasPath, compiledLambdas)
      .catch(error => {
        console.error(`Error dumping compiled lambdas: ${error}`);
      })
      .then(() => {
        return Promise.resolve(1);
      });
  })
  .then(exitCode => {
    console.log(`Cleaning up temporary directory ${helpers.__tmpDir}`);
    
    return pify(fse.remove)(helpers.__tmpDir)
      .then(() => this.exit(exitCode))
  });
};
