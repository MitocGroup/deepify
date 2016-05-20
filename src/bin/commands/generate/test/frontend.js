/**
 * Created by CCristi on 5/20/16.
 */

'use strict';

module.exports = function(mainPath) {
  let Microservice = require('deep-package-manager').Microservice_Instance;
  let FSExtra = require('fs-extra');
  let path = require('path');

  mainPath = this.normalizeInputPath(mainPath);
  let microservice = Microservice.create(mainPath);
  let frontendTestFolder = path.join(microservice.basePath, 'Test', 'Frontend');

  FSExtra.ensureDirSync(frontendTestFolder);
  console.log(`Frontend test folder has been generated in ${frontendTestFolder}`);
};
