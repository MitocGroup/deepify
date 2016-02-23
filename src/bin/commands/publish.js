#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(microservicePath) {

  // @todo: move it in some json config?
  var DEFAULT_REGISTRY_BASE_HOST = 'https://deep.mg';
  var SAMPLE_PROPERTY_CONFIG = {
    appIdentifier: 'appIdentifier',
    env: 'prod',
    awsAccountId: '0000000000',
    aws: {
      accessKeyId: 'accessKeyId',
      secretAccessKey: 'secretAccessKey',
      region: 'us-east-1',
    },
  };

  var path = require('path');
  var fs = require('fs');
  var fse = require('fs-extra');
  var tmp = require('tmp');
  var AuthToken = require('../../lib.compiled/Registry/AuthToken').AuthToken;
  var RegistryConfig = require('../../lib.compiled/Registry/Config').Config;
  var Registry = require('deep-package-manager').Registry_Registry;
  var RegistryAuthorizer = require('deep-package-manager').Registry_Storage_Driver_Helpers_Api_Auth_Authorizer;
  var Microservice = require('deep-package-manager').Microservice_Instance;
  var LambdaExtractor = require('../../lib.compiled/Helpers/LambdasExtractor').LambdasExtractor;
  var Property = require('deep-package-manager').Property_Instance;
  var Config = require('deep-package-manager').Property_Config;
  var Lambda = require('deep-package-manager').Property_Lambda;
  var Core = require('deep-core');

  var registryBaseHost = this.opts.locate('registry').value ||
    RegistryConfig.create().refresh('registry').read('registry') ||
    DEFAULT_REGISTRY_BASE_HOST;

  if (microservicePath.indexOf(path.sep) !== 0) {
    microservicePath = path.join(process.cwd(), microservicePath);
  }

  var tmpDirObj = tmp.dirSync();
  var tmpPropertyPath = tmpDirObj.name;
  var tmpMicroservicePath = path.join(tmpPropertyPath, path.basename(microservicePath));

  // Gracefully teardown...
  (function() {
    process.on('uncaughtException', function(error) {
      console.error(error);
      fse.removeSync(tmpPropertyPath);
      this.exit(1);
    }.bind(this));

    process.on('SIGINT', function() {
      console.log('Gracefully shutting down from SIGINT (Ctrl-C)...');
      fse.removeSync(tmpPropertyPath);
      this.exit(1);
    }.bind(this));
  }.bind(this))();

  console.log('Copying microservice sources into ' + tmpMicroservicePath);
  fse.copySync(microservicePath, tmpMicroservicePath);

  var propertyConfigFile = path.join(tmpPropertyPath, Config.DEFAULT_FILENAME);
  console.log('Persisting temporary property config in ' + propertyConfigFile);
  fse.outputJsonSync(propertyConfigFile, SAMPLE_PROPERTY_CONFIG);

  createRegistry.bind(this)(function(registry) {
    registry.publishModule(tmpMicroservicePath, function(error) {
      fse.removeSync(tmpPropertyPath);

      if (error) {
        console.error('Error publishing microservice: ' + error);
        this.exit(1);
      }

      console.log('Microservice has been successfully published');
    }.bind(this));
  }.bind(this));

  function getRegistryToken() {
    return (new AuthToken()).refresh().toString();
  }

  var property = new Property(tmpPropertyPath);

  console.log('Cleaning up microservice');

  console.log('Remove custom parameters and tests');
  fse.removeSync(path.join(microservicePath, Microservice.PARAMS_FILE));
  fse.removeSync(path.join(microservicePath, 'Tests'));

  (new LambdaExtractor(property))
    .extractWorking(LambdaExtractor.NPM_PACKAGE_FILTER)
    .forEach(function(lambdaPath) {
      console.log('Cleaning up backend in ' + lambdaPath);

      fse.removeSync(path.join(lambdaPath, '.DS_Store')); //@todo: do we need this case covered?
      fse.removeSync(path.join(lambdaPath, 'node_modules'));
      fse.removeSync(path.join(lambdaPath, Core.AWS.Lambda.Runtime.VALIDATION_SCHEMAS_DIR));
      fse.removeSync(path.join(lambdaPath, Lambda.CONFIG_FILE));
    }.bind(this));

  function createRegistry(cb) {
    console.log('Initializing remote registry');

    Registry.createApiRegistry(registryBaseHost, function(error, registry) {
      if (error) {
        console.error(error);
        fse.removeSync(tmpPropertyPath);
        this.exit(1);
      }

      registry.storage.driver.authorizer = RegistryAuthorizer.createHeaderToken(getRegistryToken());

      cb(registry);
    }.bind(this), true);
  }
};
