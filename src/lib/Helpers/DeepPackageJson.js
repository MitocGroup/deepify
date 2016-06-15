/**
 * Created by CCristi on 5/27/16.
 */

'use strict';

import fse from 'fs-extra';
import fs from 'fs';

export class DeepPackageJson {
  /**
   * @param {Object} packageJson
   */
  constructor(packageJson) {
    this._packageJson = packageJson;
  }

  /**
   * @param {String} packageFile
   * @returns {DeepPackageJson}
   */
  static createFromFile(packageFile) {
    let packageJson = fse.readJsonSync(packageFile);
    let dependencies = packageJson.dependencies || {};
    let devDependencies = packageJson.devDependencies || {};
    let sharedDependencies = packageJson.sharedDependencies || {
      dependencies: {},
      devDependencies: {}
    };

    Object.keys(sharedDependencies.dependencies).forEach(k => delete dependencies[k]);
    Object.keys(sharedDependencies.devDependencies).forEach(k => delete devDependencies[k]);

    packageJson.dependencies = dependencies;
    packageJson.devDependencies = devDependencies;
    packageJson.sharedDependencies = sharedDependencies;

    return new this(packageJson);
  }

  /**
   * @returns {Object}
   */
  get packageJson() {
    return this._packageJson;
  }

  /**
   * @returns {Object}
   */
  get dependencies() {
    return this._packageJson.dependencies;
  }

  /**
   * @returns {Object}
   */
  get devDependencies() {
    return this._packageJson.devDependencies;
  }

  /**
   * @returns {Object}
   */
  get sharedDependencies() {
    return this._packageJson.sharedDependencies;
  }

  /**
   * @param {Object} sharedDependencies
   */
  set sharedDependencies(sharedDependencies) {
    sharedDependencies.devDependencies = sharedDependencies.devDependencies || {};
    sharedDependencies.dependencies = sharedDependencies.dependencies || {};

    this._packageJson.sharedDependencies = sharedDependencies;
  }

  /**
   * @param {Object} lDeps
   * @param {Object} rDeps
   * @private
   */
  _mergeDependencies(lDeps, rDeps) {
    for (let depName in rDeps) {
      if (!rDeps.hasOwnProperty(depName)) {
        continue;
      }

      if (lDeps.hasOwnProperty(depName)) {
        delete rDeps[depName];
      } else {
        lDeps[depName] = rDeps[depName];
      }
    }
  }

  /**
   * @returns {Object}
   */
  _build() {
    this._mergeDependencies(
      this.dependencies,
      this.sharedDependencies.dependencies
    );

    this._mergeDependencies(
      this.devDependencies,
      this.sharedDependencies.devDependencies
    );

    return this.packageJson;
  }

  /**
   * @param {String} file
   */
  dumpInto(file) {
    let packageRaw = JSON.stringify(
      this._build(),
      null,
      '  '
    );

    fs.writeFileSync(file, packageRaw);
  }
}
