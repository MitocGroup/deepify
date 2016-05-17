/**
 * Created by CCristi on 5/16/16.
 */

'use strict';

import {BinaryLauncher} from './Launcher/BinaryLauncher';
import path from 'path';

export class ES {
  /**
   * @param {Property_Instance} property
   */
  constructor(property) {
    this._property = property;
    this._runningInstances = {};
  }

  /**
   * @returns {ES}
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
    return this._runningInstances.search || 
      (this._runningInstances.search = ES.startLocalElasticsearchServer('127.0.0.1', 8200));
  }

  /**
   * @returns {AbstractLauncher}
   * @private
   */
  _launchRum() {
    return this._runningInstances.rum ||
      (this._runningInstances.rum = ES.startLocalElasticsearchServer('127.0.0.1', 8201));
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
   */
  static startLocalElasticsearchServer(hostname = '127.0.0.1', port = 9200) {
    let launcher = new BinaryLauncher(ES.DEFAULT_BINARY_PATH);

    launcher.port = port;
    launcher.hostname = hostname;

    launcher
      .setSetting('http.cors.enabled', 'true')
      .setSetting('http.cors.allow-origin', '*')
      .autoRelease()
      .launch();

    return launcher;
  }

  /**
   * @returns {String}
   */
  static get DEFAULT_BINARY_PATH() {
    return path.join(__dirname, '../../resources/elasticsearch/bin/elasticsearch');
  }
}
