/**
 * Created by AlexanderC on 8/17/15.
 */

'use strict';

import Core from 'deep-core';
import FileSystem from 'fs';
import Path from 'path';
import {Helpers_Hash as Hash} from 'deep-package-manager';
import OS from 'os';
import MakeDir from 'mkdirp';

export class AbstractProfiler extends Core.OOP.Interface {
  /**
   * @param {String} name
   */
  constructor(name = null) {
    super(['start', 'stop']);

    this._profilesPath = AbstractProfiler._tmpDir;

    MakeDir.sync(this._profilesPath);

    this._name = null;
    this._lastProfile = null;

    this.name = name || Hash.pseudoRandomId(this._lambda);
  }

  /**
   * @returns {String}
   * @private
   */
  static get _tmpDir() {
    return Path.join(
      OS.tmpdir(),
      `__deep_profiling-${process.pid}`
    );
  }

  /**
   * @param {String} name
   * @param {String} rootPath
   * @returns {String}
   */
  static getDumpFile(name, rootPath = null) {
    return Path.join(rootPath || AbstractProfiler._tmpDir, `${Hash.md5(name)}${AbstractProfiler.EXTENSION}`);
  }

  /**
   * @returns {String}
   */
  get name() {
    return this._name;
  }

  /**
   * @param {String} name
   */
  set name(name) {
    this._name = name;
    this._dumpFile = AbstractProfiler.getDumpFile(name, this._profilesPath);
  }

  /**
   * @returns {String}
   */
  get dumpFile() {
    return this._dumpFile;
  }

  /**
   * @param {Object} profileData
   */
  set profile(profileData) {
    this._lastProfile = profileData;
  }

  /**
   * @returns {Object}
   */
  get profile() {
    return this._lastProfile;
  }

  /**
   * @returns {String}
   */
  get profilePlain() {
    return JSON.stringify(this.profile, null, 2);
  }

  /**
   * @param {Function} callback
   */
  save(callback) {
    FileSystem.writeFile(
      this.dumpFile,
      this.profilePlain,
      'utf8',
      function(error) {
        callback(error, this.dumpFile);
      }.bind(this)
    );
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get EXTENSION() {
    return '.cpuprofile';
  }
}
