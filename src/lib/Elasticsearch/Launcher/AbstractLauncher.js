/**
 * Created by CCristi on 5/16/16.
 */

'use strict';

import Core from 'deep-core';
import process from 'process';
import OS from 'os';

export class AbstractLauncher extends Core.OOP.Interface {
  constructor() {
    super(['_launch', '_stop']);

    this._hostname = '127.0.0.1';
    this._port = 9200;
    this._settings = {};
  }

  /**
   * @todo: add more?
   *
   * @returns {AbstractLauncher}
   */
  autoRelease() {
    process.on('SIGINT', () => {
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      console.error(error.toString(), OS.EOL, error.stack);

      process.exit(0);
    });

    process.on('exit', this.stop.bind(this));

    return this;
  }

  /**
   * @param {Object[]} args
   * @returns {Number}
   */
  launch(...args) { 
    console.log(`Running elasticsearch on: ${this.url}`);

    return this._launch(...args);
  }

  /**
   * @link: https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-http.html
   *
   * @param {String} setting
   * @param {String} value
   * @return {AbstractLauncher}
   */
  setSetting(setting, value) {
    this._settings[setting] = value;
    
    return this;
  }

  /**
   * @param {String} setting
   */
  getSetting(setting) {
    return this._settings[setting];
  }

  /**
   * @param {Object[]} args
   * @returns {*}
   */
  stop(...args) {
    console.log(`Stopping elasticsearch on: ${this.url}`);

    this._stop(...args);
  }

  /**
   * @returns {String}
   */
  get url() {
    return `http://${this.hostname}:${this.port}`;
  }

  /**
   * @returns {Object}
   */
  get settings() {
    return this._settings;
  }

  /**
   * @param {Number} port
   */
  set port(port) {
    this._port = port;
  }

  /**
   * @returns {Number}
   */
  get port() {
    return this._port;
  }

  /**
   * @param {String} hostname
   */
  set hostname(hostname) {
    this._hostname = hostname;
  }

  /**
   * @returns {String}
   */
  get hostname() {
    return this._hostname;
  }
}
