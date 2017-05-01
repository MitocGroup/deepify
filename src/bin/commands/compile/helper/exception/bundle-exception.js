'use strict';

const BaseException = require('../../../../../lib.compiled/Exception/Exception').Exception;

class BundleException extends BaseException {
  /**
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);
  }
}

module.exports = BundleException;
