/**
 * Created by CCristi on 5/16/16.
 */

'use strict';

import {AbstractLauncher} from './AbstractLauncher';
import {Exec} from '../../Helpers/Exec';
import {MissingElasticsearchBinaryException} from '../Exception/MissingElasticsearchBinaryException';
import {FailedToLauchElasticsearchException} from '../Exception/FailedToLauchElasticsearchException';
import {ServerAlreadyRunningException} from '../Exception/ServerAlreadyRunningException';
import path from 'path';
import FS from 'fs';
import lock from 'lockfile';
import process from 'process';

export class BinaryLauncher extends AbstractLauncher {
  /**
   * @param {String} binaryPath
   */
  constructor(binaryPath) {
    super();

    this._binaryPath = binaryPath;
    this._pid = null;
  }

  /**
   * @returns {BinaryLauncher}
   * @private
   */
  _launch() {
    this._assureBinary();
    this._lock();
    let pidFile = this._pidFile;

    let launchCmd = new Exec(
      this._binaryPath,
      '--daemonize',
      `--pidfile=${pidFile}`,
      `--network.host=${this.hostname}`,
      `--http.port=${this.port}`
    );

    for (let setting in this.settings) {
      if (!this.settings.hasOwnProperty(setting)) {
        continue;
      }

      let settingVal = this.settings[setting];

      launchCmd.addArg(`--${setting}=${settingVal}`);
    }

    launchCmd.runSync();

    if (launchCmd.failed) {
      throw new FailedToLauchElasticsearchException(this, launchCmd.error);
    }

    this._pid = FS.readFileSync(pidFile).toString();
    return this;
  }

  /**
   * @returns {Boolean}
   * @private
   */
  _stop() {
    if (this._pid) {
      this._unlock();

      return process.kill(this._pid, 'SIGTERM');
    }

    return false;
  }

  /**
   * @private
   */
  _assureBinary() {
    if (!(FS.existsSync(this._binaryPath) && FS.lstatSync(this._binaryPath).isFile())) {
      throw new MissingElasticsearchBinaryException(this._binaryPath);
    }
  }

  /**
   * @private
   */
  _lock() {
    let pidFile = this._pidFile;

    try {
      lock.lockSync(pidFile);
    } catch (e) {
      if (FS.existsSync(pidFile)) {
        let pid = FS.readFileSync(pidFile).toString();

        if (pid) {
          try {
            process.kill(pid, 0)
          } catch (e) {
            if (e.code === 'ESRCH') { // process not found
              FS.unlinkSync(pidFile);

              this._lock();

              return;
            }
          }
        }
      }

      throw new ServerAlreadyRunningException(this, e);
    }
  }

  /**
   * @private
   */
  _unlock() {
    lock.unlockSync(this._pidFile);
  }

  /**
   * @returns {String}
   */
  get _pidFile() {
    return path.join(path.dirname(this._binaryPath), `_es.${this.hostname}.${this.port}.pid`);
  }
}
