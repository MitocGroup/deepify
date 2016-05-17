/**
 * Created by CCristi on 5/16/16.
 */

'use strict';

import {AbstractLauncher} from './AbstractLauncher';
import {Exec} from '../../Helpers/Exec';
import {MissingElasticsearchBinaryException} from '../Exception/MissingElasticsearchBinaryException';
import {FailedToLauchElasticsearchException} from '../Exception/FailedToLauchElasticsearchException';
import path from 'path';
import FS from 'fs';
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
  _launch(cb = () => {}) {
    this._assureBinary();

    let pidFile = this.pidFile;
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

    launchCmd.run(() => {
      if (launchCmd.failed) {
        throw new FailedToLauchElasticsearchException(this, launchCmd.error);
      }

      this._pid = FS.readFileSync(pidFile).toString();

      cb();
    });

    return this;
  }

  /**
   * @returns {Boolean}
   * @private
   */
  _stop() {
    if (this._pid) {
      FS.existsSync(this.pidFile) && FS.unlinkSync(this.pidFile);

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
   * @returns {String}
   */
  get pidFile() {
    return path.join(__dirname, '../../../resources/elasticsearch', `_es.${this.hostname}.${this.port}.pid`);
  }
}
