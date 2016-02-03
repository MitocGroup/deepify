#!/usr/bin/env node
/**
 * Created by AlexanderC on 6/19/15.
 */

'use strict';

module.exports = function(lambdaPath) {
  var Runtime = require('../../lib.compiled/Lambda/Runtime').Runtime;
  var ForksManager = require('../../lib.compiled/Lambda/ForksManager').ForksManager;
  var DeepDB = require('deep-db');
  var path = require('path');
  var fs = require('fs');
  var os = require('os');
  var Autoload = require('deep-package-manager').Microservice_Metadata_Autoload;
  var NpmInstallLibs = require('../../lib.compiled/NodeJS/NpmInstallLibs').NpmInstallLibs;
  var Bin = require('../../lib.compiled/NodeJS/Bin').Bin;

  var dbServer = this.opts.locate('db-server').value || 'LocalDynamo';
  var event = this.opts.locate('event').value;
  var skipFrontendBuild = this.opts.locate('skip-frontend-build').exists;

  // @todo: implement it in a better way
  if (skipFrontendBuild) {
    Autoload._skipBuild();
  }

  if (lambdaPath.indexOf(path.sep) !== 0) {
    lambdaPath = path.join(process.cwd(), lambdaPath);
  }

  try {
    if (fs.statSync(lambdaPath).isDirectory()) {
      lambdaPath = path.join(lambdaPath, 'bootstrap.js');
    }
  } catch (e) {
  }

  if (!fs.existsSync(lambdaPath)) {
    console.error('Missing lambda in ' + lambdaPath);
    this.exit(1);
  }

  if (event) {
    if (fs.existsSync(path.normalize(event))) {
      event = require(event);
    } else {
      event = JSON.parse(event);
    }
  } else {
    event = {};
  }

  var awsConfigFile = path.join(path.dirname(lambdaPath), '.aws.json');

  if (!fs.existsSync(awsConfigFile)) {
    awsConfigFile = false;
  } else {
    console.log('AWS configuration found in ' + awsConfigFile);
  }

  console.log('Linking aws-sdk library');

  if (!Bin.npmModuleInstalled('aws-sdk', true)) {
    var awsSdkGlobalCmd = new NpmInstallLibs();
    awsSdkGlobalCmd.libs = 'aws-sdk';
    awsSdkGlobalCmd.global = true;

    awsSdkGlobalCmd.run(function(result) {
      if (result.failed) {
        console.error('Failed to install aws-sdk globally: ' + result.error);
        this.exit(1);
      }

      startServer.bind(this)();
    }.bind(this));
  } else {
    startServer.bind(this)();
  }

  function startServer() {
    console.log('Creating local DynamoDB instance on port ' + DeepDB.LOCAL_DB_PORT);

    DeepDB.startLocalDynamoDBServer(function(error) {
      if (error) {
        console.error('Failed to start DynamoDB server: ' + error);
        this.exit(1);
      }

      var lambda = Runtime.createLambda(lambdaPath, awsConfigFile);

      lambda.complete = function(error, response) {
        console.log('Completed with' + (error ? '' : 'out') + ' errors' + (error ? '!' : '.'));

        if (error) {
          console.error(error);
        }

        // assure invokeAsync()s are executed!
        process.kill(process.pid);
      }.bind(this);

      console.log('Starting Lambda.', os.EOL);

      try {
        process.chdir(path.dirname(lambdaPath));

        // avoid process to be killed when some async calls are still active!
        ForksManager.registerListener();

        lambda.run(event, true);
      } catch (e) {
        console.error(e);
        this.exit(1);
      }
    }.bind(this), dbServer);
  }
};
