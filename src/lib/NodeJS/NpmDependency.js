/**
 * Created by AlexanderC on 12/2/15.
 */

'use strict';

import path from 'path';

export class NpmDependency {
  /**
   * @param {String} name
   * @param {String} version
   */
  constructor(name, version) {
    this._name = name;
    this._version = version;

    this._parent = null;
    this._children = [];
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
   * @param {String} dependencyName
   * @returns {NpmDependency[]}
   */
  findAll(dependencyName) {
    let result = [];

    for (let i in this._children) {
      if (!this._children.hasOwnProperty(i)) {
        continue;
      }

      let child = this._children[i];

      if (child.name === dependencyName) {
        result.push(child);
      }

      result = result.concat(child.findAll(dependencyName));
    }

    return result;
  }

  /**
   * @param {String} dependencyName
   * @returns {NpmDependency|null}
   */
  find(dependencyName) {
    for (let i in this._children) {
      if (!this._children.hasOwnProperty(i)) {
        continue;
      }

      let child = this._children[i];

      if (child.name === dependencyName) {
        return child;
      }
    }

    for (let i in this._children) {
      if (!this._children.hasOwnProperty(i)) {
        continue;
      }

      let child = this._children[i];

      let dep = child.find(dependencyName);

      if (dep) {
        return dep;
      }
    }

    return null;
  }

  /**
   * @param {String} rootPath
   * @returns {String}
   */
  getPath(rootPath = '') {
    return path.join(
      rootPath,
      this._parent ? this._parent.getPath(rootPath) : '',
      'node_modules',
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
   * @returns {NpmDependency}
   */
  static createFromRawObject(rawDepsObject) {
    let mainDep = new NpmDependency(rawDepsObject.name, rawDepsObject.version);

    if (rawDepsObject.hasOwnProperty('dependencies') &&
      typeof rawDepsObject.dependencies === 'object') {

      for (let depName in rawDepsObject.dependencies) {
        if (!rawDepsObject.dependencies.hasOwnProperty(depName)) {
          continue;
        }

        let depData = rawDepsObject.dependencies[depName];
        depData.name = depName;

        let dep = NpmDependency.createFromRawObject(depData);
        dep.parent = mainDep;

        mainDep.addChild(dep);
      }
    }

    return mainDep;
  }
}
