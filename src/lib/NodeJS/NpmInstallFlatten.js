/**
 * Created by GMeleca on 13/10/17.
 */

'use strict';

import { Bin } from './Bin';
import { Exec } from '../Helpers/Exec';
import { Helpers_WaitFor as WaitFor } from 'deep-package-manager';

export class NpmInstallFlatten {
  constructor() {
    this._extraArgs = [];
    this._cmds = [];
    this.installedDependencies = {};
    this._libs = '';
  }

  /**
   * @returns {String[]}
   */
  get extraArgs() {
    return this._extraArgs;
  }

  /**
   * @returns {Boolean}
   */
  get haveLibs() {
    return !!this._libs;
  }

  /**
   * @param {String|*} args
   * @returns {NpmInstall}
   */
  addExtraArg(...args) {
    this._extraArgs.push(...args);

    return this;
  }

  /**
   * Removes dublicates inside given array
   * @param {Array} arr
   * @returns {Array}
   * @private
   */
  filterDublicates(arr) {
    return arr.filter((item, pos) => {
      return arr.indexOf(item) === pos;
    });
  }

  /**
   * Returns backend folder path of given lambda path
   * @param {String} lambdaPath 
   * @returns {String}
   * @private
   */
  getBackendPath(lambdaPath) {
    let backendPos = lambdaPath.indexOf('backend');
    let backendPath = lambdaPath.substring(0, backendPos + 'backend'.length);
    return backendPath;
  }

  /**
   * Extracts microservice name from given lambda path
   * @param {String} lambdaPath
   * @return {String}
   * @private
   */
  getMicroserviceName(lambdaPath) {
    let backendPos = lambdaPath.indexOf('backend');
    let backendPath = lambdaPath.substring(0, backendPos + 'backend'.length);

    return backendPath.split('/')[backendPath.split('/').length - 2];
  }

  /**
   * Transform and normalize Lambda Dependencies 
   * @param {Object} deps 
   * @param {String} lambdaPath 
   * @returns {Array}
   * @private
   */
  transformDepToArr(deps, lambdaPath) {
    let depArr = [];
    Object.keys(deps).forEach(key => {
      let shouldAdd = true;
      let _path = deps[key];
      const isRelative = _path.startsWith('file:.');
      const microserviceName = this.getMicroserviceName(lambdaPath);

      if (!this.installedDependencies[microserviceName]) {
        const libs = this._libs.split(' ');
        this.installedDependencies[microserviceName] = libs;
        depArr.push(...libs);
      }

      // Transform relative path to absolute
      if (isRelative) {
        // 5 = 'file:' length
        _path = _path.slice(0, 5) + `${lambdaPath}/` + _path.slice(5);
        // Relative path are checked for dublicates by package name
        if (this.installedDependencies[microserviceName].indexOf(key) !== -1) {
          shouldAdd = false;
        } else {
          this.installedDependencies[microserviceName].push(key);
        }
      }
      if (shouldAdd) {
        depArr.push(`${key}@${_path}`);
      }
    });

    return depArr;
  }

  /**
   * Create flatten compile commands from given lambdas path
   * @param {String} lambdaPaths 
   * @returns {NpmInstall}
   * @private
   */
  extractDependencies(lambdaPaths) {
    lambdaPaths = this.filterDublicates(lambdaPaths);
    for (let lambdaPath of lambdaPaths) {
      const lambdaPackage = require(`${lambdaPath}/package.json`);
      const backendPath = this.getBackendPath(lambdaPath);
      const microserviceName = this.getMicroserviceName(lambdaPath);
      let lambdaDependencies = {};

      Object.assign(lambdaDependencies, lambdaPackage.dependencies, lambdaPackage.devDependencies);

      lambdaDependencies = this.transformDepToArr(lambdaDependencies, lambdaPath)
        .filter(x => this.installedDependencies[microserviceName].indexOf(x) < 0);

      this.installedDependencies[microserviceName].push(...lambdaDependencies);

      // Check if dependencies remained after dublication remove
      if (lambdaDependencies.length) {
        const cmd = `${Bin.npm} --prefix ${backendPath} install ${lambdaDependencies.join(' ')} --no-save`;
        this._cmds.push(cmd);
      }

      const compileCmd = `deepify compile es6 ${lambdaPath}`;
      this._cmds.push(compileCmd);
    }

    return this;
  }

  /**
   * @param {String} libs 
   */
  setUpLibs(libs) {
    this._libs = libs;
  }

  /**
   * @param {Function} cb
   * @param {Boolean} silent
   * @returns {NpmInstall}
   */
  runChunk(cb, silent = NpmInstallFlatten.DEFAULT_SILENT_STATE) {
    if (this._cmds.length <= 0) {
      cb();
      return this;
    }

    this.run(cb, silent);
    return this;
  }

  /**
   * @param {Function} cb
   * @param {Boolean} silent
   * @returns {NpmInstall}
   */
  run(cb, silent = NpmInstallFlatten.DEFAULT_SILENT_STATE) {
    let error = null;

    let wait = new WaitFor();
    let remaining = this._cmds.length;
    let cmdStack = [];

    wait.push(() => {
      return remaining <= 0;
    });

    for (let i in this._cmds) {
      if (!this._cmds.hasOwnProperty(i)) {
        continue;
      }

      let _cmd = this._cmds[i];

      let cmd = new Exec(...this._execArgs(_cmd));

      if (silent) {
        cmd.avoidBufferOverflow();
      }

      console.debug(`Running: '${_cmd}'`);

      cmdStack.push(cmd);
    }

    cmdStack.forEach((cmd) => {
      cmd.run((result) => {
        if (result.failed && !this._silent) {
          error = result.error;
        }

        remaining--;
      }, !silent);
    });

    wait.ready(() => cb(error));

    return this;
  }

  /**
   * @param {String} cmd
   * @returns {Array}
   * @private
   */
  _execArgs(cmd) {
    return [cmd, ...this._extraArgs];
  }

  /**
   * @returns {Boolean}
   */
  static get DEFAULT_SILENT_STATE() {
    return false;
  }
}
