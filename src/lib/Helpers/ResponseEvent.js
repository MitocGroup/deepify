'use strict';

import OS from 'os';

export class ResponseEvent {

  /**
   *
   * @param {Http.IncomingMessage} request
   * @param {Http.ServerResponse} response
   */
  constructor(request, response) {
    this._propagationStopped = false;
    this._request = request;
    this._response = response;
  }

  /**
   *
   * @returns {Http.ServerResponse}
   */
  get response() {
    return this._response;
  }

  /**
   *
   * @returns {Http.IncomingMessage}
   */
  get request() {
    return this._request;
  }

  /**
   *
   * @param {Http.ServerResponse} response
   */
  set response(response) {
    this._response = response;
  }

  /**
   * Stop event propagation
   * 
   * @returns {ResponseEvent}
   */
  stopPropagation() {
    this._propagationStopped = true;

    return this;
  }

  /**
   *
   * @returns {Boolean}
   */
  get isPropagationStopped() {
    return this._propagationStopped;
  }

  /**
   * @param {Error|String} error
   */
  send500(error) {
    this.send(`${error}${OS.EOL}`, 500);
  }

  /**
   * @param {String} message
   */
  send404(message = null) {
    this.send(message || `404 Not Found${OS.EOL}`, 404);
  }

  /**
   * @param {String} content
   * @param {Number} code
   * @param {String} contentType
   * @param {Boolean} isBinary
   */
  send(content, code = 200, contentType = 'text/plain', isBinary = false) {
    this.response.writeHead(code, {'Content-Type': contentType});

    if (isBinary) {
      this.response.write(content, 'binary');
    } else {
      this.response.write(content);
    }

    this.response.end();
    this.stopPropagation();
  }
}
