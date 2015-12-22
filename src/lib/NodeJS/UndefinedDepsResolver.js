/**
 * Created by AlexanderC on 12/4/15.
 */

'use strict';

import {PackageVersionResolver} from './PackageVersionResolver';
import {NpmDependency} from './NpmDependency';
import {Helpers_WaitFor as WaitFor} from 'deep-package-manager';

export class UndefinedDepsResolver {
  /**
   * @param {NpmDependency} mainDep
   */
  constructor(mainDep) {
    if (!mainDep.isMain) {
      throw new Error(`Npm dependency ${mainDep.fullName} is not the deps tree root`);
    } else if(!mainDep.version || mainDep.version === 'undefined') {
      throw new Error(`Npm main dependency version have to be defined in ${mainDep.fullName}`);
    }

    this._mainDep = mainDep;
    this._undefinedStack = [];
    this._cloneShadow = {};
    this._resolvedStack = {};
  }

  /**
   * @returns {NpmDependency}
   */
  get mainDep() {
    return this._mainDep;
  }

  /**
   * @param {Function} cb
   * @returns {UndefinedDepsResolver}
   */
  resolve(cb) {
    this._tryResolveUndefined();

    let wait = new WaitFor();
    let remaining = this._undefinedStack.length;

    wait.push(() => {
      return remaining <= 0;
    });

    wait.ready(() => {
      for (let shadowKey in this._cloneShadow) {
        if (!this._cloneShadow.hasOwnProperty(shadowKey)) {
          continue;
        }

        if (!this._resolvedStack.hasOwnProperty(shadowKey)) {
          continue;
        }

        let shadowStack = this._cloneShadow[shadowKey];

        for (let i in shadowStack) {
          if (!shadowStack.hasOwnProperty(i)) {
            continue;
          }

          let shadowDep = shadowStack[i];
          let suitableDep = this._mainDep.find(shadowDep.name, this._resolvedStack[shadowKey]);

          // @todo: set through an setter
          shadowDep._version = suitableDep.version;
          this._cloneChildrenStack(suitableDep, shadowDep);
        }
      }

      this._cloneShadow = {};
      this._resolvedStack = {};

      cb();
    });

    for (let i in this._undefinedStack) {
      if (!this._undefinedStack.hasOwnProperty(i)) {
        continue;
      }

      let undefinedDep = this._undefinedStack[i];

      new PackageVersionResolver(this._mainDep.defaultRootPath, undefinedDep.name, undefinedDep.requestedVersion)
        .resolve((error, resolvedVersion) => {
          if (error) {
            remaining--;
            return;
          }

          let suitableDep = this._mainDep.find(undefinedDep.name, resolvedVersion);

          if (!suitableDep) {
            remaining--;
            return;
          }

          let shadowKey = `${undefinedDep.name}@${undefinedDep.requestedVersion}`;

          // @todo: set through an setter
          undefinedDep._version = suitableDep.version;
          this._cloneChildrenStack(suitableDep, undefinedDep);

          this._resolvedStack[shadowKey] = resolvedVersion;

          remaining--;
        }, false /* @todo: set this to async by default? */);
    }

    return this;
  }

  /**
   * @param {NpmDependency} suitableDep
   * @param {NpmDependency} parentDep
   * @private
   */
  _cloneChildrenStack(suitableDep, parentDep) {
    for (let i in suitableDep.children) {
      if (!suitableDep.children.hasOwnProperty(i)) {
        continue;
      }

      let childDep = suitableDep.children[i];
      let clonedDep = new NpmDependency(childDep.name, childDep.version, childDep.isMain);
      clonedDep.requestedVersion = childDep.requestedVersion;

      this._cloneChildrenStack(childDep, clonedDep);

      parentDep.addChild(clonedDep);
      clonedDep.parent = parentDep;

      if (!clonedDep.version || clonedDep.version === 'undefined') {
        let shadowKey = `${clonedDep.name}@${clonedDep.requestedVersion}`;

        if (!this._cloneShadow.hasOwnProperty(shadowKey)) {
          this._cloneShadow[shadowKey] = [];
        }

        this._cloneShadow[shadowKey].push(clonedDep);
      }
    }
  }

  /**
   * @param {NpmDependency} dep
   * @returns {NpmDependency}
   * @returns {*}
   */
  _tryResolveUndefined(dep = null) {
    dep = dep || this._mainDep;

    if (!dep.version || dep.version === 'undefined') {
      if (!dep.parent) {
        throw new Error('Missing parent on a non deps tree root');
      }

      this._undefinedStack.push(dep);
    }

    for (let i in dep.children) {
      if (!dep.children.hasOwnProperty(i)) {
        continue;
      }

      this._tryResolveUndefined(dep.children[i]);
    }

    return this;
  }
}
