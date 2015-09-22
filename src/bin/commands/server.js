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
  var exec = require('child_process').exec;
  var os = require('os');
  var fs = require('fs');
  var open = require("open");

  var port = this.opts.locate('port').value || '8000';
  var buildPath = this.opts.locate('build-path').value || null;
  var serverAddress = 'http://localhost:' + port;
  var openBrowser = this.opts.locate('open-browser').exists;
  var skipAwsLinking = this.opts.locate('skip-aws-sdk').exists;
  var profiling = this.opts.locate('profiling').exists;

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

    server.listen(parseInt(port, 10), function(error) {
      if (openBrowser) {
        open(serverAddress);
      }
    });
  }

  if (skipAwsLinking) {
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

        console.log('Linking aws-sdk at ' + lambdaPath);

        linkAwsSdk(lambdaPath, function() {
          awsLinkingLambdas--;
        }.bind(this));
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
