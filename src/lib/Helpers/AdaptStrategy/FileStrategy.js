/**
 * Created by CCristi on 7/1/16.
 */

'use strict';

import path from 'path';
import {AbstractStrategy} from './AbstractStrategy';

export class FileStrategy extends AbstractStrategy {
  /**
   * @param {String} depName
   * @param {String} depVersion
   * @param {PackageDepsAdapter} adapter
   */
  constructor(depName, depVersion, adapter) {
    super();

    this._name = depName;
    this._version = depVersion;
    this._adapter = adapter;
  }

  /**
   * @returns {String}
   */
  name() {
    return this._name;
  }

  /**
   * @returns {String}
   */
  version() {
    let depPath = this._depPath;
    let depAbsPath = path.isAbsolute(depPath) ?
      depPath :
      path.resolve(this._adapter.path, depPath);

    return this._buildVersion(depAbsPath);
  }

  /**
   * @param {String} path
   * @returns {String}
   * @private
   */
  _buildVersion(path) {
    return `file:${path}`;
  }

  /**
   * @returns {String}
   * @private
   */
  get _depPath() {
    return this._version.replace(/^file:(.+)$/, '$1');
  }

  /**
   * @param {String} depVersion
   * @returns {Boolean}
   */
  static isLocalDependencyVersion(depVersion) {
    return /^file:/.test(depVersion);
  }
}
