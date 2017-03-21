#!/usr/bin/env node

/**
 * Created by AlexanderC on 6/19/15.
 */

/*eslint max-statements: 0, no-unused-expressions: 0*/

'use strict';

module.exports = function(mainPath) {
  let path = require('path');
  let fs = require('fs');
  let fse = require('fs-extra');
  let os = require('os');
  let Exec = require('../../lib.compiled/Helpers/Exec').Exec;
  let Bin = require('../../lib.compiled/NodeJS/Bin').Bin;
  let Prompt = require('../../lib.compiled/Terminal/Prompt').Prompt;
  let LambdasExtractor = require('../../lib.compiled/Helpers/LambdasExtractor').LambdasExtractor;
  let Property = require('deep-package-manager').Property_Instance;
  let SharedAwsConfig = require('deep-package-manager').Helpers_SharedAwsConfig;
  let Config = require('deep-package-manager').Property_Config;
  let S3Service = require('deep-package-manager').Provisioning_Service_S3Service;
  let ProvisioningCollisionsDetectedException = require('deep-package-manager')
    .Property_Exception_ProvisioningCollisionsDetectedException;
  let DeployConfig = require('deep-package-manager').Property_DeployConfig;
  let Listing = require('deep-package-manager').Provisioning_Listing;

  let resourcesToUpdate = this.opts.locate('action').value;
  let isProd = this.opts.locate('prod').exists;
  let localOnly = this.opts.locate('dry-run').exists;
  let invalidateCache = this.opts.locate('invalidate-cache').exists;
  let dumpCodePath = this.opts.locate('dump-local').value;
  let cfgBucket = this.opts.locate('cfg-bucket').value;
  let appEnv = isProd ? 'prod' : this.opts.locate('env').value;
  let microservicesToDeploy = this.opts.locate('partial').value;
  let frontendOnly = this.opts.locate('frontend').exists ? Property.DEPLOY_FRONTEND : 0;
  let backendOnly = this.opts.locate('backend').exists ? Property.DEPLOY_BACKEND : 0;
  let debugBuild = this.opts.locate('debug-build').exists;
  let validateNodeVersion = require('./helper/validate-node-version');
  let undeployRunning = false;

  validateNodeVersion.call(this);
  mainPath = this.normalizeInputPath(mainPath);

  if (dumpCodePath) {
    dumpCodePath = this.normalizeInputPath(dumpCodePath);
  }

  let propertyInstance = Property.create(mainPath);
  let configFile = path.join(propertyInstance.path, Config.DEFAULT_FILENAME);
  let config = propertyInstance.config;
  
  if (frontendOnly || backendOnly) {
    propertyInstance.deployFlags = frontendOnly | backendOnly;
  }

  appEnv = appEnv ? appEnv.toLowerCase() : null;

  if (appEnv && DeployConfig.AVAILABLE_ENV.indexOf(appEnv) === -1) {
    console.error(`Invalid environment ${appEnv}. Available environments: ${DeployConfig.AVAILABLE_ENV.join(', ')}`);
    this.exit(1);
  }

  if (localOnly) {
    console.debug('Local mode on!');
  }

  if (appEnv) {
    config.env = appEnv;
  }

  let arrayUnique = (a) => {
    return a.reduce((p, c) => {
      if (p.indexOf(c) < 0) {
        p.push(c);
      }

      return p;
    }, []);
  };

  let dumpConfig = (propertyInstance, cb) => propertyInstance.configObj.completeDump(cb);

  let getCfDomain = propertyInstance => `http://${propertyInstance.config.provisioning.cloudfront.domain}`;

  let ensureAWSProdKeys = (cb) => {
    (new SharedAwsConfig()).refillPropertyConfigIfNeeded(config, (refilled) => {
      if (refilled) {
        fse.outputJsonSync(configFile, config);
      }

      cb();
    });
  };

  let hasDeployedResources = cb => {
    let lister = new Listing(propertyInstance);

    lister.list(listingResult => {
      cb(listingResult.matchedResources > 0);
    });
  };

  let deployRollback = cb => {
    if (propertyInstance.isUpdate || undeployRunning) {
      return cb(null); // @todo: undeploy either the update?
    }

    undeployRunning = true;

    hasDeployedResources(has => {
      if (!has) {
        return cb(null);
      }

      let prompt = new Prompt('Do you want to undeploy deployed resources?');

      prompt.readConfirm(result => {
        if (!result) {
          return cb(null);
        }

        let baseHash = propertyInstance.configObj.baseHash;

        console.log(`Start undeploying resources for ${baseHash}`);

        let undeployCmd = new Exec(
          Bin.node,
          this.scriptPath,
          'undeploy',
          propertyInstance.path,
          `--resource=${baseHash}`
        );

        if (isProd) {
          undeployCmd.addArg('--prod');
        }

        undeployCmd.run(() => {
          if (undeployCmd.failed) {
            return cb(undeployCmd.error);
          }

          cb(null);
        }, true);
      });
    });
  };

  let getLambdas = (dir, files_) => {
    files_ = files_ || [];

    let files = fs.readdirSync(dir);

    for (let i = 0; i < files.length; i++) {
      let file = path.join(dir, files[i]);

      if (/\.zip$/i.test(file)) {
        files_.push(file);
      }
    }

    return files_;
  };

  let dumpLambdas = () => {
    let lambdas = getLambdas(propertyInstance.path);

    if (lambdas.length <= 0) {
      console.debug('There are no Lambdas to be dumped!');
      return;
    }

    fse.ensureDirSync(dumpCodePath);

    let globalAwsConfigFile = path.join(dumpCodePath, '.aws.json');

    fs.outputJsonSync(globalAwsConfigFile, config.aws);

    let lambdasVector = [];
    let stack = lambdas.length;

    for (let i = 0; i < lambdas.length; i++) {
      let lambdaPath = lambdas[i];
      let newLambdaPath = path.join(
        dumpCodePath,
        path.basename(lambdaPath, '.zip').replace(/^lambda_/i, '')
      );
      let awsConfigFile = path.join(newLambdaPath, '.aws.json');

      lambdasVector.push(path.basename(newLambdaPath));

      console.debug('Unpacking Lambda into ' + newLambdaPath);

      // @todo: find a smarter way to deny lambda runtime installing deps in runtime
      try {
        fs.unlinkSync(path.join(lambdaPath, 'package.json'));
      } catch (e) {
        console.error('Failed to unlinkSync: ', e);
      }

      new Exec(
        'unzip',
        '-qq',
        '-o',
        lambdaPath,
        '-d',
        newLambdaPath
      )
        .avoidBufferOverflow()
        .run(function(awsConfigFile, result) {
          if (result.failed) {
            console.error(result.error);
          }

          fse.copySync(globalAwsConfigFile, awsConfigFile);

          stack--;

          console.debug(`Remaining ${stack} Lambdas to be unpacked...`);
        }.bind(this, awsConfigFile));
    }

    let waitUntilDone = () => {
      if (stack > 0) {
        setTimeout(waitUntilDone, 50);
      } else {
        fs.unlinkSync(globalAwsConfigFile);

        console.debug(`[${lambdasVector.join(', ')}]`);
        console.debug('All Lambdas are now ready to run locally!');
      }
    };

    waitUntilDone();
  };

  let dumpCode = () => {
    if (!dumpCodePath) {
      return;
    }

    let tmpFrontendPath = path.join(propertyInstance.path, '_public');
    let frontendDumpPath = path.join(dumpCodePath, '_www');

    fse.ensureDirSync(frontendDumpPath);

    new Exec(
      'cp',
      '-R',
      path.join(tmpFrontendPath, '*'),
      frontendDumpPath + '/'
    )
      .avoidBufferOverflow()
      .run((result) => {
        if (result.failed) {
          console.error(`Unable to dump _frontend code into _www: ${result.error}`);
        }

        dumpLambdas();
      });
  };

  let getPublicWebsite = propertyInstance => {
    return `http://${propertyInstance.config.provisioning.s3.buckets[S3Service.PUBLIC_BUCKET].website}`;
  };

  let getMicroservicesToDeploy = () => {
    if (!microservicesToDeploy) {
      return [];
    }

    let msIdentifiers = arrayUnique(microservicesToDeploy.split(',').map(id => id.trim()));

    return typeof msIdentifiers === 'string' ? [msIdentifiers] : msIdentifiers;
  };

  let getResourcesToUpdate = () => {
    if (!resourcesToUpdate) {
      return null;
    }

    let msIdentifiers = arrayUnique(resourcesToUpdate.split(',').map(id => id.trim()));

    return typeof msIdentifiers === 'string' ? [msIdentifiers] : msIdentifiers;
  };

  let doDeploy = () => {
    propertyInstance.localDeploy = localOnly;

    // @todo: improve it!
    // Gracefully teardown...
    (() => {
      process.on('uncaughtException', (error) => {
        if (error instanceof ProvisioningCollisionsDetectedException) {
          console.error(
            os.EOL,
            os.EOL,
            'Seems like there are some resources on AWS that may generate collisions while provisioning the web app!',
            os.EOL,
            `Remove them by running "deepify undeploy ${propertyInstance.path} --resource ${error.collisionHash}"`,
            os.EOL,
            os.EOL,
            error.stringifiedResourcesObj
          );

          this.exit(1);
        } else {
          console.error(error.toString(), os.EOL, error.stack);
        }

        deployRollback((error) => {
          if (error) {
            console.error(`Error while undeploying resources for ${propertyInstance.configObj.baseHash}: ${error}`);
          }

          if (propertyInstance.config.provisioning) {
            dumpConfig(propertyInstance, () => {
              this.exit(1);
            });
          } else {
            this.exit(1);
          }
        });
      });

      process.on('SIGINT', () => {
        console.debug('Gracefully shutting down from SIGINT (Ctrl-C)...');

        deployRollback((error) => {
          if (error) {
            console.error(`Error while undeploying resources for ${propertyInstance.configObj.baseHash}: ${error}`);
          }

          if (propertyInstance.config.provisioning) {
            dumpConfig(propertyInstance, () => {
              this.exit(1);
            });
          } else {
            this.exit(1);
          }
        });
      });
    })();

    propertyInstance.configObj.tryLoadConfig(() => {
      if (propertyInstance.configObj.configExists) {
        propertyInstance.update(() => {
          console.info(`CloudFront (CDN) domain: ${getCfDomain(propertyInstance)}`);
          console.info(`Website address: ${getPublicWebsite(propertyInstance)}`);

          dumpConfig(propertyInstance, dumpCode);
        }, null, getMicroservicesToDeploy());
      } else {
        if (microservicesToDeploy) {
          console.warn('Partial deploy option is useless during first deploy...');
        }

        propertyInstance.install(() => {
          console.info(`CloudFront (CDN) domain: ${getCfDomain(propertyInstance)}`);
          console.info(`Website address: ${getPublicWebsite(propertyInstance)}`);

          dumpConfig(propertyInstance, dumpCode);
        });
      }
    }, cfgBucket);
  };

  let doCompileProd = (propertyPath, cb) => {
    console.debug('Start preparing for production');

    let cmd = new Exec(
      Bin.node,
      this.scriptPath,
      'compile',
      'prod',
      propertyPath
    );

    let resourcesToCompile = microservicesToDeploy || resourcesToUpdate;

    invalidateCache && cmd.addArg('--invalidate-cache');
    resourcesToCompile && cmd.addArg(`--partial="${resourcesToCompile}"`);

    if (debugBuild) {
      cmd.addArg('--debug-build');
    }

    cmd.run((result) => {
      if (result.failed) {
        console.error(`Backend production preparations failed: ${result.error}`);
        this.exit(1);
      }

      cb();
    }, true);
  };

  let prepareProduction = (propertyPath, cb) => {
    if (isProd) {
      doCompileProd(propertyPath, cb);
    } else if (!localOnly && !frontendOnly) {
      let prompt = new Prompt('Prepare for production?');

      prompt.readConfirm((result) => {
        if (result) {
          doCompileProd(propertyPath, cb);

          return;
        }

        console.debug('Skipping production preparation...');

        cb();
      });
    } else {
      cb();

      return;
    }
  };

  let startDeploy = () => {
    ensureAWSProdKeys(() => {
      propertyInstance.assureFrontendEngine((error) => {
        if (error) {
          console.error('Error while assuring frontend engine: ' + error);
        }

        propertyInstance.runInitMsHooks(() => {
          propertyInstance.runPreDeployMsHooks(() => {
            prepareProduction(propertyInstance.path, doDeploy);
          });
        });
      });
    });
  };

  let removePackedLambdas = () => {
    let lambdas = getLambdas(propertyInstance.path);

    if (lambdas.length <= 0) {
      return;
    }

    for (let i = 0; i < lambdas.length; i++) {
      try {
        fs.unlinkSync(lambdas[i]);
      } catch (e) {
        console.error('Failed to unlinkSync: ', e);
      }
    }
  };

  let askForProductionPrepare = (cb) => {
    if (debugBuild) {
      // if --debug-build is present,
      // run 'compile prod' with --debug-build flag, without asking
      return cb(true);
    }

    let prompt = new Prompt(`Prepare for production "${resourcesToUpdate}"?`);

    prompt.readConfirm(cb);
  };

  let updateResources = (resourcesIdentifiers) => {
    propertyInstance.configObj.tryLoadConfig(() => {
      if (!propertyInstance.configObj.configExists) {
        throw new Error('Action deploy is available only on application update');
      }

      let prepareResources = (path, cb) => {
        console.debug(`Skipping "${resourcesToUpdate}" production preparation...`);

        cb();
      };

      askForProductionPrepare((result) => {
        if (result) {
          prepareResources = doCompileProd.bind(this);
        }

        prepareResources(propertyInstance.path, () => {
          Promise.all(
            resourcesIdentifiers.map(resource => {
              return new Promise((resolve, reject) => {
                try {
                  propertyInstance.deployAction('@' + resource, () => {
                    console.info(`"${resource}" has been updated.`);
                    resolve();
                  });
                } catch(e) {
                  reject(e);
                }
              });
            })
          ).then(() => {
            console.info('All resources have been updated.');
          }).catch(e => {
            setImmediate(() => {
              throw e;
            });
          });
        });
      });
    });
  };

  if (resourcesToUpdate) {
    let resourcesIdentifiers = Object.keys(
      new LambdasExtractor(propertyInstance, getResourcesToUpdate())
        .extract(LambdasExtractor.NPM_PACKAGE_FILTER, LambdasExtractor.EXTRACT_OBJECT)
    );

    return updateResources(resourcesIdentifiers);
  }

  process.on('exit', () => {
    new Exec('rm', '-rf', path.join(propertyInstance.path, '_public'))
      .avoidBufferOverflow()
      .runSync();

    removePackedLambdas();
  });

  startDeploy();
};
