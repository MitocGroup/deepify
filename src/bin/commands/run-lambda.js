#!/usr/bin/env node
/**
 * Created by AlexanderC on 6/19/15.
 */

'use strict';

module.exports = function(lambdaPath) {
  let Runtime = require('../../lib.compiled/Lambda/Runtime').Runtime;
  let ForksManager = require('../../lib.compiled/Lambda/ForksManager').ForksManager;
  let DeepDB = require('deep-db');
  let path = require('path');
  let fs = require('fs');
  let os = require('os');
  let Autoload = require('deep-package-manager').Microservice_Metadata_Autoload;

  let dbServer = this.opts.locate('db-server').value || 'LocalDynamo';
  let event = this.opts.locate('event').value;
  let context = this.opts.locate('context').value;
  let skipFrontendBuild = this.opts.locate('skip-frontend-build').exists;
  let plain = this.opts.locate('plain').exists;

  // @todo: implement it in a better way
  if (skipFrontendBuild) {
    Autoload._skipBuild();
  }

  lambdaPath = this.normalizeInputPath(lambdaPath);

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

  let parseParamData = (rawParam) => {
    if (rawParam) {
      if (fs.existsSync(path.normalize(rawParam))) {
        rawParam = require(rawParam);
      } else {
        rawParam = JSON.parse(rawParam);
      }
    } else {
      rawParam = {};
    }

    return rawParam;
  };

  event = parseParamData(event);
  context = parseParamData(context);

  let awsConfigFile = path.join(path.dirname(lambdaPath), '.aws.json');

  if (!fs.existsSync(awsConfigFile)) {
    awsConfigFile = false;
  } else {
    console.log('AWS configuration found in ' + awsConfigFile);
  }

  let startServer = () => {

    if(!plain) {
      console.log('Creating local DynamoDB instance on port ' + DeepDB.LOCAL_DB_PORT);
    }

    DeepDB.startLocalDynamoDBServer((error) => {
      if (error) {
        console.error('Failed to start DynamoDB server: ' + error);
        this.exit(1);
      }

      let lambda = Runtime.createLambda(lambdaPath, awsConfigFile, context);

      if(plain) {
        lambda.silent = true;

        lambda.succeed = (result) => {
          console.log(result);
        };

        lambda.fail = (result) => {
          console.log(result);
        };

        lambda.complete = (error) => {

          // assure invokeAsync()s are executed!
          process.kill(process.pid);
        };
      } else {
        lambda.complete = (error/*, response*/) => {
          console.log('Completed with' + (error ? '' : 'out') + ' errors' + (error ? '!' : '.'));

          if (error) {
            console.error(error);
          }

          // assure invokeAsync()s are executed!
          process.kill(process.pid);
        };

        console.log('Starting Lambda.', os.EOL);
      }

      try {
        process.chdir(path.dirname(lambdaPath));

        // avoid process to be killed when some async calls are still active!
        ForksManager.registerListener();

        lambda.run(event, true);
      } catch (e) {
        console.error(e);
        this.exit(1);
      }
    }, dbServer);
  };

  startServer();
};
