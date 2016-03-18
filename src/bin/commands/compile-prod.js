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
  var LodashOptimizer = require('../../lib.compiled/Helpers/LodashOptimizer').LodashOptimizer;
  var LambdaRecursiveOptimize = require('../../lib.compiled/Helpers/LambdaRecursiveOptimize').LambdaRecursiveOptimize;
  var ValidationSchemasSync = require('../../lib.compiled/Helpers/ValidationSchemasSync').ValidationSchemasSync;
  var DepsTreeOptimizer = require('../../lib.compiled/NodeJS/DepsTreeOptimizer').DepsTreeOptimizer;
  var NpmInstall = require('../../lib.compiled/NodeJS/NpmInstall').NpmInstall;
  var NpmInstallLibs = require('../../lib.compiled/NodeJS/NpmInstallLibs').NpmInstallLibs;
  var NpmPrune = require('../../lib.compiled/NodeJS/NpmPrune').NpmPrune;
  var NpmRun = require('../../lib.compiled/NodeJS/NpmRun').NpmRun;
  var NpmChain = require('../../lib.compiled/NodeJS/NpmChain').NpmChain;
  var Bin = require('../../lib.compiled/NodeJS/Bin').Bin;
  var NpmListDependencies = require('../../lib.compiled/NodeJS/NpmListDependencies').NpmListDependencies;
  var Hash = require('deep-package-manager').Helpers_Hash;
  var Property = require('deep-package-manager').Property_Instance;
  var WaitFor = require('deep-package-manager').Helpers_WaitFor;
  var tmp = require('tmp');

  var removeSource = this.opts.locate('remove-source').exists;
  var installSdk = this.opts.locate('aws-sdk').exists;
  var microservicesToDeploy = this.opts.locate('partial').value;

  mainPath = this.normalizeInputPath(mainPath);

  var property = new Property(mainPath);
  property.microservicesToUpdate = getMicroservicesToDeploy();

  var lambdas = {
    path: [],
    tmpPath: [],
  };

  lambdas.path = arrayUnique(new LambdaExtractor(property).extractWorking(LambdaExtractor.NPM_PACKAGE_FILTER));

  console.log('Sync validation schemas into ' + lambdas.path.length + ' Lambdas');

  new ValidationSchemasSync(property).syncWorking(ValidationSchemasSync.NPM_PACKAGE_FILTER);

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
          '--production',
          '--save'
        )
    );

    chain.add(
      new NpmPrune(lambdas.tmpPath)
        .addExtraArg('--production')
    );

    chain.runChunk(function() {
      optimize.bind(this)(function() {
        optimizeDeps.bind(this)(function() {
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
      }.bind(this), lambdas);
    }.bind(this), NpmInstall.DEFAULT_CHUNK_SIZE);
  }.bind(this), lambdas);

  function prepareSources(cb, lambdas) {
    console.log(lambdas.path.length + ' Lambdas sources are going to be copied...');

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

      try {
        fse.copySync(lambdaPath, lambdaTmpPath);

        var nodeModules = path.join(lambdaTmpPath, 'node_modules');

        if (fs.existsSync(nodeModules)) {
          fse.removeSync(nodeModules);
        }
      } catch (error) {
        console.error(error);

        lambdas.splice(i, 1);
      }
    }

    cb();
  }

  function optimize(cb, lambdas, final) {
    var frameworkPaths = [];

    for (var i in lambdas.tmpPath) {
      if (!lambdas.tmpPath.hasOwnProperty(i)) {
        continue;
      }

      var lambdaTmpPath = lambdas.tmpPath[i];

      console.log('Optimizing Lambda code in ' + lambdaTmpPath);

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

    if (frameworkPaths.length <= 0) {
      cb();
      return;
    }

    var run = new NpmRun(frameworkPaths);
    run.cmd = final ? 'final-prepare-production' : 'prepare-production';

    run.runChunk(cb, NpmInstall.DEFAULT_CHUNK_SIZE);
  }

  function optimizeDeps(cb, lambdas) {
    if (lambdas.tmpPath.length <= 0) {
      cb();
      return;
    }

    _optimizeDepsChunk(
      NpmInstall._chunkArray(lambdas.tmpPath, NpmInstall.DEFAULT_CHUNK_SIZE),
      cb,
      lambdas
    );
  }

  function _optimizeDepsChunk(chunks, cb, lambdas) {
    var chunk = chunks.shift();

    var wait = new WaitFor();
    var remaining = chunk.length;

    wait.push(function() {
      return remaining <= 0;
    }.bind(this));

    for (var i in chunk) {
      if (!chunk.hasOwnProperty(i)) {
        continue;
      }

      var lambdaTmpPath = chunk[i];

      console.log('Optimizing Lambda dependencies in ' + lambdaTmpPath);

      var depsOptimizer = new DepsTreeOptimizer(lambdaTmpPath);

      depsOptimizer.optimize(
        function(lambdaTmpPath, depsFullNames) {
          console.log('Flatten dependencies in ' + lambdaTmpPath + ': ' + depsFullNames.join(', '));

          remaining--;
        }.bind(this, lambdaTmpPath)
      );
    }

    wait.ready(function() {
      if (chunks.length <= 0) {
        optimize.bind(this)(cb, lambdas, true);
      } else {
        _optimizeDepsChunk(chunks, cb, lambdas);
      }
    }.bind(this));
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

      // @todo: move it somewhere...
      var cleanupCmd = new Exec(
        'find . -type d -iname "aws-sdk*" -print0 | xargs -0 rm -rf;',
        'find . -type f -iname "*.es6" -print0 | xargs -0 rm -rf'
      );

      cleanupCmd.cwd = lambdaTmpPath;

      console.log('Cleanup Lambda sources in ' + lambdaTmpPath);

      cleanupCmd
        .avoidBufferOverflow()
        .run(function(lambdaPath, lambdaTmpPath, result) {
          if (result.failed) {
            console.error(result.error);
          }

          // @todo: move it somewhere...
          var cleanupCmd = new Exec('find . -type l -exec sh -c \'for x; do [ -e "$x" ] || rm "$x"; done\' _ {} +');

          cleanupCmd.cwd = lambdaTmpPath;

          console.log('Fix broken links in ' + lambdaTmpPath);

          cleanupCmd
            .avoidBufferOverflow()
            .run(function(result) {
              if (result.failed) {
                console.error(result.error);
              }

              console.log('Running lodash optimizer');

              // @todo: get rid of this optimizer?
              new LodashOptimizer(lambdaTmpPath)
                .optimize(function() {
                  console.log('Running .js optimizer');

                  new LambdaRecursiveOptimize(lambdaTmpPath)
                    .run(function() {
                      if (installSdk) {
                        console.log('Installing latest aws-sdk into ' + lambdaTmpPath);

                        var npmLink = new NpmInstallLibs(lambdaTmpPath);
                        npmLink.libs = 'aws-sdk';

                        npmLink.run(function() {
                          packSingle.bind(this)(lambdaPath, lambdaTmpPath, function() {
                            remaining--;
                          }.bind(this));
                        }.bind(this));
                      } else {
                        packSingle.bind(this)(lambdaPath, lambdaTmpPath, function() {
                          remaining--;
                        }.bind(this));
                      }
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        }.bind(this, lambdaPath, lambdaTmpPath));
    }
  }

  function packSingle(lambdaPath, lambdaTmpPath, cb) {
    var outputFile = path.join(
      lambdaPath,
      '..',
      path.basename(lambdaPath) + '.zip'
    );

    if (fs.existsSync(outputFile)) {
      console.log('Removing old Lambda build ' + outputFile);
      fse.removeSync(outputFile);
    }

    console.log('Packing Lambda code into ' + outputFile + ' (' + lambdaTmpPath + ')');

    // @todo: replace this with a node native
    var zip = new Exec(
      Bin.resolve('zip'),
      '-y',
      '-r',
      outputFile,
      '.'
    );

    zip.cwd = lambdaTmpPath;
    zip.avoidBufferOverflow();

    zip.run(function(result) {
      if (result.failed) {
        console.error(result.error);
        this.exit(1);
      }

      cb();
    }.bind(this));
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
      if (p.indexOf(c) < 0) {
        p.push(c);
      }
      return p;
    }, []);
  }
};
