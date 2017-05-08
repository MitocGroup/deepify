/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

const helpers = require('./compile-prod');
const Hash = require('deep-package-manager').Helpers_Hash;
const NpmRun = require('../../../../lib.compiled/NodeJS/NpmRun').NpmRun;
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const pify = require('pify');
const PromisePool = require('es6-promise-pool');

class NpmInstallCache {
  static stats() {
    const cache = Object.keys(NpmInstallCache.__cache__).length;
    const cacheWait = Object.keys(NpmInstallCache.__cache_wait__).length;
    
    console.debug(`[CACHE] ${cache} cached | ${cacheWait} awaiting`);
  }
  
  static release(lambdaPath) {
    if (NpmInstallCache.__cache_wait__.hasOwnProperty(lambdaPath)) {
      const hash = NpmInstallCache.__cache_wait__[lambdaPath];
      
      NpmInstallCache.__cache__[hash] = lambdaPath;
      delete NpmInstallCache.__cache_wait__[lambdaPath];
    }
  }
  
  static install(lambdaPath, debug) {
    if (debug) {
      return helpers.npmInstall(lambdaPath, debug); 
    }
    
    return NpmInstallCache._hash(lambdaPath)
      .then(hash => {
        const cachedLambdaPath = NpmInstallCache._read(hash);
        
        if (!cachedLambdaPath) {
          return helpers.npmInstall(lambdaPath, debug)
            .then(() => {
              NpmInstallCache._write(hash, lambdaPath);
              
              return Promise.resolve();
            });
        }
        
        return NpmInstallCache._linkDependencies(lambdaPath, cachedLambdaPath)
          .then(() => NpmInstallCache._runScripts(lambdaPath));
      });
  }
  
  /**
   * @todo run other scripts
   */
  static _runScripts(lambdaPath) {
    const packageJsonPath = path.join(lambdaPath, 'package.json');
    
    return helpers.fileExists(packageJsonPath)
      .then(hasPackageJson => {
        if (!hasPackageJson) {
          return Promise.resolve();
        }
        
        return pify(fse.readJson)(packageJsonPath)
          .then(packageJsonContent => {
            if (!packageJsonContent.hasOwnProperty('scripts')
              || !packageJsonContent.scripts.hasOwnProperty('postinstall')) {
              
              return Promise.resolve();
            }
            
            console.debug(`[CACHE] Running postinstall script in ${lambdaPath}`);
            
            const script = new NpmRun(lambdaPath);
            script.cmd = 'postinstall';
            
            return pify(script.run.bind(script))();
          });
      });
  }
  
  static _linkDependencies(lambdaPath, cachedLambdaPath) {
    const modulesPath = path.join(cachedLambdaPath, 'node_modules');
    
    return NpmInstallCache._listDirs(modulesPath)
      .then(cachedModules => {
        const moduleNames = cachedModules.map(cachedModule => {
          return path.basename(cachedModule);
        });
        
        console.debug(`[CACHE] Copying dependencies in ${lambdaPath}: ${moduleNames.join(', ')}`);
        
        const pool = new PromisePool(function *() {
          for (let cachedModule of cachedModules) {            
            const modulePath = path.join(
              lambdaPath, 
              'node_modules', 
              path.basename(cachedModule)
            );
            
            yield pify(fse.copy)(cachedModule, modulePath, {
              
              // @todo figure out it it works in all cases
              overwrite: false,
            });
          }
        }, NpmInstallCache.MAX_PARALLEL_LINK);
        
        return pool.start();
      });
  }
  
  static get MAX_PARALLEL_LINK() {
    return 5;
  }
  
  static _listDirs(dir) {
    return pify(fs.readdir)(dir)
      .then(assets => {
        return Promise.all(Array.from(assets).map(asset => {
          const assetPath = path.join(dir, asset);
          
          return pify(fs.stat)(assetPath)
            .then(assetStats => {
              if (assetStats.isDirectory()) {
                return Promise.resolve(assetPath);
              }
              
              return Promise.resolve(null);
            });
        })).then(dirs => {
          return Promise.resolve(
            dirs.filter(dir => !!dir)
          );
        });
      });
  }
  
  static _hash(lambdaPath) {
    return helpers.readDependencies(lambdaPath)
      .then(deps => {
        let sortedDeps = {};
        
        Object.keys(deps).sort().map(depKey => {
          sortedDeps[depKey] = deps[depKey].sort();
        });
        
        return Promise.resolve(Hash.md5(
          JSON.stringify(sortedDeps)
        ));
      });
  }
  
  static _write(hash, lambdaPath) {
    NpmInstallCache.__cache_wait__[lambdaPath] = hash;
  }
  
  static _read(hash) {
    if (!NpmInstallCache._exists(hash)) {
      return null;
    }
    
    return NpmInstallCache.__cache__[hash];
  }
  
  static _exists(hash) {
    return NpmInstallCache.__cache__.hasOwnProperty(hash);
  }
  
  static get __cache__() {
    global.__NpmInstallCache_cache__ = global.__NpmInstallCache_cache__ || {};
    
    return global.__NpmInstallCache_cache__;
  }
  
  static get __cache_wait__() {
    global.__NpmInstallCache_cache_wait__ = global.__NpmInstallCache_cache_wait__ || {};
    
    return global.__NpmInstallCache_cache_wait__;
  }
}

module.exports = NpmInstallCache;
