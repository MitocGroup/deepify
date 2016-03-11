'use strict';

export class Listener {

  constructor() {
    this._listeners = {};
    this._listeners[Listener.CONFIG_REQUEST] = [];
    this._listeners[Listener.FILE_REQUEST] = [];
    this._listeners[Listener.LAMBDA_REQUEST] = [];
  }

  /**
   * @params {Function} listener
   */
  registerLambdaRequestListener(listener) {
    this._listeners[Listener.LAMBDA_REQUEST].push(listener);
  }

  registerConfigRequestListener(listener) {
    this._listeners[Listener.CONFIG_REQUEST].push(listener);
  }

  registerFileRequestListener(listener) {
    this._listeners[Listener.FILE_REQUEST].push(listener);
  }

  /**
   * @params {String} eventName
   * @params {ResponseEvent} event
   */
  dispatchEvent(event, eventName = null) {
    if (eventName) {
      let listeners = this._listeners[eventName];

      if (listeners) {
        this._iterateListeners(listeners, event);
      }

    } else {
      for (let listenerType in this._listeners) {
        if (!this._listeners.hasOwnProperty(listenerType)) {
          continue;
        }

        let listeners = this._listeners[listenerType];
        this._iterateListeners(listeners, event);
      }
    }
  }

  /**
   *
   * @param {Array} listeners
   * @param {ResponseEvent} event
   * @private
   */
  _iterateListeners(listeners, event) {
    for (let index in listeners) {
      if (!listeners.hasOwnProperty(index)) {
        continue;
      }

      listeners[index](event);

      if (event.isPropagationStopped) {
        break;
      }
    }
  }

  /**
   *
   * @returns {string}
   */
  static get CONFIG_REQUEST() {
    return 'CONFIG_REQUEST';
  }

  /**
   *
   * @returns {string}
   */
  static get FILE_REQUEST() {
    return 'CONFIG_REQUEST';
  }

  /**
   *
   * @returns {string}
   */
  static get LAMBDA_REQUEST() {
    return 'CONFIG_REQUEST';
  }
}
