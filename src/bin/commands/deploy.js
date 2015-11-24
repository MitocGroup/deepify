#!/usr/bin/env node
/**
 * Created by AlexanderC on 6/19/15.
 */

'use strict';

module.exports = function(mainPath) {
  var path = require('path');
  var fs = require('fs');
  var fse = require('fs-extra');
  var os = require('os');
  var exec = require('child_process').exec;
  var spawn = require('child_process').spawn;
  var Prompt = require('../../lib.compiled/Terminal/Prompt').Prompt;
  var Property = require('deep-package-manager').Property_Instance;
  var Config = require('deep-package-manager').Property_Config;
  var S3Service = require('deep-package-manager').Provisioning_Service_S3Service;
  var ProvisioningCollisionsDetectedException = require('deep-package-manager').Property_Exception_ProvisioningCollisionsDetectedException;

  var localOnly = this.opts.locate('dry-run').exists;
  var dumpCodePath = this.opts.locate('dump-local').value;
  var cfgBucket = this.opts.locate('cfg-bucket').value;
  var hasToPullDeps = this.opts.locate('pull-deps').exists;
  var microservicesToDeploy = this.opts.locate('partial').value;

  if (mainPath.indexOf('/') !== 0) {
    mainPath = path.join(process.cwd(), mainPath);
  }

  if (dumpCodePath && dumpCodePath.indexOf('/') !== 0) {
    dumpCodePath = path.join(process.cwd(), dumpCodePath);
  }

  var configFile = path.join(mainPath, Config.DEFAULT_FILENAME);
  var configExists = fs.existsSync(configFile);
  var config = null;

  if (!configExists) {
    config = Config.generate();

    fs.writeFileSync(configFile, JSON.stringify(config));
  } else {
    config = JSON.parse(fs.readFileSync(configFile));
  }

  var tmpDir = os.tmpdir();
  var tmpPropertyPath = path.join(tmpDir, path.basename(mainPath));
  tmpPropertyPath += '_' + (new Date()).getTime();

  var propertyInstance;

  if (localOnly) {
    console.log('Local mode on!');
  }

  fse.ensureDirSync(tmpPropertyPath);

  console.log('Copying sources to ' + tmpPropertyPath);

  exec('cp -R ' + path.join(mainPath, '*') + ' ' + tmpPropertyPath + '/ &>/dev/null',
    function(error) {
      if (error) {
        console.error('Error copying sources into ' + tmpPropertyPath + ': ' + error);
        this.exit(1);
      }

      // @todo: move this anywhere
      process.on('exit', function() {
        exec('rm -rf ' + tmpPropertyPath);
      });

      propertyInstance = new Property(tmpPropertyPath, Config.DEFAULT_FILENAME);

      propertyInstance.assureFrontendEngine(function(error) {
        if (error) {
          console.error('Error while assuring frontend engine: ' + error);
        }

        propertyInstance.runInitMsHooks(function() {
          var deployCb = function() {
            prepareProduction.bind(this)(propertyInstance.path, doDeploy.bind(this));
          };

          hasToPullDeps ? pullDeps.bind(this)(deployCb) : deployCb.bind(this)();
        }.bind(this));
      }.bind(this));
    }.bind(this)
  );

  function getConfigFromS3(propertyInstance, cb) {
    console.log('Trying to retrieve .cfg.deeploy.json from S3 ' + cfgBucket);

    var s3 = new propertyInstance.AWS.S3();

    var payload = {
      Bucket: cfgBucket,
      Key: '.cfg.deeploy.json',
    };

    s3.getObject(payload, function(error, data) {
      cb.bind(this)(error, data);
    }.bind(this));
  }

  function dumpConfigToS3(propertyInstance, cb) {
    if (!propertyInstance.config || !propertyInstance.config.provisioning) {
      cb && cb.bind(this)();
      return;
    }

    var plainConfig = JSON.stringify(propertyInstance.config);
    var s3 = new propertyInstance.AWS.S3();

    var payload = {
      Bucket: propertyInstance.config.provisioning.s3.buckets[S3Service.SYSTEM_BUCKET].name,
      Key: '.cfg.deeploy.json',
      Body: plainConfig,
    };

    s3.putObject(payload, function(error, data) {
      if (error) {
        console.error('Error persisting config to S3', error);
        this.exit(1);
      }

      cb && cb.bind(this)();
    }.bind(this));
  }

  function dumpConfig(propertyInstance, cb) {
    if (!propertyInstance.config) {
      cb && cb.bind(this)();
      return;
    }

    var deepConfigFile = path.join(mainPath, '.cfg.deeploy.json');
    var plainConfig = JSON.stringify(propertyInstance.config);

    console.log('Dumping config into ' + deepConfigFile);

    fs.writeFile(deepConfigFile, plainConfig, function(error) {
      if (error) {
        console.error('Error while dumping config into ' + deepConfigFile + ': ' + error);
      }

      dumpConfigToS3.bind(this)(propertyInstance, cb);
    }.bind(this));
  }

  function prepareProduction(propertyPath, cb) {
    if (!localOnly) {
      var prompt = new Prompt('Prepare for production?');

      prompt.readConfirm(function(result) {
        if (result) {
          console.log('Start preparing for production');

          var cmdParts = [
            this.scriptPath,
            'compile-prod',
            propertyPath,
            '--remove-source',
          ];

          if (microservicesToDeploy) {
            cmdParts.push('--partial="' + microservicesToDeploy + '"');
          }

          var prodPrepProcess = spawn(this.nodeBinary, cmdParts);


          prodPrepProcess.stdout.pipe(process.stdout);
          prodPrepProcess.stderr.pipe(process.stderr);

          prodPrepProcess.on('close', function (code) {
            if (code !== 0) {
              console.error(
                'Error while preparing for production: Process exit with code ' +
                code
              );
            }

            cb();
          });

          return;
        }

        console.log('Skipping production preparation...');

        cb();
      }.bind(this));

      return;
    }

    cb();
  }

  function doDeploy() {
    propertyInstance.localDeploy = localOnly;

    var deepConfigFile = path.join(mainPath, '.cfg.deeploy.json');

    // @todo: improve it!
    // Gracefully teardown...
    (function() {
      process.on('uncaughtException', function(error) {
        if (error instanceof ProvisioningCollisionsDetectedException) {
          console.error(
            os.EOL,
            os.EOL,
            'Seems like there are some resources on AWS that may generate collisions while provisioning the web app!',
            os.EOL,
            'Remove them by running "deepify undeploy ' + mainPath + ' --resource ' + error.collisionHash + '"',
            os.EOL,
            os.EOL,
            error.constructor._stringifyResourcesObj(error.resourcesObj)
          );

          this.exit(1);
        } else {
          console.error(error.toString(), os.EOL, error.stack);
        }

        if (propertyInstance.config.provisioning) {
          dumpConfig.bind(this)(propertyInstance, function() {
            this.exit(1);
          }.bind(this));
        } else {
          this.exit(1);
        }
      }.bind(this));

      process.on('SIGINT', function() {
        console.log('Gracefully shutting down from SIGINT (Ctrl-C)...');

        if (propertyInstance.config.provisioning) {
          dumpConfig.bind(this)(propertyInstance, function() {
            this.exit(0);
          }.bind(this));
        } else {
          this.exit(0);
        }
      }.bind(this));
    }.bind(this))();

    var updateCfg = fs.existsSync(deepConfigFile) ? JSON.parse(fs.readFileSync(deepConfigFile)) : null;

    // @todo: rewrite this section!
    if (!updateCfg) {
      if (!cfgBucket) {
        if (microservicesToDeploy) {
          console.warn(' Partial deploy option is useless during first deploy...');
        }

        console.log('Installing web app ' + config.appIdentifier);

        propertyInstance.install(function() {
          console.log('CloudFront (CDN) domain: ' + getCfDomain(propertyInstance));
          console.log('Website address: ' + getPublicWebsite(propertyInstance));

          dumpConfig.bind(this)(propertyInstance, dumpCode);
        }.bind(this));
      } else {
        getConfigFromS3.bind(this)(propertyInstance, function(error, updateCfg) {
          if (error) {
            console.error('Error fetching config from AWS S3 bucket ' + cfgBucket, error);
          }

          if (!error) {
            console.log('Updating web app ' + config.appIdentifier);

            propertyInstance.update(JSON.parse(updateCfg.Body.toString()), function() {
              console.log('CloudFront (CDN) domain: ' + getCfDomain(propertyInstance));
              console.log('Website address: ' + getPublicWebsite(propertyInstance));

              dumpConfig.bind(this)(propertyInstance, dumpCode);
            }.bind(this), getMicroservicesToDeploy());
          } else {
            if (microservicesToDeploy) {
              console.warn(' Partial deploy option is useless during first deploy...');
            }

            console.log('Installing web app ' + config.appIdentifier);

            propertyInstance.install(function() {
              console.log('CloudFront (CDN) domain: ' + getCfDomain(propertyInstance));
              console.log('Website address: ' + getPublicWebsite(propertyInstance));

              dumpConfig.bind(this)(propertyInstance, dumpCode);
            }.bind(this));
          }
        }.bind(this));
      }
    } else {
      console.log('Updating web app ' + config.appIdentifier);

      propertyInstance.update(updateCfg, function() {
        console.log('CloudFront (CDN) domain: ' + getCfDomain(propertyInstance));
        console.log('Website address: ' + getPublicWebsite(propertyInstance));

        dumpConfig.bind(this)(propertyInstance, dumpCode);
      }.bind(this), getMicroservicesToDeploy());
    }
  }

  function arrayUnique(a) {
    return a.reduce(function(p, c) {
      if (p.indexOf(c) < 0) {
        p.push(c);
      }

      return p;
    }, []);
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

  function pullDeps(cb) {
    console.log('Resolving dependencies in ' + tmpPropertyPath);

    exec('node ' + path.join(__dirname, './../deepify.js') + ' pull-deps ' + tmpPropertyPath, function(error, stdout, stderr) {
      if (error) {
        console.error('Error while pulling dependencies in ' + tmpPropertyPath + ': ' + error);
        this.exit(1);
      }

      cb.bind(this)();
    }.bind(this));
  }

  function dumpCode() {
    if (!dumpCodePath) {
      return;
    }

    var tmpFrontendPath = path.join(tmpPropertyPath, '_public');
    var frontendDumpPath = path.join(dumpCodePath, '_www');

    fse.ensureDirSync(frontendDumpPath);

    exec('cp -R ' + path.join(tmpFrontendPath, '*') + ' ' + frontendDumpPath + '/ &>/dev/null',
      function(error) {
        if (error) {
          console.error('Unable to dump _frontend code into _www!');
        }

        dumpLambdas();
      }
    );
  }

  function dumpLambdas() {
    var lambdas = getLambdas(tmpPropertyPath);

    if (lambdas.length <= 0) {
      console.log('There are no Lambdas to be dumped!');
      return;
    }

    fse.ensureDirSync(dumpCodePath);

    var awsConfigPlain = JSON.stringify(config.aws);
    var globalAwsConfigFile = path.join(dumpCodePath, '.aws.json');

    fs.writeFileSync(globalAwsConfigFile, awsConfigPlain);

    var lambdasVector = [];
    var stack = lambdas.length;

    for (var i = 0; i < lambdas.length; i++) {
      var lambdaPath = lambdas[i];
      var newLambdaPath = path.join(
        dumpCodePath,
        path.basename(lambdaPath, '.zip').replace(/^lambda_/i, '')
      );
      var awsConfigFile = path.join(newLambdaPath, '.aws.json');

      lambdasVector.push(path.basename(newLambdaPath));

      console.log('Unpacking Lambda into ' + newLambdaPath);

      // @todo: find a smarter way to deny lambda runtime installing deps in runtime
      try {
        fs.unlinkSync(path.join(lambdaPath, 'package.json'));
      } catch (e) {
      }

      var command = 'unzip -qq -o ' + lambdaPath + ' -d ' + newLambdaPath +
        ' &>/dev/null && cp ' + globalAwsConfigFile + ' ' + awsConfigFile;

      exec(command, function(error) {
        if (error) {
          console.error('Error unpacking lambda: ' + error);
        }

        stack--;

        console.log('Remaining ' + stack + ' Lambdas to be unpacked...');
      });
    }

    function waitUntilDone() {
      if (stack > 0) {
        setTimeout(waitUntilDone, 50);
      } else {
        fs.unlinkSync(globalAwsConfigFile);

        console.log('[' + lambdasVector.join(', ') + ']');
        console.log('All Lambdas are now ready to run locally!');
      }
    }

    waitUntilDone();
  }

  function getLambdas(dir, files_) {
    files_ = files_ || [];

    var files = fs.readdirSync(dir);

    for (var i = 0; i < files.length; i++) {
      var file = path.join(dir, files[i]);

      if (/\.zip$/i.test(file)) {
        files_.push(file);
      }
    }

    return files_;
  }

  function getCfDomain(propertyInstance) {
    return 'http://' + propertyInstance.config.provisioning.cloudfront.domain;
  }

  function getPublicWebsite(propertyInstance) {
    var config = propertyInstance.config;
    var bucketName = config.provisioning.s3.buckets[S3Service.PUBLIC_BUCKET].name;

    return 'http://' + bucketName + '.s3-website-' + config.awsRegion + '.amazonaws.com';
  }
};
