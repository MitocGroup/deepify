/**
 * Created by AlexanderC on 2/19/16.
 */

'use strict';

import path from 'path';
import fse from 'fs-extra';
import fs from 'fs';
import {ConfigVars} from './ConfigVars';
import {_extend as extend} from 'util';
import {Registry_Storage_Driver_Helpers_Api_RegistryAutoDiscovery as RegistryAutoDiscovery} from 'deep-package-manager';

export class Config {
  /**
   * @param {Object} config
   */
  constructor(config = {}) {
    this._config = config;
    this._varsMapper = ConfigVars;
  }

  /**
   * @param {String[]|String|*} readFromGlobalsNames
   * @returns {Config}
   */
  refresh(...readFromGlobalsNames) {
    let envConfig = this._config;
    let fileConfig = {};

    readFromGlobalsNames.forEach((name) => {
      let value = this._readVarFromEnvVar(name) ||
        this._readVarFromGlobal(name);

      if (value) {
        envConfig[this._varsMapper.map(name)] = value;
      }
    });

    let configFile = Config.CONFIG_FILE;

    if (fs.existsSync(configFile)) {
      fileConfig = fse.readJsonSync(configFile);
    }

    this._config = extend(this._config, envConfig, fileConfig);

    return this;
  }

  /**
   * @returns {Config}
   */
  persist() {
    fse.outputJsonSync(Config.CONFIG_FILE, this._config);

    return this;
  }

  /**
   * @param {String} name
   * @param {*} value
   * @returns {Config}
   */
  add(name, value) {
    this._config[this._varsMapper.map(name)] = value;

    return this;
  }

  /**
   * @param {String} name
   * @returns {Boolean}
   */
  has(name) {
    return this._config.hasOwnProperty(this._varsMapper.map(name));
  }

  /**
   * @returns {*}
   */
  read(name) {
    return this._config[this._varsMapper.map(name)];
  }

  /**
   * @param {String} name
   * @returns {Config}
   */
  unset(name) {
    delete this._config[this._varsMapper.map(name)];

    return this;
  }

  /**
   * @param {String} name
   * @returns {*}
   * @private
   */
  _readVarFromEnvVar(name) {
    return process.env[this._varsMapper.unMap(name)];
  }

  /**
   * @param {String} name
   * @returns {*}
   * @private
   */
  _readVarFromGlobal(name) {
    return global[this._varsMapper.unMap(name)];
  }

  /**
   * @returns {ConfigVars|Object}
   */
  get varsMapper() {
    return this._varsMapper;
  }

  /**
   * @param {ConfigVars|Object} mapper
   */
  set varsMapper(mapper) {
    this._varsMapper = mapper;
  }

  /**
   * @returns {Object}
   */
  get rawConfig() {
    return this._config;
  }

  /**
   * @returns {Object}
   */
  get config() {
    let conf = {};

    for (let name in this._config) {
      if (!this._config.hasOwnProperty(name)) {
        continue;
      }

      conf[this._varsMapper.unMap(name)] = this._config[name];
    }

    return conf;
  }

  /**
   * @param {Boolean} createIfMissing
   * @returns {Config}
   */
  static create(createIfMissing = true) {
    let configFile = Config.CONFIG_FILE;
    let config = {};

    if (!fs.existsSync(configFile)) {
      if (createIfMissing) {
        fse.outputJsonSync(configFile, config);
      }
    } else {
      config = fse.readJsonSync(configFile);
    }

    return new Config(config);
  }

  /**
   * @returns {String}
   */
  static get CONFIG_FILE() {
    return path.join(RegistryAutoDiscovery.DEFAULT_CONFIG_DIR, Config.CONFIG_FILE_NAME);
  }

  /**
   * @returns {String}
   */
  static get CONFIG_FILE_NAME() {
    return 'deepify.config.json';
  }
}
