#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(mainPath) {
  var installCmd = "npm install --production";

  var path = require('path');
  var fse = require('fs-extra');
  var fs = require('fs');
  var exec = require('child_process').exec;
  var WaitFor = require('deep-package-manager').Helpers_WaitFor;
  var Hash = require('deep-package-manager').Helpers_Hash;
  var Property = require('deep-package-manager').Property_Instance;
  var Archiver = require('archiver');
  var tmp = require('tmp');

  var removeSource = this.opts.locate('remove-source').exists;
  var microservicesToDeploy = this.opts.locate('partial').value;

  if (mainPath.indexOf('/') !== 0) {
    mainPath = path.join(process.cwd(), mainPath);
  }

  var property = new Property(mainPath);
  property.microservicesToUpdate = getMicroservicesToDeploy();

  var microservices = property.workingMicroservices;
  var lambdaPaths = [];

  for (var i = 0; i < microservices.length; i++) {
    var microservice = microservices[i];

    for (var j = 0; j < microservice.resources.actions.length; j++) {
      var microserviceRoute = microservice.resources.actions[j];

      if (microserviceRoute.type === 'lambda') {
        lambdaPaths.push(path.join(microservice.autoload.backend, microserviceRoute.source));
      }
    }
  }

  lambdaPaths = arrayUnique(lambdaPaths);

  dispatchLambdaPathsChain(chunk(lambdaPaths, 2), function() {
    console.log('Application Lambdas were successfully prepared for production');
  }.bind(this));

  function getMicroservicesToDeploy() {
    if (!microservicesToDeploy) {
      return [];
    }

    var msIdentifiers = arrayUnique(microservicesToDeploy.split(',').map(function(id) {
      return id.trim();
    }));

    return typeof msIdentifiers === 'string' ? [msIdentifiers] : msIdentifiers;
  }

  function prepareBatch(lambdaPaths, cb) {
    var remaining = lambdaPaths.length;

    var wait = new WaitFor();

    for (var i = 0; i < lambdaPaths.length; i++) {
      var lambdaPath = lambdaPaths[i];

      npmInstall(lambdaPath, function(lambdaPath) {
        remaining--;
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

  function npmInstall(lambdaPath, cb) {
    console.log('Checking for NPM package in ' + lambdaPath);

    var packageFile = path.join(lambdaPath, 'package.json');

    if (fs.existsSync(packageFile)) {
      console.log('Running "' + installCmd + '" for Lambda ' + lambdaPath);

      var tmpFolder = path.join(tmp.dirSync().name, Hash.md5(lambdaPath));

      var cmd = 'mkdir -p ' + tmpFolder  +
        '; cp -R ' + lambdaPath + '/ ' + tmpFolder + '/ &>/dev/null' +
        '; cd ' + tmpFolder +
        '; rm -rf ' + path.join(tmpFolder, 'node_modules') +
        '; ' + installCmd + ' &>/dev/null';

      exec(cmd, function(error) {
        if (error) {
          console.error('Failed to run "' + installCmd + '" for Lambda ' + lambdaPath + '. Skipping...');
        }

        var packageFile = path.join(lambdaPath, 'package.json');
        var pathName = path.basename(lambdaPath);
        var outputFile = path.join(lambdaPath, '..', pathName + '.zip');

        var wait = new WaitFor();
        var ready = false;
        var output = fs.createWriteStream(outputFile);
        var archive = Archiver('zip');

        output.on('close', function() {
          ready = true;
        }.bind(this));

        wait.push(function() {
          return ready;
        }.bind(this));

        archive.pipe(output);

        console.log('Packing Lambda code into ' + outputFile);

        archive
          .directory(tmpFolder, false)
          .finalize();

        wait.ready(function() {
          if (removeSource) {
            // @todo: replace with native code
            exec('rm -rf ' + path.join(lambdaPath, '*'));
          }

          exec('rm -rf ' + tmpFolder);

          cb();
        }.bind(this));
      }.bind(this));
    } else {
      console.log('No NPM package found in ' + lambdaPath + '. Skipping...');
    }
  }

  function arrayUnique(a) {
    return a.reduce(function(p, c) {
      if (p.indexOf(c) < 0) p.push(c);
      return p;
    }, []);
  }
};
