#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(mainPath) {
  var path = require('path');
  var LambdaExtractor = require('../../lib.compiled/Helpers/LambdasExtractor').LambdasExtractor;
  var NpmInstall = require('../../lib.compiled/NodeJS/NpmInstall').NpmInstall;
  var NpmInstallLibs = require('../../lib.compiled/NodeJS/NpmInstallLibs').NpmInstallLibs;
  var Bin = require('../../lib.compiled/NodeJS/Bin').Bin;
  var NpmLink = require('../../lib.compiled/NodeJS/NpmLink').NpmLink;
  var Server = require('../../lib.compiled/Server/Instance').Instance;
  var WaitFor = require('deep-package-manager').Helpers_WaitFor;
  var Config = require('deep-package-manager').Property_Config;
  var Property = require('deep-package-manager').Property_Instance;
  var Autoload = require('deep-package-manager').Microservice_Metadata_Autoload;
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
  var skipFrontendBuild = this.opts.locate('skip-frontend-build').exists;

  // @todo: implement it in a better way
  if (skipFrontendBuild) {
    Autoload._skipBuild();
  }

  if (mainPath.indexOf(path.sep) !== 0) {
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

    startServer();
    return;
  }

  property.assureFrontendEngine(function(error) {
    if (error) {
      console.error('Error while assuring frontend engine: ' + error);
    }

    property.runInitMsHooks(function() {
      server = new Server(property);

      var lambdasToInstall = LambdaExtractor
        .createFromServer(server)
        .extract();

      console.log('Running "npm install" on ' + lambdasToInstall.length + ' Lambdas');

      var npmInstall = new NpmInstall(lambdasToInstall);

      npmInstall.runChunk(function() {
        if (Bin.npmModuleInstalled('aws-sdk', true)) {
          console.log('Start linking aws-sdk');

          linkAwsSdk.bind(this)(lambdasToInstall, startServer);
        } else {
          var awsSdkInstall = new NpmInstallLibs();
          awsSdkInstall.libs = 'aws-sdk';
          awsSdkInstall.global = true;

          awsSdkInstall.run(function() {
            console.log('Installing aws-sdk globally');

            linkAwsSdk.bind(this)(lambdasToInstall, startServer);
          }.bind(this));
        }
      }.bind(this), NpmInstall.DEFAULT_CHUNK_SIZE);
    }.bind(this));
  }.bind(this));

  function linkAwsSdk(paths, cb) {
    var npmLink = new NpmLink(paths);
    npmLink.libs = 'aws-sdk';

    npmLink.runChunk(function() {
      cb.bind(this)();
    }.bind(this));
  }

  function startServer() {
    if (buildPath) {
      server.buildPath = buildPath;
    }

    server.listen(parseInt(port, 10), dbServer, function() {
      if (openBrowser) {
        open(serverAddress);
      }
    }.bind(this));
  }
};
