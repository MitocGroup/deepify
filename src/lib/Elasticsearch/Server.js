/**
 * Created by CCristi on 5/16/16.
 */

'use strict';

import {BinaryLauncher} from './Launcher/BinaryLauncher';
import path from 'path';
import OS from 'os';
import {Property_Instance as Property} from 'deep-package-manager';
import {PropertyObjectRequiredException} from '../Server/Exception/PropertyObjectRequiredException';

export class Server {
  /**
   * @param {Property} property
   */
  constructor(property) {
    if (!property instanceof Property) {
      throw new PropertyObjectRequiredException();
    }

    this._property = property;
    this._runningInstances = {};
    this._dryLaunch = false;
  }

  /**
   * @returns {Server}
   */
  launchInstances() {
    let config = this._property.config;

    if (config.globals.search && config.globals.search.enabled) {
      this._launchSearch();
    }

    if (config.globals.logDrivers && config.globals.logDrivers.rum) {
      this._launchRum();
    }

    return this;
  }

  /**
   * @returns {AbstractLauncher}
   * @private
   */
  _launchSearch() {
    if (this._runningInstances.client) {
      return this._runningInstances.client;
    }

    this._runningInstances.client = Server.startElasticsearchServer(
      '127.0.0.1', Server.SEARCH_CLIENT_PORT, 
      this._dataPath, this._dryLaunch
    );

    return this._runningInstances.client;
  }

  /**
   * @returns {AbstractLauncher}
   * @private
   */
  _launchRum() {
    if (this._runningInstances.rum) {
      return this._runningInstances.rum;
    }

    this._runningInstances.rum = Server.startElasticsearchServer(
      '127.0.0.1', Server.RUM_CLIENT_PORT, 
      this._dataPath, this._dryLaunch
    );

    return this._runningInstances.rum;
  }

  /**
   * @returns {AbstractLauncher[]}
   */
  get runningInstances() {
    return this._runningInstances;
  }

  /**
   * @param {String} hostname
   * @param {Number} port
   * @param {String} dataPath
   * @param {Boolean} dry
   * @returns {BinaryLauncher}
   */
  static startElasticsearchServer(hostname = '127.0.0.1', port = 9200, dataPath = null, dry = false) {
    let launcher = new BinaryLauncher(Server.DEFAULT_BINARY_PATH);

    launcher.port = port;
    launcher.hostname = hostname;

    if (dataPath) {
      launcher.setSetting('path.data', dataPath);
    }

    launcher
      .setSetting('http.cors.enabled', 'true')
      .setSetting('http.cors.allow-origin', '*')
      .setSetting('http.cors.allow-headers', 'X-Requested-With,X-Auth-Token,Content-Type,Content-Length,Authorization');

    if (!dry) {
      launcher
        .autoRelease()
        .launch();
    }

    return launcher;
  }

  /**
   * @param {Boolean} bool
   * @returns {Server}
   */
  dry(bool = true) {
    this._dryLaunch = bool;

    return this;
  }

  /**
   * @returns {String}
   * @private
   */
  get _dataPath() {
    let baseHash = this._property.configObj.baseHash;

    return path.join(OS.tmpdir(), `${baseHash}-elasticsearch`);
  }

  /**
   * @returns {String}
   *
   * @todo find a way to abstract this
   */
  static get DEFAULT_BINARY_PATH() {
    return path.join(__dirname, '..', '..', 'resources', 'elasticsearch-2.3.5', 'bin', 'elasticsearch');
  }

  /**
   * @returns {Number}
   */
  static get SEARCH_CLIENT_PORT() {
    return 8200
  }

  /**
   * @returns {Number}
   */
  static get RUM_CLIENT_PORT() {
    return 8201;
  }
}
