#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(mainPath) {
  var path = require('path');
  var Server = require('../../lib.compiled/Server/Instance').Instance;
  var WaitFor = require('../../lib.compiled/Helpers/WaitFor').WaitFor;
  var Config = require('../../lib.compiled/Property/Config').Config;
  var Autoload = require('../../lib.compiled/Microservice/Metadata/Autoload').Autoload;
  var exec = require('child_process').exec;
  var os = require('os');
  var fs = require('fs');
  var open = require("open");

  var port = this.opts.locate('port').value || '8000';
  var buildPath = this.opts.locate('build-path').value || null;
  var dbServer = this.opts.locate('db-server').value || 'LocalDynamo'; // @todo: think on switching to Dynalite by default
  var serverAddress = 'http://localhost:' + port;
  var openBrowser = this.opts.locate('open-browser').exists;
  var skipLambdasBuild = this.opts.locate('skip-lambdas-build').exists;
  var profiling = this.opts.locate('profiling').exists;
  var skipFrontendBuild = this.opts.locate('skip-frontend-build').exists;

  // @todo: implement it in a better way
  if (skipFrontendBuild) {
    Autoload._skipBuild();
  }

  if (mainPath.indexOf('/') !== 0) {
    mainPath = path.join(process.cwd(), mainPath);
  }

  if (buildPath && buildPath.indexOf('/') !== 0) {
    buildPath = path.join(process.cwd(), buildPath);
  }

  var propertyConfigFile = path.join(mainPath, Config.DEFAULT_FILENAME);

  if (!fs.existsSync(propertyConfigFile)) {
    fs.writeFileSync(propertyConfigFile, JSON.stringify(Config.generate()));
  }

  var server = Server.create(mainPath);
  server.profiling = profiling;

  function npmInstall(lambdaPath, cb) {
    console.log('Checking for NPM package in ' + lambdaPath);

    var packageFile = path.join(lambdaPath, 'package.json');

    if (fs.existsSync(packageFile)) {
      var nodeModulesPath = path.join(lambdaPath, 'node_modules');
      var cmd = fs.existsSync(nodeModulesPath) ? 'update' : 'install';

      console.log('Running "npm ' + cmd + '" in ' + lambdaPath);

      exec('cd ' + lambdaPath + ' && npm ' + cmd, function(error, stdout, stderr) {
        if (error) {
          console.error('Failed to run "npm ' + cmd + '" in ' + lambdaPath
            + ' (' + stderr + '). Skipping...');
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
        console.error('Failed to link aws-sdk library in ' + lambdaPath + ' (' + stderr + '). Trying to install it...');

        exec('cd ' + lambdaPath + ' && npm install aws-sdk', function(error, stdout, stderr) {
          if (error) {
            console.error('Failed to link or install aws-sdk locally in ' + lambdaPath
              + ' (' + stderr + '). Skipping...');
          }

          cb();
        }.bind(this));

        return;
      }

      cb();
    }.bind(this));
  }

  function startServer() {
    if (buildPath) {
      server.buildPath = buildPath;
    }

    server.listen(parseInt(port, 10), dbServer, function(error) {
      if (openBrowser) {
        open(serverAddress);
      }
    });
  }

  if (skipLambdasBuild) {
    startServer();
    return;
  }

  var awsLinkingLambdas = 0;

  for (var i = 0; i < server.property.microservices.length; i++) {
    var microservice = server.property.microservices[i];

    for (var j = 0; j < microservice.resources.actions.length; j++) {
      var microserviceRoute = microservice.resources.actions[j];

      if (microserviceRoute.type === 'lambda') {
        var lambdaPath = path.join(microservice.autoload.backend, microserviceRoute.source);

        awsLinkingLambdas++;

        npmInstall(lambdaPath, function(lambdaPath) {
          linkAwsSdk(lambdaPath, function() {
            awsLinkingLambdas--;
          }.bind(this));
        }.bind(this, lambdaPath));
      }
    }
  }

  var wait = new WaitFor();

  wait.push(function() {
    return awsLinkingLambdas <= 0;
  }.bind(this));

  wait.ready(function() {
    startServer();
  }.bind(this));
};
