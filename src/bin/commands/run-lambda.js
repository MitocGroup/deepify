#!/usr/bin/env node
/**
 * Created by AlexanderC on 6/19/15.
 */

'use strict';

module.exports = function(lambdaPath) {
  var Runtime = require('../../lib.compiled/Lambda/Runtime').Runtime;
  var DeepDB = require('deep-db');
  var path = require('path');
  var fs = require('fs');
  var exec = require('sync-exec');
  var os = require('os');
  var Autoload = require('deep-package-manager').Microservice_Metadata_Autoload;

  var dbServer = this.opts.locate('db-server').value || 'LocalDynamo';
  var event = this.opts.locate('event').value;
  var skipFrontendBuild = this.opts.locate('skip-frontend-build').exists;

  // @todo: implement it in a better way
  if (skipFrontendBuild) {
    Autoload._skipBuild();
  }

  if (lambdaPath.indexOf('/') !== 0) {
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

  var mainPath = path.dirname(lambdaPath);

  console.log('Linking aws-sdk library');

  var awsSdkResult = exec('cd ' + mainPath + ' && npm link aws-sdk');

  if (awsSdkResult.status !== 0) {
    console.error('Failed to link aws-sdk library. Trying to install it...');

    awsSdkResult = exec('cd ' + mainPath + ' && npm install aws-sdk &>/dev/null');

    if (awsSdkResult.status !== 0) {
      console.error('Failed to link or install aws-sdk locally. Skipping...');
    }
  }

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
        this.exit(1);
      }

      this.exit(0);
    }.bind(this);

    console.log('Starting Lambda.', os.EOL);

    try {
      process.chdir(path.dirname(lambdaPath));
      lambda.run(event, true);
    } catch (e) {
      console.error(e);
      this.exit(1);
    }
  }.bind(this), dbServer);
};
