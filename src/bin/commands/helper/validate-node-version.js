/**
 * Created by CCristi on 5/12/16.
 */

'use strict';

module.exports = function() {
  if (!/^v[6]/.test(process.version)) {
    console.warn(`Deepify '${this.name}' is available only with node v6.x due to AWS Lambda Runtime limitations`);
    this.exit(1);
  }
};
