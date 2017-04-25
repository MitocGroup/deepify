/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

const helpers = require('./compile-prod');
const Hash = require('deep-package-manager').Helpers_Hash;
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const pify = require('pify');

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
        
        return NpmInstallCache._linkDependencies(lambdaPath, cachedLambdaPath);
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
        
        return Promise.all(cachedModules.map(cachedModule => {
          const modulePath = path.join(
            lambdaPath, 
            'node_modules', 
            path.basename(cachedModule)
          );
          
          return pify(fse.copy)(cachedModule, modulePath, {
            
            // @todo figure out it it works in all cases
            overwrite: false,
          });
        }));
      });
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
