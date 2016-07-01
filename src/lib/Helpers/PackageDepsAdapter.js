/**
 * Created by CCristi on 7/1/16.
 */

'use strict';

import Path from 'path';
import fse from 'fs-extra';
import {FileStrategy} from './AdaptStrategy/FileStrategy';

export class PackageDepsAdapter {
  /**
   * @param {String} path
   */
  constructor(path) {
    this._path = path;
  }

  /**
   * @returns {Object}
   */
  adapt() {
    let packageJson = this._readPackageJson();
    let deps = packageJson.dependencies || {};

    for (let depName in deps) {
      if (!deps.hasOwnProperty(depName)) {
        continue;
      }

      let depVersion = deps[depName];
      let strategy = this._createAdaptStrategy(depName, depVersion);

      if (strategy) {
        deps[strategy.name()] = strategy.version();
      }
    }

    return packageJson;
  }

  /**
   * @param {String} dir
   */
  dumpInto(dir) {
    fse.outputJsonSync(
      Path.join(dir, PackageDepsAdapter.PACKAGE_FILE),
      this.adapt()
    );
  }

  /**
   * @param {String} depName
   * @param {String} depVersion
   * @returns {FileStrategy}
   * @private
   */
  _createAdaptStrategy(depName, depVersion) {
    if (FileStrategy.isLocalDependencyVersion(depVersion)) {
      return new FileStrategy(depName, depVersion, this);
    }

    return null;
  }

  /**
   * @returns {String}
   * @private
   */
  _readPackageJson() {
    return fse.readJsonSync(Path.join(this._path, PackageDepsAdapter.PACKAGE_FILE));
  }

  /**
   * @returns {String}
   */
  get path() {
    return this._path;
  }

  /**
   * @returns {String}
   */
  static get PACKAGE_FILE() {
    return 'package.json';
  }
}
