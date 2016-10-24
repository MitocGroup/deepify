/**
 * Created by AlexanderC on 3/17/16.
 */

'use strict';

import {Exec} from './Exec';
import path from 'path';
import semver from 'semver';
import {Prompt} from '../Terminal/Prompt';
import fse from 'fs-extra';

export class LodashOptimizer {
  /**
   * @param {String} lambdaPath
   * @param {Boolean} quiet
   */
  constructor(lambdaPath, quiet = true) {
    this._lambdaPath = lambdaPath;
    this._quiet = quiet;
  }

  /**
   * @returns {String|*}
   */
  get lambdaPath() {
    return this._lambdaPath;
  }

  /**
   * @returns {Boolean}
   */
  get quiet() {
    return this._quiet;
  }

  /**
   * @param {Function} cb
   * @returns {LodashOptimizer}
   */
  optimize(cb) {
    this._listDeps((error, lodashObj) => {
      if (error) {
        cb(error);
        return;
      }

      let versions = Object
        .keys(lodashObj)
        .sort(semver.rcompare)
        .filter((v) => semver.satisfies(v, LodashOptimizer.ALLOWED_VERSION_EXPR));

      if (versions.length <= 1) {
        cb(null);
        return;
      }

      this._confirm(
        LodashOptimizer.getPromptMsg(versions),
        () => {
          let mainVersion = versions.shift();
          let basePath = path.dirname(lodashObj[mainVersion]);

          versions.forEach((version) => {
            let lodashPath = lodashObj[version];

            try {
              fse.removeSync(lodashPath);
            } catch (error) {
              console.error(error);
            }

            let linkCmd = new Exec(
              `ln -s ./${LodashOptimizer.LODASH}@${mainVersion} ${LodashOptimizer.LODASH}@${version}`
            );
            linkCmd.cwd = basePath;

            let result = linkCmd.runSync();

            if (result.failed) {
              console.error(result.error);
            }
          });

          cb(null);
        },
        () => {
          cb(null);
        }
      );
    });

    return this;
  }

  /**
   * @param {String} msg
   * @param {Function} onConfirmCb
   * @param {Function} onCancelCb
   * @private
   */
  _confirm(msg, onConfirmCb, onCancelCb) {
    if (this._quiet) {
      onConfirmCb();
      return;
    }

    new Prompt(msg).readConfirm((result) => {
      if (!result) {
        onCancelCb();
        return;
      }

      onConfirmCb();
    });
  }

  /**
   * @param {String[]} versions
   * @returns {String}
   */
  static getPromptMsg(versions) {
    let versionsCopy = [].concat(versions);

    let mainVersion = versionsCopy.shift();

    return `Would you like to merge ${LodashOptimizer.LODASH}@${mainVersion} in ${this._lambdaPath}` +
      ` with the following older versions: ${versionsCopy.join(', ')}?`;
  }

  /**
   * @param {Function} cb
   * @private
   */
  _listDeps(cb) {
    let cmd = new Exec(LodashOptimizer.FIND_CMD);

    cmd.cwd = this._lambdaPath;

    cmd
      .run((result) => {
        if (result.failed) {
          cb(result.error, null);
          return;
        }

        let deps = result.result
          .split('\n')
          .map((d) => (d || '').trim())
          .filter((d) => !!d);

        let depsObj = {};

        for (let i in deps) {
          if (!deps.hasOwnProperty(i)) {
            continue;
          }

          let depPath = path.join(this._lambdaPath, deps[i].replace(/[\/|\\]/ig, path.sep));
          let depVersion = path.basename(depPath).replace(`${LodashOptimizer.LODASH}@`, '');

          depsObj[depVersion] = depPath;
        }

        cb(null, depsObj);
      });
  }

  /**
   * @returns {String}
   */
  static get LODASH() {
    return 'lodash';
  }

  /**
   * @returns {String}
   */
  static get ALLOWED_VERSION_EXPR() {
    return '>=2.x.x';
  }

  /**
   * @return {String}
   */
  static get FIND_CMD() {
    return 'find deep_modules -maxdepth 1 -type d -ipath "*/lodash@*"';
  }
}
