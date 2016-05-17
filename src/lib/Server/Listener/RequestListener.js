/**
 * Created by AlexanderC on 3/11/16.
 */

'use strict';

export class RequestListener {
  /**
   * @param {Instance} server
   */
  constructor(server) {
    this._listeners = [];
    this._server = server;
  }

  /**
   * @param {AbstractListener} listener
   * @param {Number} priority
   * @returns {RequestListener}
   */
  register(listener, priority = 0) {
    listener.server = this._server;

    if (!this._listeners[priority]) {
      this._listeners[priority] = [];
    }

    this._listeners[priority].push(listener);

    return this;
  }

  /**
   *
   * @params {ResponseEvent} event
   */
  dispatchEvent(event) {
    for (let priority in this._listeners) {
      if (!this._listeners.hasOwnProperty(priority)) {
        continue;
      }

      let listeners = this._listeners[priority];
      for (let index in listeners) {
        if (!listeners.hasOwnProperty(index)) {
          continue;
        }

        listeners[index].handler(event);

        if (event.isPropagationStopped) {
          return;
        }
      }
    }
  }
}
