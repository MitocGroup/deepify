'use strict';

export class ResponseEvent {

  /**
   *
   * @param {String} request
   * @param {*} responseContent
   */
  constructor(request, responseContent) {
    this._propagationStopped = false;
    this._request = request;
    this._responseContent = responseContent;
  }

  /**
   *
   * @returns {*}
   */
  get responseContent() {
    return this._responseContent;
  }

  /**
   *
   * @returns {String}
   */
  get request() {
    return this._request;
  }

  /**
   *
   * @param {*} content
   */
  set responseContent(content) {
    this._responseContent = content;
  }

  stopPropagation() {
    this._propagationStopped = true;
  }

  /**
   *
   * @returns {boolean}
   */
  get isPropagationStopped() {
    return this._propagationStopped;
  }
}
