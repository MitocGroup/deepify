/**
 * Created by AlexanderC on 11/13/15.
 */

'use strict';

export class Timer {
  /**
   * @param {String} name
   */
  constructor(name) {
    this._name = name;

    this._startTime = null;
    this._stopTime = null;
  }

  /**
   * @returns {String}
   */
  get name() {
    return this._name;
  }

  /**
   * @returns {Number}
   */
  get startTime() {
    return this._startTime;
  }

  /**
   * @returns {Number}
   */
  get stopTime() {
    return this._stopTime;
  }

  /**
   * @returns {Number}
   */
  get startTimeSec() {
    if (!this._startTime) {
      return null;
    }

    return parseFloat((this._startTime / 1000).toFixed(2));
  }

  /**
   * @returns {Number}
   */
  get stopTimeSec() {
    if (!this._stopTime) {
      return null;
    }

    return parseFloat((this._stopTime / 1000).toFixed(2));
  }

  /**
   * @returns {Number}
   */
  get time() {
    if(!this.startTime) {
      this._startTime = this.stopTime || new Date().getTime();
      this.stop();
    }

    return this.stopTime - this.startTime;
  }

  /**
   * @returns {Number}
   */
  get timeSec() {
    return parseFloat((this.time / 1000).toFixed(2));
  }

  /**
   * @returns {Timer}
   */
  start() {
    this._startTime = new Date().getTime();

    return this;
  }

  /**
   * @returns {Timer}
   */
  stop() {
    this._stopTime = new Date().getTime();

    return this;
  }

  /**
   * @param sec
   * @returns {*}
   */
  toString(sec = true) {
    return `Timing for ${this._name}: ${sec ? this.timeSec : this.time} ${sec ? 'seconds' : 'miliseconds'}`;
  }
}
