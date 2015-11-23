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
    if (!ForksManager._isManaged) {
      return;
    }

    ForksManager._addForkToStack(fork);

    fork.on('exit', () => {
      ForksManager._removeFork(fork);

      if (ForksManager._isForksStackEmpty &&
        ForksManager._wasMainProcessKilled) {

        process.exit();
      }
    });
  }

  /**
   * @returns {Boolean}
   * @private
   */
  static get _isManaged() {
    return global.hasOwnProperty(ForksManager.STORAGE_KEY) &&
      global.hasOwnProperty(ForksManager.SIGKILL_KEY);
  }

  /**
   * @param {ChildProcess} fork
   * @private
   */
  static _addForkToStack(fork) {
    if (global.hasOwnProperty(ForksManager.STORAGE_KEY)) {
      global[ForksManager.STORAGE_KEY][fork.pid] = fork;
    }
  }

  /**
   * @returns {Boolean}
   * @private
   */
  static get _wasMainProcessKilled() {
    return global.hasOwnProperty(ForksManager.SIGKILL_KEY) &&
      global[ForksManager.SIGKILL_KEY] === true;
  }

  /**
   * @returns {Boolean}
   * @private
   */
  static get _isForksStackEmpty() {
    return !global.hasOwnProperty(ForksManager.STORAGE_KEY) ||
      Object.keys(global[ForksManager.STORAGE_KEY]).length <= 0;
  }

  /**
   * @param {ChildProcess} fork
   * @private
   */
  static _removeFork(fork) {
    if (global.hasOwnProperty(ForksManager.STORAGE_KEY) &&
      global[ForksManager.STORAGE_KEY].hasOwnProperty(fork.pid)) {

      delete global[ForksManager.STORAGE_KEY][fork.pid];
    }
  }

  /**
   * Register listener
   */
  static registerListener() {
    if (ForksManager._isManaged) {
      return;
    }

    global[ForksManager.STORAGE_KEY] = {};
    global[ForksManager.SIGKILL_KEY] = false;

    process.on('SIGTERM', () => {
      global[ForksManager.SIGKILL_KEY] = true;

      if (ForksManager._isForksStackEmpty) {
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
