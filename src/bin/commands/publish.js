#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(microservicePath) {
  // @todo: move it in some json config?
  let DEFAULT_REGISTRY_BASE_HOST = 'https://deep.mg';
  let SAMPLE_PROPERTY_CONFIG = {
    appIdentifier: 'appIdentifier',
    env: 'prod',
    awsAccountId: '0000000000',
    aws: {
      accessKeyId: 'accessKeyId',
      secretAccessKey: 'secretAccessKey',
      region: 'us-east-1',
    },
  };

  let path = require('path');
  let fse = require('fs-extra');
  let tmp = require('tmp');
  let AuthToken = require('../../lib.compiled/Registry/AuthToken').AuthToken;
  let RegistryConfig = require('../../lib.compiled/Registry/Config').Config;
  let Registry = require('deep-package-manager').Registry_Registry;
  let RegistryAuthorizer = require('deep-package-manager').Registry_Storage_Driver_Helpers_Api_Auth_Authorizer;
  let Microservice = require('deep-package-manager').Microservice_Instance;
  let LambdaExtractor = require('../../lib.compiled/Helpers/LambdasExtractor').LambdasExtractor;
  let Property = require('deep-package-manager').Property_Instance;
  let Config = require('deep-package-manager').Property_Config;
  let Lambda = require('deep-package-manager').Property_Lambda;
  let Core = require('deep-core');

  let createRegistry = (cb) => {
    console.log('Initializing remote registry');

    Registry.createApiRegistry(registryBaseHost, (error, registry) => {
      if (error) {
        console.error(error);
        fse.removeSync(tmpPropertyPath);
        this.exit(1);
      }

      registry.storage.driver.authorizer = RegistryAuthorizer.createHeaderToken(getRegistryToken());

      cb(registry);
    }, true);
  };

  let registryBaseHost = this.opts.locate('registry').value ||
    RegistryConfig.create().refresh('registry').read('registry') ||
    DEFAULT_REGISTRY_BASE_HOST;

  microservicePath = this.normalizeInputPath(microservicePath);

  let tmpDirObj = tmp.dirSync();
  let tmpPropertyPath = tmpDirObj.name;
  let tmpMicroservicePath = path.join(tmpPropertyPath, path.basename(microservicePath));

  // Gracefully teardown...
  (() => {
    process.on('uncaughtException', (error) => {
      console.error(error);
      fse.removeSync(tmpPropertyPath);
      this.exit(1);
    });

    process.on('SIGINT', () => {
      console.log('Gracefully shutting down from SIGINT (Ctrl-C)...');
      fse.removeSync(tmpPropertyPath);
      this.exit(1);
    });
  })();

  console.log('Copying microservice sources into ' + tmpMicroservicePath);
  fse.copySync(microservicePath, tmpMicroservicePath);

  let propertyConfigFile = path.join(tmpPropertyPath, Config.DEFAULT_FILENAME);
  console.log('Persisting temporary property config in ' + propertyConfigFile);
  fse.outputJsonSync(propertyConfigFile, SAMPLE_PROPERTY_CONFIG);

  createRegistry.bind(this)((registry) => {
    registry.publishModule(tmpMicroservicePath, (error) => {
      fse.removeSync(tmpPropertyPath);

      if (error) {
        console.error('Error publishing microservice: ' + error);
        this.exit(1);
      }

      console.log('Microservice has been successfully published');
    });
  });

  let getRegistryToken = () => new AuthToken().refresh().toString();

  let property = new Property(tmpPropertyPath);

  console.log('Cleaning up microservice');

  console.log('Remove custom parameters and tests');
  fse.removeSync(path.join(microservicePath, Microservice.PARAMS_FILE));
  fse.removeSync(path.join(microservicePath, 'Tests'));

  (new LambdaExtractor(property))
    .extract(LambdaExtractor.NPM_PACKAGE_FILTER)
    .forEach((lambdaPath) => {
      console.log('Cleaning up backend in ' + lambdaPath);

      fse.removeSync(path.join(lambdaPath, 'node_modules'));
      fse.removeSync(path.join(lambdaPath, Core.AWS.Lambda.Runtime.VALIDATION_SCHEMAS_DIR));
      fse.removeSync(path.join(lambdaPath, Lambda.CONFIG_FILE));
    });
};
