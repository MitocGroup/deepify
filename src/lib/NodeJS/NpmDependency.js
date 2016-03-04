/**
 * Created by AlexanderC on 12/2/15.
 */

'use strict';

import path from 'path';
import fse from 'fs-extra';
import fs from 'fs';
import os from 'os';
import {Exec} from './../Helpers/Exec';

export class NpmDependency {
  /**
   * @param {String} name
   * @param {String} version
   * @param {Boolean} isMain
   */
  constructor(name, version, isMain = false) {
    this._name = name;
    this._version = version;
    this._requestedVersion = version;

    this._parent = null;
    this._children = [];
    this._isMain = isMain;
    this._defaultRootPath = '';
  }

  /**
   * @returns {String}
   */
  get defaultRootPath() {
    return this._defaultRootPath;
  }

  /**
   * @param {String} path
   */
  set defaultRootPath(path) {
    this._defaultRootPath = path;
  }

  /**
   * @param {String} version
   */
  set requestedVersion(version) {
    this._requestedVersion = version;
  }

  /**
   * @returns {String}
   */
  get requestedVersion() {
    return this._requestedVersion;
  }

  /**
   * @returns {Boolean}
   */
  get isMain() {
    return this._isMain;
  }

  /**
   * @returns {String}
   */
  get name() {
    return this._name;
  }

  /**
   * @returns {String}
   */
  get version() {
    return this._version;
  }

  /**
   * @returns {String}
   */
  get fullName() {
    return `${this._name}@${this._version}`;
  }

  /**
   * @param {String} dependencyName
   * @param {String|RegExp|null} version
   * @returns {NpmDependency[]}
   */
  findAll(dependencyName, version = null) {
    let depObj = NpmDependency._resolveFullDepName(dependencyName);

    dependencyName = depObj.name;
    version = version || depObj.version;

    let result = [];

    for (let i in this._children) {
      if (!this._children.hasOwnProperty(i)) {
        continue;
      }

      let child = this._children[i];

      if (child.name === dependencyName &&
        NpmDependency._matchVersion(version, child.version)) {
        result.push(child);
      }

      result = result.concat(child.findAll(dependencyName, version));
    }

    return result;
  }

  /**
   * @param {NpmDependency[]} depsVector
   * @param {String} dependencyName
   * @param {String} version
   * @returns {NpmDependency|null}
   */
  static matchInVector(depsVector, dependencyName, version = null) {
    let depObj = NpmDependency._resolveFullDepName(dependencyName);

    dependencyName = depObj.name;
    version = version || depObj.version;

    for (let i in depsVector) {
      if (!depsVector.hasOwnProperty(i)) {
        continue;
      }

      let dep = depsVector[i];

      if (dep.name === dependencyName &&
        NpmDependency._matchVersion(version, dep.version)) {
        return dep;
      }
    }

    return null;
  }

  /**
   * @param {String} dependencyName
   * @param {String|RegExp|null} version
   * @returns {NpmDependency|null|*}
   */
  find(dependencyName, version = null) {
    let depObj = NpmDependency._resolveFullDepName(dependencyName);

    dependencyName = depObj.name;
    version = version || depObj.version;

    for (let i in this._children) {
      if (!this._children.hasOwnProperty(i)) {
        continue;
      }

      let child = this._children[i];

      if (child.name === dependencyName &&
        NpmDependency._matchVersion(version, child.version)) {
        return child;
      }
    }

    for (let i in this._children) {
      if (!this._children.hasOwnProperty(i)) {
        continue;
      }

      let child = this._children[i];

      let dep = child.find(dependencyName, version);

      if (dep) {
        return dep;
      }
    }

    return null;
  }

  /**
   * @param {String|RegExp|null} version
   * @param {String} pkgVersion
   * @returns {Boolean}
   * @private
   */
  static _matchVersion(version, pkgVersion) {
    pkgVersion = pkgVersion || '';

    if (!version) {
      return true;
    } else if(version instanceof RegExp) {
      return version.test(pkgVersion);
    }

    return version === pkgVersion;
  }

  /**
   * @param {String} dependencyName
   * @returns {{name: *, version: *}}
   * @private
   */
  static _resolveFullDepName(dependencyName) {
    let parts = (dependencyName || '').split('@');

    return {
      name: parts[0],
      version: parts.length > 1 ? parts[1] : null,
    };
  }

  /**
   * @returns {NpmDependency}
   */
  removeUndefined() {
    let childrenCopy = [];

    for (let i in this._children) {
      if (!this._children.hasOwnProperty(i)) {
        continue;
      }

      let childDep = this._children[i];

      if (!childDep.version || childDep.version === 'undefined') {

        if (fs.existsSync(this.defaultRootPath)) {
          NpmDependency.removeSync(this.defaultRootPath);
        }

        continue;
      }

      childrenCopy.push(childDep);
      childDep.removeUndefined();
    }

    this._children = childrenCopy;

    return this;
  }

  /**
   * @param {String} rootPath
   * @returns {String}
   */
  getModulesPath(rootPath = '') {
    rootPath = rootPath || this._defaultRootPath;

    return path.join(rootPath, NpmDependency.NODE_MODULES_DIR);
  }

  /**
   * @param {String} rootPath
   * @param {Boolean} skipMain
   * @returns {String}
   */
  getPackagePath(rootPath = '', skipMain = true) {
    rootPath = rootPath || this._defaultRootPath;

    let mainPath = this.getPath(rootPath, skipMain);

    return path.join(mainPath, 'package.json');
  }

  /**
   * @param {String} rootPath
   * @param {Boolean} skipMain
   * @returns {String}
   */
  getPath(rootPath = '', skipMain = true) {
    rootPath = rootPath || this._defaultRootPath;

    if (skipMain && this._isMain) {
      return rootPath;
    }

    if (!this._parent) {
      return path.join(rootPath, this._name);
    }

    return path.join(
      this._parent.getPath(rootPath),
      NpmDependency.NODE_MODULES_DIR,
      this._name
    );
  }

  /**
   * @param {NpmDependency} child
   * @returns {NpmDependency}
   */
  addChild(child) {
    this._children.push(child);

    if (child.parent !== this) {
      child.parent = this;
    }

    return this;
  }

  /**
   * @returns {Boolean}
   */
  get hasChildren() {
    return this._children.length > 0;
  }

  /**
   * @returns {NpmDependency[]}
   */
  get children() {
    return this._children;
  }

  /**
   * @param {NpmDependency} parent
   */
  set parent(parent) {
    this._parent = parent;

    if (this._parent.children.indexOf(this) === -1) {
      this._parent.addChild(this);
    }
  }

  /**
   * @returns {NpmDependency}
   */
  get parent() {
    return this._parent;
  }

  /**
   * @param {Object} rawDepsObject
   * @param {Boolean|null} isMain
   * @returns {NpmDependency}
   */
  static createFromRawObject(rawDepsObject, isMain = null) {
    let mainDep = new NpmDependency(
      rawDepsObject.name,
      rawDepsObject.version,
      isMain === null ? true : isMain
    );

    if (rawDepsObject.hasOwnProperty('requestedVersion')) {
      mainDep.requestedVersion = rawDepsObject.requestedVersion;
    }

    if (mainDep.isMain && isMain === null) {
      isMain = false;
    }

    if (rawDepsObject.hasOwnProperty('dependencies')) {
      for (let depName in rawDepsObject.dependencies) {
        if (!rawDepsObject.dependencies.hasOwnProperty(depName)) {
          continue;
        }

        let depData = rawDepsObject.dependencies[depName];
        depData.name = depName;

        let dep = NpmDependency.createFromRawObject(depData, isMain);

        mainDep.addChild(dep);
      }
    }

    return mainDep;
  }

  /**
   * @returns {String}
   */
  static get NODE_MODULES_DIR() {
    return 'node_modules';
  }

  /**
   * @param {Boolean} noHeader
   * @returns {String}
   */
  toString(noHeader = false) {
    let str = '';
    let pad = new Array(this._getParentsDepth()).join('    ');

    if (!noHeader) {
      str += `- ${pad}${this.fullName}${os.EOL}`;
    }

    for (let i in this._children) {
      if (!this._children.hasOwnProperty(i)) {
        continue;
      }

      let childDep = this._children[i];

      str += `${pad}  - ${childDep.fullName}${os.EOL}`;

      if (!childDep.hasChildren) {
        continue;
      }

      str += childDep.toString(true);
    }

    return str;
  }

  /**
   * @returns {Number}
   * @private
   */
  _getParentsDepth() {
    let i = 0;
    let current = this;

    while(current.parent) {
      i++;
      current = current.parent;
    }

    return i;
  }

  static get isWindows() {
    return /^win/.test(process.platform);
  }

  static removeSync(pathToRemove) {

    if (isWindows()) {
      var remover = new Exec('rm -r -f ' + pathToRemove);

      remover.avoidBufferOverflow().runSync();
    } else {
      fse.removeSync(pathToRemove);
    }

  }
}
