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
  var WaitFor = require('../../lib.compiled/Helpers/WaitFor').WaitFor;
  var Hash = require('../../lib.compiled/Helpers/Hash').Hash;
  var Property = require('../../lib.compiled/Property/Instance').Instance;
  var Archiver = require('archiver');
  var tmp = require('tmp');

  var removeSource = this.opts.locate('remove-source').exists;

  if (mainPath.indexOf('/') !== 0) {
    mainPath = path.join(process.cwd(), mainPath);
  }

  var property = new Property(mainPath);

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

  lambdaPaths = arrayUnique(lambdaPaths);

  dispatchLambdaPathsChain(chunk(lambdaPaths, 2), function() {
    console.log((new Date().toTimeString()) + ' You Lambdas were successfully prepared for production');
  }.bind(this));

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

    console.log((new Date().toTimeString()) + ' Running next lambdas build batch: ' + batch.join(', '));

    prepareBatch(batch, function() {
      dispatchLambdaPathsChain(lambdaPathsChunks, cb);
    }.bind(this));
  }

  function npmInstall(lambdaPath, cb) {
    console.log((new Date().toTimeString()) + ' Checking for NPM package in ' + lambdaPath);

    var packageFile = path.join(lambdaPath, 'package.json');

    if (fs.existsSync(packageFile)) {
      console.log((new Date().toTimeString()) + ' Running "' + installCmd + '" for Lambda ' + lambdaPath);

      var tmpFolder = path.join(tmp.dirSync().name, Hash.md5(lambdaPath));

      var cmd = 'mkdir -p ' + tmpFolder  +
        '; rsync -a --delete ' + lambdaPath + '/* ' + tmpFolder +
        '; cd ' + tmpFolder +
        '; rm -rf ' + path.join(tmpFolder, 'node_modules') +
        '; ' + installCmd;

      exec(cmd, function(error, stdout, stderr) {
        if (error) {
          console.error((new Date().toTimeString()) + ' Failed to run "' + installCmd + '" for Lambda ' + lambdaPath
            + ' (' + stderr + '). Skipping...');
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

        console.log((new Date().toTimeString()) + ' Packing Lambda code into ' + outputFile);

        archive
          .directory(tmpFolder, false)
          .finalize();

        wait.ready(function() {
          if (removeSource) {
            // @todo: replace with native code
            exec('rm -rf ' + path.join(lambdaPath, '*'));
          }

          cb();
        }.bind(this));
      }.bind(this));
    } else {
      console.log((new Date().toTimeString()) + ' No NPM package found in ' + lambdaPath + '. Skipping...');
    }
  }

  function arrayUnique(a) {
    return a.reduce(function(p, c) {
      if (p.indexOf(c) < 0) p.push(c);
      return p;
    }, []);
  }
};
