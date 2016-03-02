#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(microservicePath) {
  var path = require('path');
  var fs = require('fs');
  var fse = require('fs-extra');
  var Microservice = require('deep-package-manager').Microservice_Instance;

  if ((!/^win/.test(process.platform) && microservicePath.indexOf(path.sep) !== 0) ||
      (/^win/.test(process.platform) && !(/^[a-z]{1}:/i.test(microservicePath)))) {
    microservicePath = path.join(process.cwd(), microservicePath);
  }

  var ms = Microservice.create(microservicePath);
  var migrationsPath = ms.autoload.migration;

  var migrationTpl = fs.readFileSync(path.join(__dirname, 'assets', 'migration_tpl.txt')).toString();
  var migrationFile = path.join(migrationsPath, 'Version' + (new Date()).getTime() + '.js');

  console.log('Creating migration in ' + migrationFile);

  fse.outputFileSync(
    migrationFile,
    migrationTpl
      .replace('{version}', this.version)
      .replace('{date}', new Date().toLocaleString())
  );
};
