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
      cb();
    });

    for (let i in this._undefinedStack) {
      if (!this._undefinedStack.hasOwnProperty(i)) {
        continue;
      }

      let undefinedDep = this._undefinedStack[i];

      new PackageVersionResolver(undefinedDep.name, undefinedDep.requestedVersion)
        .resolve((error, resolvedVersion) => {
          if (error) {
            throw error;
          }

          let suitableDep = this._mainDep.find(undefinedDep.name, resolvedVersion);

          if (!suitableDep) {
            let fullVersion = `${undefinedDep.name}@${undefinedDep.requestedVersion}`;
            let resolvedFullName = `${undefinedDep.name}@${resolvedVersion}`;

            throw new Error(
              `Unable to find suitable dep for ${fullVersion} resolved into ${resolvedFullName}`
            );
          }

          // @todo: set through an setter
          undefinedDep._version = suitableDep.version;

          UndefinedDepsResolver._cloneChildrenStack(suitableDep, undefinedDep);
        });
    }

    return this;
  }

  /**
   * @param {NpmDependency} suitableDep
   * @param {NpmDependency} parentDep
   * @private
   */
  static _cloneChildrenStack(suitableDep, parentDep) {
    for (let i in suitableDep.children) {
      if (!suitableDep.children.hasOwnProperty(i)) {
        continue;
      }

      let childDep = suitableDep.children[i];
      let clonedDep = new NpmDependency(childDep.name, childDep.version, childDep.isMain);
      clonedDep.requestedVersion = childDep.requestedVersion;

      UndefinedDepsResolver._cloneChildrenStack(childDep, clonedDep);

      parentDep.addChild(clonedDep);
      clonedDep.parent = parentDep;
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

      this._tryResolveUndefined(this.children[i]);
    }

    return this;
  }
}
