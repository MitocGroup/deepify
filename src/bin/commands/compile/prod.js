#!/usr/bin/env node

/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(mainPath) {
  let path = require('path');
  let fse = require('fs-extra');
  let fs = require('fs');
  let Exec = require('../../../lib.compiled/Helpers/Exec').Exec;
  let LambdaExtractor = require('../../../lib.compiled/Helpers/LambdasExtractor').LambdasExtractor;
  let LodashOptimizer = require('../../../lib.compiled/Helpers/LodashOptimizer').LodashOptimizer;
  let LambdaRecursiveOptimize = require('../../../lib.compiled/Helpers/LambdaRecursiveOptimize').LambdaRecursiveOptimize;
  let ValidationSchemasSync = require('../../../lib.compiled/Helpers/ValidationSchemasSync').ValidationSchemasSync;
  let DepsTreeOptimizer = require('../../../lib.compiled/NodeJS/DepsTreeOptimizer').DepsTreeOptimizer;
  let NpmInstall = require('../../../lib.compiled/NodeJS/NpmInstall').NpmInstall;
  let NpmInstallLibs = require('../../../lib.compiled/NodeJS/NpmInstallLibs').NpmInstallLibs;
  let NpmPrune = require('../../../lib.compiled/NodeJS/NpmPrune').NpmPrune;
  let NpmRun = require('../../../lib.compiled/NodeJS/NpmRun').NpmRun;
  let NpmChain = require('../../../lib.compiled/NodeJS/NpmChain').NpmChain;
  let Bin = require('../../../lib.compiled/NodeJS/Bin').Bin;
  let NpmListDependencies = require('../../../lib.compiled/NodeJS/NpmListDependencies').NpmListDependencies;
  let DeepDepsCache = require('../../../lib.compiled/Helpers/DeepDepsCache').DeepDepsCache;
  let Hash = require('deep-package-manager').Helpers_Hash;
  let Property = require('deep-package-manager').Property_Instance;
  let WaitFor = require('deep-package-manager').Helpers_WaitFor;
  let PackageDepsAdapter = require('../../../lib.compiled/Helpers/PackageDepsAdapter').PackageDepsAdapter;
  let FSCopyStrategy = require('../../../lib.compiled/Helpers/SharedBackend/Strategy/FSCopyStrategy').FSCopyStrategy;
  let tmp = require('tmp');
  let validateNodeVersion = require('../helper/validate-node-version');

  validateNodeVersion.call(this);

  let installFromCache = (lambdas, callback) => {
    let doInstall = (lambdaIdx) => {
      let lambdaPath = lambdas.path[lambdaIdx];
      let lambdaTmpPath = lambdas.tmpPath[lambdaIdx];

      if (!lambdaTmpPath || skipCache) {
        console.debug(lambdas.loadedFromCache + ' lambdas dependencies have been loaded from cache.');
        callback();
        return;
      }

      deepDepsCache.hasFor(lambdaTmpPath, (error, has) => {
        if (!has) {
          doInstall(++lambdaIdx);
          return;
        }

        let run = new NpmRun(lambdaTmpPath);
        run.cmd = 'postinstall';
        run.addExtraArg(
          '-loglevel silent',
          '--production'
        );

        run.run(() => {
          deepDepsCache.loadInto(lambdaTmpPath, (error) => {
            if (error) {
              doInstall(++lambdaIdx);
              return;
            }

            let cleanupCmd = new Exec('find . -type f -iname "*.es6" -print0 | xargs -0 rm -rf');
            cleanupCmd.cwd = lambdaTmpPath;
            cleanupCmd.runSync();

            new LambdaRecursiveOptimize(lambdaTmpPath)
              .addFilter((path) => !/\/(deep_modules|node_modules)/i.test(path))
              .run(() => {
                packSingle(lambdaPath, lambdaTmpPath, () => {
                  lambdas.path.splice(lambdaIdx, 1);
                  lambdas.tmpPath.splice(lambdaIdx, 1);
                  lambdas.loadedFromCache++;

                  doInstall(lambdaIdx);
                });
              });
          });
        });
      });
    };

    doInstall(0);
  };

  let prepareSources = (cb, lambdas) => {
    console.debug(lambdas.path.length + ' Lambdas sources are going to be copied...');

    for (let i in lambdas.path) {
      if (!lambdas.path.hasOwnProperty(i)) {
        continue;
      }

      let lambdaPath = lambdas.path[i];
      let lambdaTmpPath = lambdas.tmpPath[i];

      console.debug('Copying Lambda sources from ' + lambdaPath + ' into ' + lambdaTmpPath);

      if (fs.existsSync(lambdaTmpPath)) {
        fse.removeSync(lambdaTmpPath);
      }

      try {
        new Exec(
          'rsync',
          '-ar',
          '--update',
          '--delete',
          '--no-links',
          '--exclude node_modules',
          '--exclude deep_modules',
          path.join(lambdaPath, '/'),
          lambdaTmpPath
        ).runSync();
      } catch (error) {
        console.error(error);

        lambdas.splice(i, 1);
      }

      new PackageDepsAdapter(lambdaPath)
        .dumpInto(lambdaTmpPath);
    }

    cb();
  };

  let optimize = (cb, lambdas, final) => {
    let frameworkPaths = [];

    for (let i in lambdas.tmpPath) {
      if (!lambdas.tmpPath.hasOwnProperty(i)) {
        continue;
      }

      let lambdaTmpPath = lambdas.tmpPath[i];

      console.debug('Optimizing Lambda code in ' + lambdaTmpPath);

      let depsLister = new NpmListDependencies(lambdaTmpPath);
      let depsObj = depsLister.list();

      let frameworkVector = depsObj.findAll('deep-framework');

      for (let j in frameworkVector) {
        if (!frameworkVector.hasOwnProperty(j)) {
          continue;
        }

        let depObj = frameworkVector[j];
        let depPath = depObj.getPath(lambdaTmpPath);

        console.debug('Optimizing deep-framework in ' + depPath);

        frameworkPaths.push(depPath);
      }
    }

    if (frameworkPaths.length <= 0) {
      cb();
      return;
    }

    let run = new NpmRun(frameworkPaths);
    run.cmd = final ? 'final-prepare-production' : 'prepare-production';

    run.runChunk(cb, NpmInstall.DEFAULT_CHUNK_SIZE);
  };

  let optimizeDeps = (cb, lambdas) => {
    if (lambdas.tmpPath.length <= 0) {
      cb();
      return;
    }

    _optimizeDepsChunk(
      NpmInstall._chunkArray(lambdas.tmpPath, NpmInstall.DEFAULT_CHUNK_SIZE),
      cb,
      lambdas
    );
  };

  let _optimizeDepsChunk = (chunks, cb, lambdas) => {
    let chunk = chunks.shift();

    let wait = new WaitFor();
    let remaining = chunk.length;

    wait.push(() => remaining <= 0);

    for (let i in chunk) {
      if (!chunk.hasOwnProperty(i)) {
        continue;
      }

      let lambdaTmpPath = chunk[i];

      console.debug('Optimizing Lambda dependencies in ' + lambdaTmpPath);

      let depsOptimizer = new DepsTreeOptimizer(lambdaTmpPath);

      depsOptimizer.optimize(
        function(lambdaTmpPath, depsFullNames) {
          console.debug('Flatten dependencies in ' + lambdaTmpPath + ': ' + depsFullNames.join(', '));

          remaining--;
        }.bind(this, lambdaTmpPath)
      );
    }

    wait.ready(() => {
      if (chunks.length <= 0) {
        optimize(cb, lambdas, true);
      } else {
        _optimizeDepsChunk(chunks, cb, lambdas);
      }
    });
  };

  let pack = (cb, lambdas) => {
    let wait = new WaitFor();
    let remaining = lambdas.path.length;

    console.debug(lambdas.path.length + ' Lambdas are going to be optimized...');

    wait.push(() => remaining <= 0);
    wait.ready(cb);

    for (let i in lambdas.path) {
      if (!lambdas.path.hasOwnProperty(i)) {
        continue;
      }

      let lambdaPath = lambdas.path[i];
      let lambdaTmpPath = lambdas.tmpPath[i];

      // @todo: move it somewhere...
      let cleanupCmd = new Exec(
        'find . -type d -iname "aws-sdk*" -print0 | xargs -0 rm -rf;',
        'find . -type f -iname "*.es6" -print0 | xargs -0 rm -rf'
      );

      cleanupCmd.cwd = lambdaTmpPath;

      console.debug('Cleanup Lambda sources in ' + lambdaTmpPath);

      cleanupCmd
        .avoidBufferOverflow()
        .run(function(lambdaPath, lambdaTmpPath, result) {
          if (result.failed) {
            console.error(result.error);
          }

          // @todo: move it somewhere...
          let cleanupCmd = new Exec('find . -type l -exec sh -c \'for x; do [ -e "$x" ] || rm "$x"; done\' _ {} +');

          cleanupCmd.cwd = lambdaTmpPath;

          console.debug('Fix broken links in ' + lambdaTmpPath);

          cleanupCmd
            .avoidBufferOverflow()
            .run((result) => {
              if (result.failed) {
                console.error(result.error);
              }

              console.debug('Running lodash optimizer');

              // @todo: get rid of this optimizer?
              new LodashOptimizer(lambdaTmpPath)
                .optimize(() => {
                  console.debug('Running .js optimizer');

                  new LambdaRecursiveOptimize(lambdaTmpPath)
                    .run(() => {
                      cacheDeepDeps(lambdaTmpPath, () => {
                        packSingle(lambdaPath, lambdaTmpPath, () => {
                          remaining--;
                        });
                      });
                    });
                });
            });
        }.bind(this, lambdaPath, lambdaTmpPath));
    }
  };

  let packSingle = (lambdaPath, lambdaTmpPath, cb) => {
    let outputFile = path.join(
      lambdaPath,
      '..',
      path.basename(lambdaPath) + '.zip'
    );

    if (fs.existsSync(outputFile)) {
      console.debug('Removing old Lambda build ' + outputFile);
      fse.removeSync(outputFile);
    }

    console.debug('Packing Lambda code into ' + outputFile + ' (' + lambdaTmpPath + ')');

    // @todo: replace this with a node native
    let zip = new Exec(
      Bin.resolve('zip'),
      '-y',
      '-r',
      outputFile,
      '.'
    );

    zip.cwd = lambdaTmpPath;
    zip.avoidBufferOverflow();

    zip.run((result) => {
      if (result.failed) {
        console.error(result.error);
        this.exit(1);
      }

      cb();
    });
  };

  let cacheDeepDeps = (lambdaPath, callback) => {
    deepDepsCache.cacheFrom(lambdaPath, 86400 * 3, callback); // cache deps for 3 days
  };

  let getMicroservicesToCompile = () => {
    if (!microservicesToCompile) {
      return [];
    }

    let msIdentifiers = arrayUnique(microservicesToCompile.split(',').map(id => id.trim()));

    return typeof msIdentifiers === 'string' ? [msIdentifiers] : msIdentifiers;
  };

  let arrayUnique = (a) => {
    return a.reduce((p, c) => {
      if (p.indexOf(c) < 0) {
        p.push(c);
      }
      return p;
    }, []);
  };

  let objectValues = object => Object.keys(object).map(key => object[key]);

  let removeSource = this.opts.locate('remove-source').exists;
  let microservicesToCompile = this.opts.locate('partial').value;
  let linear =  this.opts.locate('linear').exists;
  let skipCache = this.opts.locate('skip-cache').exists;
  let invalidateCache = this.opts.locate('invalidate-cache').exists;
  let deepDepsCache = new DeepDepsCache(DeepDepsCache.DEFAULT_CACHE_DIRECTORY, {});

  mainPath = this.normalizeInputPath(mainPath);
  let property = Property.create(mainPath);
  let lambdas = {
    path: [],
    tmpPath: [],
    loadedFromCache: 0,
    count: function() {
      return this.path.length + this.loadedFromCache; // do not replace with arrow function
    }
  };

  let lambdasObj = new LambdaExtractor(property, getMicroservicesToCompile())
    .extract(LambdaExtractor.NPM_PACKAGE_FILTER, LambdaExtractor.EXTRACT_OBJECT);
  lambdas.path = arrayUnique(objectValues(lambdasObj));

  if (invalidateCache) {
    deepDepsCache.flush();
  }

  if (linear) {
    console.debug('Sync validation schemas into ' + lambdas.path.length + ' Lambdas');

    new ValidationSchemasSync(property).syncWorking(ValidationSchemasSync.NPM_PACKAGE_FILTER);

    for (let lambdaIdentifier in lambdasObj) {
      if (!lambdasObj.hasOwnProperty(lambdaIdentifier)) {
        continue;
      }

      let lambdaPath = lambdasObj[lambdaIdentifier];
      let lambdaTmpPath = path.join(tmp.dirSync().name, Hash.md5(lambdaPath) + '_' + new Date().getTime());

      lambdas.tmpPath.push(lambdaTmpPath);
    }

    prepareSources(installFromCache.bind(this, lambdas, function () {
      let chain = new NpmChain();

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

      chain.runChunk(() => {
        optimize(() => {
          optimizeDeps(() => {
            pack(() => {
              lambdas.tmpPath.forEach((lambdaTmpPath) => {
                fse.removeSync(lambdaTmpPath);
              });

              if (removeSource) {
                lambdas.path.forEach((lambdaPath) => {
                  fse.removeSync(lambdaPath);
                });
              }

              console.info(lambdas.count() + ' Lambdas were successfully prepared for production');
            }, lambdas);
          }, lambdas);
        }, lambdas);
      }, NpmInstall.DEFAULT_CHUNK_SIZE);
    }), lambdas);
  } else { // @todo: Implement some multithreading class
    let maxProcessCount = NpmInstall.DEFAULT_CHUNK_SIZE;
    let processCount = 0;

    let createCommand = () => {
      let cmd = new Exec(
        Bin.node,
        this.scriptPath,
        'compile',
        'prod',
        mainPath
      );

      if (removeSource) {
        cmd.addArg('--remove-source');
      }

      if (skipCache) {
        cmd.addArg('--skip-cache');
      }

      cmd.addArg('--linear');

      return cmd;
    };

    let refreshProcessList = (lambdaIdentifiers) => {
      if (lambdaIdentifiers.length === 0 && processCount === 0) {
        process.exit(0);
      }

      while (lambdaIdentifiers.length > 0 && processCount < maxProcessCount) {
        let identifier = lambdaIdentifiers.shift();
        let cmd = createCommand();

        cmd.addArg('--partial="' + identifier + '"'); // doesn't work without quotes
        cmd.run(() => processCount--, true);

        processCount++;
      }
    };

    property.assureFrontendEngine(error => {
      if (error) {
        console.error('Error while assuring frontend engine: ' + error);
      }

      setInterval(
        refreshProcessList.bind(this, Object.keys(lambdasObj)),
        1000
      );
    });
  }
};
