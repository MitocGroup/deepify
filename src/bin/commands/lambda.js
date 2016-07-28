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
  let URL = require('url');
  let extend = require('util')._extend;
  let Autoload = require('deep-package-manager').Microservice_Metadata_Autoload;
  let ESServer = require('../../lib.compiled/Elasticsearch/Server').Server;
  let AsyncConfig = require('../../lib.compiled/Helpers/AsyncConfig').AsyncConfig;
  let Frontend = require('deep-package-manager').Property_Frontend;
  let ServerAlreadyRunningException = require(
    '../../lib.compiled/Elasticsearch/Exception/ServerAlreadyRunningException'
  ).ServerAlreadyRunningException;
  let dbServer = this.opts.locate('db-server').value || 'LocalDynamo';
  let event = this.opts.locate('event').value;
  let context = this.opts.locate('context').value;
  let auth = this.opts.locate('auth').exists;
  let skipFrontendBuild = this.opts.locate('skip-frontend-build').exists;
  let plain = this.opts.locate('plain').exists;
  let asyncConfig = null;
  let kernelConfig = null;

  // @todo: implement it in a better way
  if (skipFrontendBuild) {
    Autoload._skipBuild();
  }

  lambdaPath = this.normalizeInputPath(lambdaPath);
  let asyncConfigPath = path.join(lambdaPath, AsyncConfig.FILE_NAME);
  let kernelConfigPath = path.join(lambdaPath, Frontend.CONFIG_FILE);

  try {
    if (fs.statSync(lambdaPath).isDirectory()) {
      lambdaPath = path.join(lambdaPath, 'bootstrap.js');
    }
  } catch (e) {
    console.debug('Failed to resolve lambda bootstrap path: ', e);
  }

  if (!fs.existsSync(lambdaPath)) {
    console.error(`Missing lambda in ${lambdaPath}`);
    this.exit(1);
  }

  try {
    asyncConfig = JSON.parse(fs.readFileSync(asyncConfigPath).toString());
    kernelConfig = JSON.parse(fs.readFileSync(kernelConfigPath).toString());
  } catch (e) {
    console.error(`Missing or broken config files in ${lambdaPath}`);
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

  if (auth) {
    context = extend(context, {
      identity: {
        cognitoIdentityPoolId: 'us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xx0123456789',
        cognitoIdentityId: 'us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        isAnonymous: true,
      },
    });
  }

  let overridenConsoleLog = console.log;

  if (!plain) {
    console.debug('Creating local DynamoDB instance on port ' + DeepDB.LOCAL_DB_PORT);
  }

  DeepDB.startLocalDynamoDBServer((error) => {
    if (error) {
      console.error('Failed to start DynamoDB server: ' + error);
      this.exit(1);
    }

    let lambda = Runtime.createLambda(lambdaPath, context);

    for (let domainName in asyncConfig.searchDomains) {
      if (!asyncConfig.searchDomains.hasOwnProperty(domainName)) {
        continue;
      }

      let domainCfg = asyncConfig.searchDomains[domainName];
      let urlParts = URL.parse(`http://${domainCfg.url}`);
      let dataPath = path.join(os.tmpdir(), `${kernelConfig.buildId}-elasticsearch`);

      try {
        ESServer.startElasticsearchServer(urlParts.hostname, urlParts.port, dataPath);
      } catch (e) {
        if (e instanceof ServerAlreadyRunningException) {
          console.debug(`Elasticsearch service is already running on ${domainCfg.url}`);
        } else {
          throw e;
        }
      }
    }

    if (plain) {
      delete console.log;

      lambda.silent = true;

      lambda.succeed = lambda.fail = (result) => {
        console.log(JSON.stringify(result));
      };

      lambda.complete = () => {

        // assure invokeAsync()s are executed!
        process.kill(process.pid);

        console.log = overridenConsoleLog;
      };
    } else {
      lambda.complete = (error/*, response*/) => {
        console.info('Completed with' + (error ? '' : 'out') + ' errors' + (error ? '!' : '.'));

        if (error) {
          console.error(error);
        }

        // assure invokeAsync()s are executed!
        process.kill(process.pid);
      };

      console.debug('Starting Lambda.', os.EOL);
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
