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
  let backendTestFolder = path.join(microservice.basePath, 'Test', 'Backend');

  FSExtra.ensureDirSync(backendTestFolder);
<<<<<<< HEAD
  console.log(`Backend test folder has been generated in ${backendTestFolder}`);
=======
  console.info(`Backend test folder has been generated in ${backendTestFolder}`);
>>>>>>> dev
};
