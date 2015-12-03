/**
 * Created by AlexanderC on 12/3/15.
 */

'use strict';

import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import {NpmShrinkwrap} from './NpmShrinkwrap';
import {NpmDependency} from './NpmDependency';
import {_extend as extend} from 'util';

export class DepsTreeOptimizer {
  /**
   * @param {String} path
   */
  constructor(path) {
    this._path = path;
  }

  /**
   * @returns {String}
   */
  get path() {
    return this._path;
  }

  /**
   * @param {Function} cb
   * @returns {DepsTreeOptimizer}
   */
  optimize(cb) {
    this._lockDeps((lockedDepsRawObject) => {
      let mainDep = NpmDependency.createFromRawObject(lockedDepsRawObject);

      let depsFullNames = this._depsCopyFlatten(mainDep);

      for (let i in depsFullNames) {
        if (!depsFullNames.hasOwnProperty(i)) {
          continue;
        }

        let depFullName = depsFullNames[i];
        let depsVector = mainDep.findAll(depFullName);

        if (depsVector.length > 0) {
          let depFinalPath = this._getFinalPkgPath(depFullName);

          for (let j in depsVector) {
            if (!depsVector.hasOwnProperty(j)) {
              continue;
            }

            let dep = depsVector[j];

            this._injectFinalDep(dep, depFinalPath);
          }
        }
      }

      fse.removeSync(mainDep.getModulesPath(this._path));
      fse.removeSync(this._shrinkwrapConfig);

      cb(depsFullNames);
    });

    return this;
  }

  /**
   * @param {NpmDependency} dep
   * @param {String} depFinalPath
   * @private
   */
  _injectFinalDep(dep, depFinalPath) {
    if (!dep.parent) {
      throw new Error(`Unable to identify ${dep.fullName} usage`);
    }

    // o_O some weird stuff...
    if (dep.fullName === dep.parent.fullName) {
      return;
    }

    let finalPkgPath = dep.parent.isMain
      ? dep.parent.getPath(this._path)
      : this._getFinalPkgPath(dep.parent.fullName);

    let depPackagePath = path.join(finalPkgPath, 'package.json');
    let depName = dep.name;

    let packageObj = fse.readJsonSync(depPackagePath);

    if (!packageObj.dependencies ||
      !packageObj.dependencies.hasOwnProperty(depName)) {
      return;
    }

    packageObj.dependencies[depName] = `./${this._getRelativeFinalPath(depFinalPath, finalPkgPath)}`;

    fse.outputJsonSync(depPackagePath, packageObj);
  }

  /**
   * @param {String} depFinalPath
   * @param {String} depRealPath
   * @returns {String}
   * @private
   */
  _getRelativeFinalPath(depFinalPath, depRealPath) {
    return path.relative(depRealPath, depFinalPath);
  }

  /**
   * @param {NpmDependency} mainDep
   * @returns {String[]}
   * @private
   */
  _depsCopyFlatten(mainDep) {
    let depsFlattenObj = this._getDepsFlatten(mainDep);
    let depsFullNames = Object.keys(depsFlattenObj);

    if (depsFullNames.length <= 0) {
      return depsFullNames;
    }

    for (let pkgFullName in depsFlattenObj) {
      if (!depsFlattenObj.hasOwnProperty(pkgFullName)) {
        continue;
      }

      let pkgPath = depsFlattenObj[pkgFullName];
      let pkgFinalPath = this._getFinalPkgPath(pkgFullName);

      fse.copySync(pkgPath, pkgFinalPath);
      fse.removeSync(path.join(pkgFinalPath, NpmDependency.NODE_MODULES_DIR));
    }

    return depsFullNames;
  }

  /**
   * @param {String} pkgFullName
   * @returns {String}
   * @private
   */
  _getFinalPkgPath(pkgFullName) {
    return path.join(this._deepModulesPath, pkgFullName);
  }

  /**
   * @param {NpmDependency} dep
   * @returns {Object}
   * @private
   */
  _getDepsFlatten(dep) {
    let depsFlattenObj = {};

    if (!dep.isMain) {
      depsFlattenObj[dep.fullName] = dep.getPath(this._path);
    }

    if (dep.hasChildren) {
      for (let i in dep.children) {
        if (!dep.children.hasOwnProperty(i)) {
          continue;
        }

        let depChild = dep.children[i];

        depsFlattenObj = extend(depsFlattenObj, this._getDepsFlatten(depChild));
      }
    }

    return depsFlattenObj;
  }

  /**
   * @returns {String}
   * @private
   */
  get _deepModulesPath() {
    return path.join(this._path, DepsTreeOptimizer.DEEP_MODULES_DIR);
  }

  /**
   * @param {Function} cb
   * @returns {DepsTreeOptimizer}
   */
  _lockDeps(cb) {
    let locker = new NpmShrinkwrap(this._path);

    locker.run(() => {
      cb(this._readShrinkwrapFile());
    });

    return this;
  }

  /**
   * @returns {Object|null}
   * @private
   */
  _readShrinkwrapFile() {
    return fse.readJsonSync(this._shrinkwrapConfig);
  }

  /**
   * @returns {String}
   * @private
   */
  get _shrinkwrapConfig() {
    return path.join(this._path, DepsTreeOptimizer.SHRINKWRAP_FILE);
  }

  /**
   * @returns {String}
   */
  static get DEEP_MODULES_DIR() {
    return 'deep_modules';
  }

  /**
   * @returns {String}
   */
  static get SHRINKWRAP_FILE() {
    return 'npm-shrinkwrap.json';
  }
}