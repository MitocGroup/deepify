/**
 * Created by AlexanderC on 2/19/16.
 */

'use strict';

import os from 'os';
import path from 'path';
import fse from 'fs-extra';
import {Registry_Storage_Driver_Helpers_Api_RegistryAutoDiscovery as RegistryAutoDiscovery} from 'deep-package-manager';

export class Config {
  /**
   * @param {Object|null} config
   */
  constructor(config = null) {
    this._config = config;
  }

  /**
   * @returns {Config}
   */
  static create() {
    return new Config(fse.readJsonSync(Config.CONFIG_FILE));
  }

  /**
   * @returns {String}
   */
  static get CONFIG_FILE() {
    let dir = path.dirname(RegistryAutoDiscovery.DEFAULT_CACHE_FILE);

    return path.join(dir, Config.CONFIG_FILE_NAME);
  }

  /**
   * @returns {String}
   */
  static get CONFIG_FILE_NAME() {
    return 'deepify.config.json';
  }
}
