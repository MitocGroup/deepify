#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(mainPath) {
  var path = require('path');
  var Server = require('../../lib.compiled/Server/Instance').Instance;
  var WaitFor = require('deep-package-manager').Helpers_WaitFor;
  var Config = require('deep-package-manager').Property_Config;
  var Property = require('deep-package-manager').Property_Instance;
  var Autoload = require('deep-package-manager').Microservice_Metadata_Autoload;
  var exec = require('child_process').exec;
  var os = require('os');
  var fs = require('fs');
  var open = require('open');

  var port = this.opts.locate('port').value || '8000';
  var buildPath = this.opts.locate('build-path').value || null;
  var dbServer = this.opts.locate('db-server').value || 'LocalDynamo';
  var serverAddress = 'http://localhost:' + port;
  var openBrowser = this.opts.locate('open-browser').exists;
  var skipBuildHook = this.opts.locate('skip-build-hook').exists;
  var skipBackendBuild = this.opts.locate('skip-backend-build').exists;
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

  var server;
  var property = new Property(mainPath);

  if (skipBackendBuild) {
    server = new Server(property);
    server.profiling = profiling;

    startServer();
    return;
  }

  property.assureFrontendEngine(function(error) {
    if (error) {
      console.error('Error while assuring frontend engine: ' + error);
    }

    property.runInitMsHooks(function() {
      server = new Server(property);
      server.profiling = profiling;

      var lambdaPaths = [];

      for (var i = 0; i < server.property.microservices.length; i++) {
        var microservice = server.property.microservices[i];

        for (var j = 0; j < microservice.resources.actions.length; j++) {
          var microserviceRoute = microservice.resources.actions[j];

          if (microserviceRoute.type === 'lambda') {
            lambdaPaths.push(path.join(microservice.autoload.backend, microserviceRoute.source));
          }
        }
      }

      runInstallHook(function() {
        dispatchLambdaPathsChain(chunk(lambdaPaths, 2), startServer);
      }.bind(this));
    }.bind(this));
  }.bind(this));

  function runInstallHook(cb) {
    if (skipBuildHook) {
      cb();
      return;
    }

    var hookPath = path.join(mainPath, 'hook.server.js');

    console.log('Checking for build hook in ' + hookPath);

    if (!fs.existsSync(hookPath)) {
      cb();
      return;
    }

    console.log('Running build hook from ' + hookPath);

    var hook = require(hookPath);

    if (typeof hook === 'function') {
      hook.bind(server)(cb);
    } else {
      cb();
    }
  }

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
