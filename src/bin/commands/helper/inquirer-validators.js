/**
 * Created by CCristi on 5/5/16.
 */

'use strict';

module.exports = {
  alphanumericalNotEmpty: (value) => {
    if (!/^[a-zA-Z0-9_\-]{2,}$/.test(value)) {
      return 'String should contain only [a-zA-Z0-9_-]';
    }

    return true;
  }
};
