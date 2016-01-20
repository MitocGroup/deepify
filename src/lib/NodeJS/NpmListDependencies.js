/**
 * Created by AlexanderC on 12/2/15.
 */

'use strict';

import {Bin} from './Bin';
import {Exec} from '../Helpers/Exec';
import {NpmDependency} from './NpmDependency';
import {NpmDepsListException} from './Exception/NpmDepsListException';

export class NpmListDependencies {
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
   * @param {Number|null} depth
   * @returns {NpmDependency}
   */
  list(depth = null) {
    let cmd = new Exec(
      `${Bin.npm} ls --json true --parseable true --loglevel silent --production`,
      depth ? `--depth ${depth}` : ''
    );

    cmd.cwd = this._path;

    let result = cmd.runSync();

    if (result.failed) {
      throw new NpmDepsListException(result.error, result.result);
    }

    let deps = JSON.parse(result.result);

    if (!deps) {
      throw new Error(`Broken dependencies object: ${result.result}`);
    }

    return NpmDependency.createFromRawObject(deps);
  }
}
