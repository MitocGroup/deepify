/**
 * Created by CCristi on 6/1/16.
 */

'use strict';

module.exports = class JsonFormatter {
  /**
   * @param {Object} result
   * @returns {Promise}
   */
  format(result) {
    return Promise.resolve(JSON.stringify(result, null, '  '));
  }
};
