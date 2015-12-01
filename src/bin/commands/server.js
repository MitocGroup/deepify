#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(mainPath) {
  var path = require('path');
  var NpmInstall = require('../../lib.compiled/NodeJS/NpmInstall').NpmInstall;
  var NpmInstallLibs = require('../../lib.compiled/NodeJS/NpmInstallLibs').NpmInstallLibs;
  var Bin = require('../../lib.compiled/NodeJS/Bin').Bin;
  var NpmUpdate = require('../../lib.compiled/NodeJS/NpmUpdate').NpmUpdate;
  var NpmLink = require('../../lib.compiled/NodeJS/NpmLink').NpmLink;
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

      var lambdasToInstall = [];
      var lambdasToUpdate = [];

      for (var i = 0; i < server.property.microservices.length; i++) {
        var microservice = server.property.microservices[i];

        for (var j = 0; j < microservice.resources.actions.length; j++) {
          var microserviceRoute = microservice.resources.actions[j];

          if (microserviceRoute.type === 'lambda') {
            let lambdaPath = path.join(microservice.autoload.backend, microserviceRoute.source);

            if (fs.existsSync(path.join(lambdaPath, 'node_modules'))) {
              lambdasToUpdate.push(lambdaPath);
            } else {
              lambdasToInstall.push(lambdaPath);
            }
          }
        }
      }

      runInstallHook(function() {
        let wait = new WaitFor();
        let remaining = 2;

        wait.push(function() {
          return remaining <= 0;
        }.bind(this));

        let npmInstall = new NpmInstall(lambdasToInstall);
        let npmUpdate = new NpmUpdate(lambdasToUpdate);

        console.log('Running "npm install" on ' + lambdasToInstall.length + ' Lambdas');
        console.log('Running "npm update" on ' + lambdasToUpdate.length + ' Lambdas');

        npmInstall.runChunk(function() {
          remaining--;
        }.bind(this), NpmInstall.DEFAULT_CHUNK_SIZE / 2);

        npmUpdate.runChunk(function() {
          remaining--;
        }.bind(this), NpmInstall.DEFAULT_CHUNK_SIZE / 2);

        wait.ready(function() {
          if (Bin.npmModuleInstalled('aws-sdk', true)) {
            console.log('Start linking aws-sdk');

            linkAwsSdk(lambdasToInstall.concat(lambdasToUpdate), startServer);
          } else {
            let awsSdkInstall = new NpmInstallLibs('aws-sdk');
            awsSdkInstall.global = true;

            awsSdkInstall.run(function() {
              console.log('Installing aws-sdk globally');

              linkAwsSdk(lambdasToInstall.concat(lambdasToUpdate), startServer);
            }.bind(this));
          }
        }.bind(this));
      }.bind(this));
    }.bind(this));
  }.bind(this));

  function linkAwsSdk(paths, cb) {
    let npmLink = new NpmLink('aws-sdk', paths);

    npmLink.runChunk(function() {
      cb.bind(this)();
    }.bind(this));
  }

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

  function startServer() {
    if (buildPath) {
      server.buildPath = buildPath;
    }

    server.listen(parseInt(port, 10), dbServer, function(error) {
      if (error) {
        console.error(error);
        this.exit(1);
      }

      if (openBrowser) {
        open(serverAddress);
      }
    }.bind(this));
  }
};
