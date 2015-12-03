/**
 * Created by AlexanderC on 12/2/15.
 */

'use strict';

import path from 'path';

export class NpmDependency {
  /**
   * @param {String} name
   * @param {String} version
   * @param {Boolean} isMain
   */
  constructor(name, version, isMain = false) {
    this._name = name;
    this._version = version;

    this._parent = null;
    this._children = [];
    this._isMain = isMain;
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
   * @param {String|null} version
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

      if (child.name === dependencyName && (!version || child.version === version)) {
        result.push(child);
      }

      result = result.concat(child.findAll(dependencyName, version));
    }

    return result;
  }

  /**
   * @param {String} dependencyName
   * @param {String|null} version
   * @returns {NpmDependency|null}
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

      if (child.name === dependencyName && (!version || child.version === version)) {
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
   * @param {String} rootPath
   * @returns {String}
   */
  getModulesPath(rootPath = '') {
    return path.join(rootPath, NpmDependency.NODE_MODULES_DIR);
  }

  /**
   * @param {String} rootPath
   * @param {Boolean} skipMain
   * @returns {String}
   */
  getPackagePath(rootPath = '', skipMain = true) {
    let mainPath = this.getPath(rootPath, skipMain);

    return path.join(mainPath, 'package.json');
  }

  /**
   * @param {String} rootPath
   * @param {Boolean} skipMain
   * @returns {String}
   */
  getPath(rootPath = '', skipMain = true) {
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

    if (mainDep.isMain && isMain === null) {
      isMain = false;
    }

    if (rawDepsObject.hasOwnProperty('dependencies') &&
      typeof rawDepsObject.dependencies === 'object') {

      for (let depName in rawDepsObject.dependencies) {
        if (!rawDepsObject.dependencies.hasOwnProperty(depName)) {
          continue;
        }

        let depData = rawDepsObject.dependencies[depName];
        depData.name = depName;

        let dep = NpmDependency.createFromRawObject(depData, isMain);
        dep.parent = mainDep;

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
}
