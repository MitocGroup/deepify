#!/usr/bin/env node

/**
 * Created by AlexanderC on 6/19/15.
 */

/*jshint loopfunc:true */
/*jshint expr:true */

'use strict';

module.exports = function(mainPath) {
  let path = require('path');
  let fs = require('fs');
  let fse = require('fs-extra');
  let os = require('os');
  let Exec = require('../../lib.compiled/Helpers/Exec').Exec;
  let Bin = require('../../lib.compiled/NodeJS/Bin').Bin;
  let Prompt = require('../../lib.compiled/Terminal/Prompt').Prompt;
  let Property = require('deep-package-manager').Property_Instance;
  let SharedAwsConfig = require('deep-package-manager').Helpers_SharedAwsConfig;
  let Config = require('deep-package-manager').Property_Config;
  let S3Service = require('deep-package-manager').Provisioning_Service_S3Service;
  let ProvisioningCollisionsDetectedException = require('deep-package-manager').Property_Exception_ProvisioningCollisionsDetectedException;
  let DeployConfig = require('deep-package-manager').Property_DeployConfig;

  let isProd = this.opts.locate('prod').exists;
  let installSdk = this.opts.locate('aws-sdk').exists;
  let localOnly = this.opts.locate('dry-run').exists;
  let fastDeploy = this.opts.locate('fast').exists;
  let dumpCodePath = this.opts.locate('dump-local').value;
  let cfgBucket = this.opts.locate('cfg-bucket').value;
  let appEnv = isProd ? 'prod' : this.opts.locate('env').value;
  let microservicesToDeploy = this.opts.locate('partial').value;
  let validateNodeVersion = require('./helper/validate-node-version');

  validateNodeVersion.call(this);
  mainPath = this.normalizeInputPath(mainPath);

  if (dumpCodePath) {
    dumpCodePath = this.normalizeInputPath(dumpCodePath);
  }

  let configFile = path.join(mainPath, Config.DEFAULT_FILENAME);
  let configExists = fs.existsSync(configFile);
  let config = null;

  appEnv = appEnv ? appEnv.toLowerCase() : null;

  if (appEnv && DeployConfig.AVAILABLE_ENV.indexOf(appEnv) === -1) {
    console.error(`Invalid environment ${appEnv}. Available environments: ${DeployConfig.AVAILABLE_ENV.join(', ')}`);
    this.exit(1);
  }

  if (!configExists) {
    config = Config.generate();

    if (appEnv) {
      config.env = appEnv;
    }

    fse.outputJsonSync(configFile, config);
  } else {
    config = fse.readJsonSync(configFile);

    if (appEnv) {
      config.env = appEnv;

      fse.outputJsonSync(configFile, config);
    }
  }

  let propertyInstance;
  let tmpPropertyPath = mainPath;

  if (localOnly) {
    console.log('Local mode on!');
  }

  if (fastDeploy) {
    let prompt = new Prompt('Fast deploy may alter the web app state! Start anyway?');

    prompt.readConfirm((result) => {
      if (result) {
        process.on('exit', () => {
          new Exec('rm', '-rf', path.join(tmpPropertyPath, '_public'))
            .avoidBufferOverflow()
            .runSync();

          removePackedLambdas();
        });

        startDeploy();
        return;
      }

      console.log('Cancelled by the user...');
    });
  } else {
    let tmpDir = os.tmpdir();
    tmpPropertyPath = path.join(tmpDir, path.basename(mainPath));
    tmpPropertyPath += `_${new Date().getTime()}`;

    fse.ensureDirSync(tmpPropertyPath);

    console.log(`Copying sources to ${tmpPropertyPath}`);

    new Exec(
      'cp',
      '-R',
      path.join(mainPath, '*'),
      tmpPropertyPath + '/'
    )
      .avoidBufferOverflow()
      .run((result) => {
        if (result.failed) {
          console.error(`Error copying sources into ${tmpPropertyPath}: ${result.error}`);
          this.exit(1);
        }

        process.on('exit', () => {
          let result = new Exec('rm', '-rf', tmpPropertyPath)
            .avoidBufferOverflow()
            .runSync();

          if (result.failed) {
            console.error(result.error);
          }
        });

        startDeploy();
      });
  }

  let ensureAWSProdKeys = (cb) => {
    (new SharedAwsConfig()).refillPropertyConfigIfNeeded(config, (refilled) => {
      if (refilled) {
        fse.outputJsonSync(configFile, config);
      }

      cb();
    });
  };

  let startDeploy = () => {
    ensureAWSProdKeys(() => {
      propertyInstance = new Property(tmpPropertyPath, Config.DEFAULT_FILENAME);

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

  let dumpConfig = (propertyInstance, cb) => {
    propertyInstance.configObj.completeDump(() => {
      if (!fastDeploy) {
        let configFile = propertyInstance.configObj.configFile;

        fse.copySync(configFile, path.join(mainPath, path.basename(configFile)));
      }

      cb();
    });
  };

  let doCompileProd = (propertyPath, cb) => {
    console.log('Start preparing for production');

    let cmd = new Exec(
      Bin.node,
      this.scriptPath,
      'compile-prod',
      propertyPath
    );

    !fastDeploy && cmd.addArg('--remove-source');
    microservicesToDeploy && cmd.addArg('--partial ' + microservicesToDeploy);
    installSdk && cmd.addArg('--aws-sdk');

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
    } else if (!localOnly) {
      let prompt = new Prompt('Prepare for production?');

      prompt.readConfirm((result) => {
        if (result) {
          doCompileProd(propertyPath, cb);

          return;
        }

        console.log('Skipping production preparation...');

        cb();
      });
    } else {
      cb();
    }
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
            `Remove them by running "deepify undeploy ${mainPath} --resource ${error.collisionHash}"`,
            os.EOL,
            os.EOL,
            error.stringifiedResourcesObj
          );

          this.exit(1);
        } else {
          console.error(error.toString(), os.EOL, error.stack);
        }

        if (propertyInstance.config.provisioning) {
          dumpConfig(propertyInstance, () => {
            this.exit(1);
          });
        } else {
          this.exit(1);
        }
      });

      process.on('SIGINT', () => {
        console.log('Gracefully shutting down from SIGINT (Ctrl-C)...');

        if (propertyInstance.config.provisioning) {
          dumpConfig(propertyInstance, () => this.exit(0));
        } else {
          this.exit(0);
        }
      });
    })();

    propertyInstance.configObj.tryLoadConfig(() => {
      if (propertyInstance.configObj.configExists) {
        propertyInstance.update(() => {
          console.log(`CloudFront (CDN) domain: ${getCfDomain(propertyInstance)}`);
          console.log(`Website address: ${getPublicWebsite(propertyInstance)}`);

          dumpConfig(propertyInstance, dumpCode);
        }, null, getMicroservicesToDeploy());
      } else {
        if (microservicesToDeploy) {
          console.warn(' Partial deploy option is useless during first deploy...');
        }

        propertyInstance.install(() => {
          console.log(`CloudFront (CDN) domain: ${getCfDomain(propertyInstance)}`);
          console.log(`Website address: ${getPublicWebsite(propertyInstance)}`);

          dumpConfig(propertyInstance, dumpCode);
        });
      }
    }, cfgBucket);
  };

  let arrayUnique = (a) => {
    return a.reduce((p, c) => {
      if (p.indexOf(c) < 0) {
        p.push(c);
      }

      return p;
    }, []);
  };

  let  getMicroservicesToDeploy = () => {
    if (!microservicesToDeploy) {
      return [];
    }

    let msIdentifiers = arrayUnique(microservicesToDeploy.split(',').map(id => id.trim()));

    return typeof msIdentifiers === 'string' ? [msIdentifiers] : msIdentifiers;
  };

  let dumpCode = () => {
    if (!dumpCodePath) {
      return;
    }

    let tmpFrontendPath = path.join(tmpPropertyPath, '_public');
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

  let removePackedLambdas = () => {
    let lambdas = getLambdas(tmpPropertyPath);

    if (lambdas.length <= 0) {
      return;
    }

    for (let i = 0; i < lambdas.length; i++) {
      try {
        fs.unlinkSync(lambdas[i]);
      } catch (e) {
      }
    }
  };

  let dumpLambdas = () => {
    let lambdas = getLambdas(tmpPropertyPath);

    if (lambdas.length <= 0) {
      console.log('There are no Lambdas to be dumped!');
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

      console.log('Unpacking Lambda into ' + newLambdaPath);

      // @todo: find a smarter way to deny lambda runtime installing deps in runtime
      try {
        fs.unlinkSync(path.join(lambdaPath, 'package.json'));
      } catch (e) {
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

          console.log(`Remaining ${stack} Lambdas to be unpacked...`);
        }.bind(this, awsConfigFile));
    }

    let waitUntilDone = () => {
      if (stack > 0) {
        setTimeout(waitUntilDone, 50);
      } else {
        fs.unlinkSync(globalAwsConfigFile);

        console.log(`[${lambdasVector.join(', ')}]`);
        console.log('All Lambdas are now ready to run locally!');
      }
    };

    waitUntilDone();
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

  let getCfDomain = (propertyInstance) => `http://${propertyInstance.config.provisioning.cloudfront.domain}`;

  let getPublicWebsite = (propertyInstance) => {
    return `http://${propertyInstance.config.provisioning.s3.buckets[S3Service.PUBLIC_BUCKET].website}`;
  };
};
