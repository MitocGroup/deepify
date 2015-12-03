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
    this.lockDeps((lockedDepsRawObject) => {
      if (!lockedDepsRawObject) {
        throw new Error(`Broken shrinkwrap file`);
      }

      let mainDep = NpmDependency.createFromRawObject(lockedDepsRawObject, true);
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
    let depPackagePath = dep.getPackagePath(this._path);
    let depName = dep.name;

    if (!dep.parent) {
      throw new Error(`Unable to identify ${dep.fullName} usage`);
    }

    let packageObj = fse.readJSONSync(depPackagePath);

    if (!packageObj.dependencies ||
      !packageObj.dependencies.hasOwnProperty(depName)) {
      throw new Error(`Missing ${dep.fullName} in ${dep.fullName} package`);
    }

    let depRealPath = dep.parent.getPath(this._path);

    packageObj.dependencies[depName] = `file:${this._getRelativeFinalPath(depFinalPath, depRealPath)}`;

    fs.outputJsonSync(depPackagePath, packageObj);
  }

  /**
   * @param {String} depFinalPath
   * @param {String} depRealPath
   * @returns {String}
   * @private
   */
  _getRelativeFinalPath(depFinalPath, depRealPath) {
    return path.relative(depFinalPath, depRealPath);
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

      fse.ensureDirSync(pkgFinalPath);
      fse.copy(pkgPath, pkgFinalPath);
      fse.removeSync(pkgPath);
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

    depsFlattenObj[dep.fullName] = dep.getPath(this._path);
console.log(dep.fullName, dep.getPath(this._path));//@todo:remove
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
  lockDeps(cb) {
    let locker = new NpmShrinkwrap(this._path);

    locker.run(() => {
      let lockedDepsRawObject = this._readShrinkwrapFile();

      cb(lockedDepsRawObject);
    });

    return this;
  }

  /**
   * @returns {Object|null}
   * @private
   */
  _readShrinkwrapFile() {
    let file = path.join(this._path, DepsTreeOptimizer.SHRINKWRAP_FILE);

    if (!fs.existsSync(file)) {
      return null;
    }

    return fse.readJSONSync(file);
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