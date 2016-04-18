#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(microservicePath) {
  let path = require('path');
  let fs = require('fs');
  let fse = require('fs-extra');
  let Microservice = require('deep-package-manager').Microservice_Instance;

  microservicePath = this.normalizeInputPath(microservicePath);

  let ms = Microservice.create(microservicePath);
  let migrationsPath = ms.autoload.migration;

  let migrationTpl = fs.readFileSync(path.join(__dirname, 'assets', 'migration_tpl.txt')).toString();
  let migrationFile = path.join(migrationsPath, 'Version' + (new Date()).getTime() + '.js');

  console.log('Creating migration in ' + migrationFile);

  fse.outputFileSync(
    migrationFile,
    migrationTpl
      .replace('{version}', this.version)
      .replace('{date}', new Date().toLocaleString())
  );
};
