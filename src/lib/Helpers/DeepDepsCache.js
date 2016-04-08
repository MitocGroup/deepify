/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/7/16.
 */

'use strict';

import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import fse from 'fs-extra';
import {MissingDependencyFolderException} from './Exception/MissingDependencyFolderException';
import {MissingDependencyCacheException} from './Exception/MissingDependencyCacheException';

/**
 * Deep Dependencies Cache
 */
export class DeepDepsCache {
  /**
   * @param {AbstractDriver} directory
   * @param {Object} extraDeps
   */
  constructor(directory = DeepDepsCache.DEFAULT_CACHE_DIRECTORY, extraDeps = {}) {
    this._directory = directory;
    this._extraDeps = extraDeps;
  }

  /**
   * @param {String} lambdaPath
   * @param {Function} callback
   */
  loadInto(lambdaPath, callback = () => {}) {
    let hash = this._getLambdaDepsHash(lambdaPath);
    let cacheDir = path.join(this._directory, hash);

    this.hasFor(lambdaPath, (error, has) => {
      if (error) {
        callback(error);
        return;
      }

      if (!has) {
        callback(new MissingDependencyCacheException(cacheDir));
        return;
      }

      this._copyDeps(cacheDir, lambdaPath, callback);
    });
  }

  /**
   * @param {String} lambdaPath
   * @param {Number} ttl
   * @param {Function} callback
   */
  cacheFrom(lambdaPath, ttl = 86400, callback = () => {}) {
    let hash = this._getLambdaDepsHash(lambdaPath);
    let cacheDir = path.join(this._directory, hash);

    this._copyDeps(lambdaPath, cacheDir, (error) => {
      if (error) {
        fse.remove(cacheDir, () => callback(error));
        return;
      }

      fs.writeFile(
        path.join(cacheDir, DeepDepsCache.TTL_TILE),
        Date.now() + ttl * 1000, // ms -> s
        callback
      );
    });
  }

  /**
   * @param {String} fromPath
   * @param {String} toPath
   * @param {Function} callback
   * @private
   */
  _copyDeps(fromPath, toPath, callback) {
    let modulesDir = DeepDepsCache.MODULES_DIR;

    let doCopy = (moduleIdx = 0) => {
      let moduleDir = modulesDir[moduleIdx];
      let fromDir = path.join(fromPath, moduleDir);
      let toDir = path.join(toPath, moduleDir);

      if (!fs.existsSync(fromDir)) {
        callback(new MissingDependencyFolderException(fromDir));
        return;
      }

      fse.copy(fromDir, toDir, (err) => {
        if (err) {
          callback(err);
          return;
        }

        if (++moduleIdx === modulesDir.length) {
          callback(null);
          return;
        }

        doCopy(moduleIdx);
      });
    };

    doCopy();
  }

  /**
   * @param {String} lambdaPath
   * @returns {String}
   * @private
   */
  _getLambdaDepsHash(lambdaPath) {
    let packageJsonFile = path.join(lambdaPath, 'package.json');
    let packageJsonRaw = fs.readFileSync(packageJsonFile).toString();

    try {
      let packageJson = JSON.parse(packageJsonRaw);
      let deps = Object.assign(packageJson.requestedDependencies || packageJson.dependencies || {}, this._extraDeps);
      let sortedDeps = this._sortDeps(deps);

      return DeepDepsCache._md5(JSON.stringify(sortedDeps));
    } catch (e) {
      throw new Error(`Broken json file: ${packageJsonFile}`);
    }
  }

  /**
   * @param {String} lambdaPath
   * @param {Function} callback
   */
  hasFor(lambdaPath, callback) {
    let hash = this._getLambdaDepsHash(lambdaPath);
    let cacheDir = path.join(this._directory, hash);
    let ttlFile = path.join(cacheDir, DeepDepsCache.TTL_TILE);

    if (!fs.existsSync(ttlFile) || fs.readFileSync(ttlFile).toString() < Date.now()) {
      callback(null, false);
      return;
    }
    
    callback(null, true);
  }

  /**
   * @param {Object} dependencies
   * @returns {Object}
   * @private
   */
  _sortDeps(dependencies) {
    let sortedDeps = {};

    Object.keys(dependencies).sort().forEach((key) => {
      sortedDeps[key] = dependencies[key];
    });

    return sortedDeps;
  }

  /**
   * @param {String} text
   * @returns {String}
   * @private
   */
  static _md5(text) {
    return crypto.createHash('md5').update(text).digest('hex');
  }

  /**
   * @returns {String}
   */
  static get DEFAULT_CACHE_DIRECTORY() {
    return path.join(os.tmpdir(), '.deep-cache');
  }

  /**
   * @returns {String}
   */
  static get TTL_TILE() {
    return 'ttl';
  }

  /**
   * @returns {String[]}
   */
  static get MODULES_DIR() {
    return [
      'node_modules',
      'deep_modules',
    ]
  }
}
