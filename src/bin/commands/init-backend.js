#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(mainPath) {
  var path = require('path');
  var Autoload = require('deep-package-manager').Microservice_Metadata_Autoload;
  var Property = require('deep-package-manager').Property_Instance;
  var WaitFor = require('deep-package-manager').Helpers_WaitFor;
  var Config = require('deep-package-manager').Property_Config;
  var fs = require('fs');
  var exec = require('child_process').exec;

  if (mainPath.indexOf('/') !== 0) {
    mainPath = path.join(process.cwd(), mainPath);
  }

  var propertyConfigFile = path.join(mainPath, Config.DEFAULT_FILENAME);

  if (!fs.existsSync(propertyConfigFile)) {
    fs.writeFileSync(propertyConfigFile, JSON.stringify(Config.generate()));
  }

  var property = new Property(mainPath);

  property.assureFrontendEngine(function(error) {
    if (error) {
      console.error('Error while assuring frontend engine: ' + error);
    }

    property.runInitMsHooks(function() {
      var lambdaPaths = [];

      for (var i = 0; i < property.microservices.length; i++) {
        var microservice = property.microservices[i];

        for (var j = 0; j < microservice.resources.actions.length; j++) {
          var microserviceRoute = microservice.resources.actions[j];

          if (microserviceRoute.type === 'lambda') {
            lambdaPaths.push(path.join(microservice.autoload.backend, microserviceRoute.source));
          }
        }
      }

      dispatchLambdaPathsChain(chunk(lambdaPaths, 2), function() {
        var lambdasConfig = property.fakeBuild();

        for (var lambdaArn in lambdasConfig) {
          if (!lambdasConfig.hasOwnProperty(lambdaArn)) {
            continue;
          }

          var lambdaConfig = lambdasConfig[lambdaArn];
          var lambdaPath = path.dirname(lambdaConfig.path);
          var lambdaConfigPath = path.join(lambdaPath, '_config.json');

          if (fs.existsSync(lambdaConfigPath)) {
            console.log('An old Lambda(' + lambdaArn + ') config found in ' + lambdaPath + '. Removing...');
            fs.unlinkSync(lambdaConfigPath);
          }

          console.log('Persisting Lambda(' + lambdaArn + ') config into ' + lambdaConfigPath);
          fs.writeFileSync(lambdaConfigPath, JSON.stringify(lambdaConfig));
        }

        console.log('The backend had been successfully initialized.');
      }.bind(this));
    }.bind(this));
  }.bind(this));

  function npmInstall(lambdaPath, cb) {
    console.log('Checking for NPM package in ' + lambdaPath);

    var packageFile = path.join(lambdaPath, 'package.json');

    if (fs.existsSync(packageFile)) {
      var nodeModulesPath = path.join(lambdaPath, 'node_modules');
      var cmd = fs.existsSync(nodeModulesPath) ? 'update' : 'install';

      console.log('Running "npm ' + cmd + '" in ' + lambdaPath);

      exec('cd ' + lambdaPath + ' && npm ' + cmd + ' &>/dev/null', function(error) {
        if (error) {
          console.error(error);
          console.error('Failed to run "npm ' + cmd + '" in ' + lambdaPath + '. Skipping...');
        }

        cb();
      }.bind(this));
    } else {
      console.log('No NPM package found in ' + lambdaPath + '. Skipping...');
    }
  }

  function linkAwsSdk(lambdaPath, cb) {
    console.log('Linking aws-sdk library in ' + lambdaPath);

    exec('cd ' + lambdaPath + ' && npm link aws-sdk', function(error, stdout, stderr) {
      if (error) {
        console.error(error);
        console.error('Failed to link aws-sdk library in ' + lambdaPath + ' (' + stderr + '). Trying to install it...');

        exec('cd ' + lambdaPath + ' && npm install aws-sdk &>/dev/null', function(error) {
          if (error) {
            console.error(error);
            console.error('Failed to link or install aws-sdk locally in ' + lambdaPath + '. Skipping...');
          }

          cb();
        }.bind(this));

        return;
      }

      cb();
    }.bind(this));
  }

  function prepareBatch(lambdaPaths, cb) {
    var remaining = lambdaPaths.length;

    var wait = new WaitFor();

    for (var i = 0; i < lambdaPaths.length; i++) {
      var lambdaPath = lambdaPaths[i];

      npmInstall(lambdaPath, function(lambdaPath) {
        linkAwsSdk(lambdaPath, function() {
          remaining--;
        }.bind(this));
      }.bind(this, lambdaPath));
    }

    wait.push(function() {
      return remaining <= 0;
    }.bind(this));

    wait.ready(function() {
      cb();
    }.bind(this));
  }

  function chunk(arr, len) {
    var chunks = [];
    var i = 0;
    var n = arr.length;

    while (i < n) {
      chunks.push(arr.slice(i, i += len));
    }

    return chunks;
  }

  function dispatchLambdaPathsChain(lambdaPathsChunks, cb) {
    if (lambdaPathsChunks.length <= 0) {
      cb();
      return;
    }

    var batch = lambdaPathsChunks.pop();

    console.log('Running next lambdas build batch: ' + batch.join(', '));

    prepareBatch(batch, function() {
      dispatchLambdaPathsChain(lambdaPathsChunks, cb);
    }.bind(this));
  }
};
