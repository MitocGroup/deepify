/**
 * Created by AlexanderC on 11/20/15.
 */

'use strict';

/**
 * This class is indeed to prevent the process
 * to be killed when there are some other
 * forks running (async lambdas)
 */
export class ForksManager {

  /**
   * @param {ChildProcess} fork
   */
  static manage(fork) {
    if (!global.hasOwnProperty(ForksManager.STORAGE_KEY) ||
      !global.hasOwnProperty(ForksManager.SIGKILL_KEY)) {
      return;
    }

    global[ForksManager.STORAGE_KEY].push(fork);

    fork.on('exit', () => {
      let forkIdx = global[ForksManager.STORAGE_KEY].indexOf(fork);

      global[ForksManager.STORAGE_KEY] = global[ForksManager.STORAGE_KEY].slice(forkIdx, 1);

      if (global[ForksManager.STORAGE_KEY].length <= 0 &&
        global[ForksManager.SIGKILL_KEY] === true) {
        process.exit();
      }
    });
  }

  /**
   * Register listener
   */
  static registerListener() {
    global[ForksManager.STORAGE_KEY] = [];
    global[ForksManager.SIGKILL_KEY] = false;

    process.on('SIGTERM', () => {
      global[ForksManager.SIGKILL_KEY] = true;

      if (global[ForksManager.STORAGE_KEY].length <= 0) {
        process.exit();
      }
    });
  }

  /**
   * @returns {String}
   */
  static get STORAGE_KEY() {
    return '_deep_fm_forks_';
  }

  /**
   * @returns {String}
   */
  static get SIGKILL_KEY() {
    return '_deep_fm_sigkill_';
  }
}
