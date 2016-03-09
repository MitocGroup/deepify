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
import {Exec} from '../Helpers/Exec';
import gatherDependencies from 'gather-dependencies';
import {UndefinedDepsResolver} from './UndefinedDepsResolver';
import {Bin} from './Bin';

export class DepsTreeOptimizer {
  /**
   * @param {String} path
   */
  constructor(path) {
    this._path = path;

    this._packageCache = {};
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
      mainDep.defaultRootPath = this._path;



      //@todo: remove when shrinkwrap dump file fixed
      new UndefinedDepsResolver(mainDep)
        .resolve(() => {
          mainDep.removeUndefined();

          let depsFullNames = this._depsCopyFlatten(mainDep);
          let tweakedModules = {};

          console.log('depsFullNames: ', depsFullNames);

          for (let i in depsFullNames) {
            if (!depsFullNames.hasOwnProperty(i)) {
              continue;
            }

            let depFullName = depsFullNames[i];
            let depsVector = mainDep.findAll(depFullName);

            console.log('depsVector: ', depsVector);

            if (depsVector.length > 0) {
              let depFinalPath = this._getFinalPkgPath(depFullName);

              for (let j in depsVector) {
                if (!depsVector.hasOwnProperty(j)) {
                  continue;
                }

                let dep = depsVector[j];

                if (this._injectFinalDep(dep, depFinalPath) && !dep.parent.isMain) {
                  if (!tweakedModules.hasOwnProperty(depFullName)) {
                    tweakedModules[depFullName] = [];
                  }

                  tweakedModules[depFullName].push(dep.parent.fullName);
                }
              }
            }
          }

          fse.removeSync(mainDep.getModulesPath());
          fse.removeSync(this._shrinkwrapConfig);

          this._dumpDependencies();

          cb(depsFullNames);
        });
    });

    return this;
  }

  /**
   * @private
   */
  _dumpDependencies() {
    for (let depPackagePath in this._packageCache) {
      if (!this._packageCache.hasOwnProperty(depPackagePath)) {
        continue;
      }

      let packageObj = this._packageCache[depPackagePath];

      if (packageObj.hasOwnProperty('dependencies')) {
        let nodeModulesPath = path.join(path.dirname(depPackagePath), NpmDependency.NODE_MODULES_DIR);

        fse.ensureDirSync(nodeModulesPath);

        for (let depName in packageObj.dependencies) {
          if (!packageObj.dependencies.hasOwnProperty(depName)) {
            continue;
          }

          let depLocalPath = packageObj.dependencies[depName];

          console.log('LINK to: ', depName);
          console.log('depLocalPath: ', depLocalPath);

          if (!fs.existsSync(path.join(nodeModulesPath, '..', depLocalPath))) {
              console.log('continue');
              continue;
          }

          console.log('else');
          let linkCmd = new Exec('ln -s', path.join('..', depLocalPath), depName);
          linkCmd.cwd = nodeModulesPath;

          let result = linkCmd.runSync();

          if (result.failed) {
            throw new Error(result.error);
          }
        }
      }

      fse.outputJsonSync(depPackagePath, packageObj);
    }

    this._packageCache = {};
  }

  /**
   * @param {NpmDependency} dep
   * @param {String} depFinalPath
   * @returns {Boolean}
   * @private
   */
  _injectFinalDep(dep, depFinalPath) {
    if (!dep.parent) {
      throw new Error(`Unable to identify ${dep.fullName} usage`);
    }

    let finalPkgPath = dep.parent.isMain
      ? dep.parent.getPath(this._path)
      : this._getFinalPkgPath(dep.parent.fullName);

    let depPackagePath = path.join(finalPkgPath, 'package.json');
    let depName = dep.name;

    let packageObj = null;

    if (!this._packageCache.hasOwnProperty(depPackagePath)) {
      packageObj = fse.readJsonSync(depPackagePath);

      this._packageCache[depPackagePath] = packageObj;
    } else {
      packageObj = this._packageCache[depPackagePath];
    }

    packageObj.dependencies[depName] = `./${this._getRelativeFinalPath(depFinalPath, finalPkgPath)}`;

    return true;
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

      let pkgPath = this._findPkgDownTree(depsFlattenObj[pkgFullName]);
      let pkgFinalPath = this._getFinalPkgPath(pkgFullName);

      fse.copySync(pkgPath, pkgFinalPath);
      fse.removeSync(path.join(pkgFinalPath, NpmDependency.NODE_MODULES_DIR));
    }

    return depsFullNames;
  }

  /**
   * @param {String} pkgPath
   * @param {String|null} initialPkgPath
   * @returns {String}
   * @private
   */
  _findPkgDownTree(pkgPath, initialPkgPath= null) {
    if (fs.existsSync(pkgPath)) {
      return pkgPath;
    }

    initialPkgPath = initialPkgPath || pkgPath;

    let resolvedPath = path.normalize(this._path);
    let pkgName = path.basename(pkgPath);
    let downPath = path.normalize(
      path.join(pkgPath, '..', '..', '..')
    );

    if (downPath.length < resolvedPath.length ||
      path.basename(downPath) !== NpmDependency.NODE_MODULES_DIR) {

      throw new Error(
        `Missing package in the deps tree: ${initialPkgPath} ---> ${pkgPath}`
      );
    }

    let matchedPkgPath = this._findPkgUpperTheTree(downPath, pkgName);

    if (matchedPkgPath) {
      return matchedPkgPath;
    }

    return this._findPkgDownTree(path.join(downPath, pkgName), initialPkgPath);
  }

  /**
   * @param {String} upperPath
   * @param {String} pkgName
   * @returns {String}
   * @private
   */
  _findPkgUpperTheTree(upperPath, pkgName) {
    let pkgPath = path.join(upperPath, pkgName);

    if (fs.existsSync(pkgPath)) {
      return pkgPath;
    }

    if (!fs.existsSync(upperPath)) {
      return null;
    }

    let upperPkgVector = fs.readdirSync(upperPath);

    for (let i in upperPkgVector) {
      if (!upperPkgVector.hasOwnProperty(i)) {
        continue;
      }

      let upperPkgName = upperPkgVector[i];

      let upperPkgPath = path.join(upperPath, upperPkgName, NpmDependency.NODE_MODULES_DIR);

      if (fs.existsSync(upperPkgPath)) {
        let matchedPath = this._findPkgUpperTheTree(upperPkgPath, pkgName);

        if (matchedPath) {
          return matchedPath;
        }
      }
    }

    return null;
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
      // @todo: fix missing deps (need all of them!)
      if (Bin.npmMajorVersion >= 3) {
        cb(this._readShrinkwrapFile());
      } else {
        gatherDependencies(this._path, (error, data) => {
          if (error) {
            throw error;
          }

          cb(data);
        });
      }
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