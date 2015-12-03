#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(mainPath) {
  var path = require('path');
  var fse = require('fs-extra');
  var fs = require('fs');
  var Exec = require('../../lib.compiled/Helpers/Exec').Exec;
  var LambdaExtractor = require('../../lib.compiled/Helpers/LambdasExtractor').LambdasExtractor;
  var DepsTreeOptimizer = require('../../lib.compiled/NodeJS/DepsTreeOptimizer').DepsTreeOptimizer;
  var NpmInstall = require('../../lib.compiled/NodeJS/NpmInstall').NpmInstall;
  var NpmPrune = require('../../lib.compiled/NodeJS/NpmPrune').NpmPrune;
  var NpmDedupe = require('../../lib.compiled/NodeJS/NpmDedupe').NpmDedupe;
  var NpmRun = require('../../lib.compiled/NodeJS/NpmRun').NpmRun;
  var NpmChain = require('../../lib.compiled/NodeJS/NpmChain').NpmChain;
  var NpmListDependencies = require('../../lib.compiled/NodeJS/NpmListDependencies').NpmListDependencies;
  var Hash = require('deep-package-manager').Helpers_Hash;
  var Property = require('deep-package-manager').Property_Instance;
  var WaitFor = require('deep-package-manager').Helpers_WaitFor;
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
  var lambdas = {
    path: [],
    tmpPath: [],
  };

  lambdas.path = arrayUnique(new LambdaExtractor(property).extractWorking(function(lambdaPath) {
    return fs.existsSync(path.join(lambdaPath, 'package.json'));
  }));

  for (var i in lambdas.path) {
    if (!lambdas.path.hasOwnProperty(i)) {
      continue;
    }

    var lambdaPath = lambdas.path[i];
    var lambdaTmpPath = path.join(tmp.dirSync().name, Hash.md5(lambdaPath) + '_' + new Date().getTime());

    lambdas.tmpPath.push(lambdaTmpPath);
  }

  prepareSources.bind(this)(function() {
    var chain = new NpmChain();

    chain.add(
      new NpmInstall(lambdas.tmpPath)
        .addExtraArg(
          '--no-bin-links',
          '--no-optional',
          '--loglevel silent',
          '--production'
        )
    );

    chain.add(
      new NpmPrune(lambdas.tmpPath)
        .addExtraArg('--production')
    );

    chain.runChunk(function() {
      optimize.bind(this)(function() {
        pack.bind(this)(function() {
          lambdas.tmpPath.forEach(function(lambdaTmpPath) {
            fse.removeSync(lambdaTmpPath);
          });

          if (removeSource) {
            lambdas.path.forEach(function(lambdaPath) {
              fse.removeSync(lambdaPath);
            });
          }

          console.log(lambdas.path.length + ' Lambdas were successfully prepared for production');
        }.bind(this), lambdas);
      }.bind(this), lambdas);
    }.bind(this), NpmInstall.DEFAULT_CHUNK_SIZE);
  }.bind(this), lambdas);

  function prepareSources(cb, lambdas) {
    var wait = new WaitFor();
    var remaining = lambdas.path.length;

    console.log(lambdas.path.length + ' Lambdas sources are going to be copied...');

    wait.push(function() {
      return remaining <= 0;
    }.bind(this));

    wait.ready(cb);

    for (var i in lambdas.path) {
      if (!lambdas.path.hasOwnProperty(i)) {
        continue;
      }

      var lambdaPath = lambdas.path[i];
      var lambdaTmpPath = lambdas.tmpPath[i];

      console.log('Copying Lambda sources from ' + lambdaPath + ' into ' + lambdaTmpPath);

      if (fs.existsSync(lambdaTmpPath)) {
        fse.removeSync(lambdaTmpPath);
      }

      fse.copy(lambdaPath, lambdaTmpPath, function(lambdaTmpPath, i, error) {
        if (error) {
          console.error(error);

          lambdas.splice(i, 1);
        } else {
          var nodeModules = path.join(lambdaTmpPath, 'node_modules');

          if (fs.existsSync(nodeModules)) {
            fse.removeSync(nodeModules);
          }
        }

        remaining--;
      }.bind(this, lambdaTmpPath, i));
    }
  }

  function optimize(cb, lambdas) {
    var frameworkPaths = [];
    var wait = new WaitFor();
    var remaining = lambdas.tmpPath.length;

    wait.push(function() {
      return remaining <= 0;
    }.bind(this));

    wait.ready(function() {
      if (frameworkPaths.length <= 0) {
        cb();
        return;
      }

      var run = new NpmRun(frameworkPaths);
      run.cmd = 'prepare-production';

      run.runChunk(cb, NpmInstall.DEFAULT_CHUNK_SIZE);
    }.bind(this));

    for (var i in lambdas.tmpPath) {
      if (!lambdas.tmpPath.hasOwnProperty(i)) {
        continue;
      }

      var lambdaTmpPath = lambdas.tmpPath[i];

      console.log('Optimizing Lambda code in ' + lambdaTmpPath);

      let depsOptimizer = new DepsTreeOptimizer(lambdaTmpPath);

      depsOptimizer.optimize(function(lambdaTmpPath, depsFullNames) {
        console.log('Flatten dependencies in ' + lambdaTmpPath + ': ' + depsFullNames.join(', '));

        remaining--;
      }.bind(this), lambdaTmpPath);

      var depsLister = new NpmListDependencies(lambdaTmpPath);
      var depsObj = depsLister.list();

      var frameworkVector = depsObj.findAll('deep-framework');

      for (var j in frameworkVector) {
        if (!frameworkVector.hasOwnProperty(j)) {
          continue;
        }

        var depObj = frameworkVector[j];
        var depPath = depObj.getPath(lambdaTmpPath);

        console.log('Optimizing deep-framework in ' + depPath);

        frameworkPaths.push(depPath);
      }
    }
  }

  function pack(cb, lambdas) {
    var wait = new WaitFor();
    var remaining = lambdas.path.length;

    console.log(lambdas.path.length + ' Lambdas are going to be packed...');

    wait.push(function() {
      return remaining <= 0;
    }.bind(this));

    wait.ready(cb);

    for (var i in lambdas.path) {
      if (!lambdas.path.hasOwnProperty(i)) {
        continue;
      }

      var lambdaPath = lambdas.path[i];
      var lambdaTmpPath = lambdas.tmpPath[i];

      var outputFile = path.join(
        lambdaPath,
        '..',
        path.basename(lambdaPath) + '.zip'
      );

      console.log('Packing Lambda code into ' + outputFile + ' (' + lambdaTmpPath + ')');

      var output = fs.createWriteStream(outputFile);
      var archive = Archiver('zip');

      output.on('close', function() {
        remaining--;
      }.bind(this));

      archive.pipe(output);

      archive
        .directory(lambdaTmpPath, false)
        .finalize();
    }
  }

  function getMicroservicesToDeploy() {
    if (!microservicesToDeploy) {
      return [];
    }

    var msIdentifiers = arrayUnique(microservicesToDeploy.split(',').map(function(id) {
      return id.trim();
    }));

    return typeof msIdentifiers === 'string' ? [msIdentifiers] : msIdentifiers;
  }

  function arrayUnique(a) {
    return a.reduce(function(p, c) {
      if (p.indexOf(c) < 0) p.push(c);
      return p;
    }, []);
  }
};
