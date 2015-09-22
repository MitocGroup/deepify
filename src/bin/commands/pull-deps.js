#!/usr/bin/env node
/**
 * Created by AlexanderC on 6/19/15.
 */

'use strict';

module.exports = function(mainPath) {
  var aws = require('aws-sdk');
  var path = require('path');
  var fs = require('fs');
  var Manager = require('../../lib.compiled/Dependencies/Manager').Manager;
  var S3Driver = require('../../lib.compiled/Dependencies/Driver/S3StdDriver').S3StdDriver;
  var Config = require('../../lib.compiled/Property/Config').Config;

  var dryRun = this.opts.locate('dry-run').exists;

  var microservicesStack = [];

  var semicolonIndex = mainPath.lastIndexOf(':');
  if (-1 !== semicolonIndex) {
    var microservicesRaw = mainPath.substr(semicolonIndex + 1);

    microservicesRaw.split(',').forEach(function(subPath) {
      microservicesStack.push(subPath.trim());
    });

    mainPath = mainPath.substr(0, semicolonIndex);
  }

  if (mainPath.indexOf('/') !== 0) {
    mainPath = path.join(process.cwd(), mainPath);
  }

  var configFile = path.join(mainPath, Config.DEFAULT_FILENAME);
  var configExists = fs.existsSync(configFile);

  if (!configExists) {
    console.error('Missing ' + Config.DEFAULT_FILENAME + ' configuration file in ' + mainPath);
    this.exit(1);
  }

  var config = JSON.parse(fs.readFileSync(configFile));

  if (!config.dependencies
    || typeof config.dependencies.bucket === 'undefined') {

    console.error('Missing dependencies or bucket properties');
    this.exit(1);
  }

  var s3Bucket = config.dependencies.bucket;
  var s3Prefix = config.dependencies.prefix || '';

  aws.config.update(config.dependencies.aws || config.aws);

  var driver = new S3Driver(aws, s3Bucket);
  driver.basePath = mainPath;
  driver.prefix = s3Prefix;

  var mg = new Manager(driver);
  mg.driver.dryRun = dryRun;

  console.log('Resolving dependencies from ' + mainPath + ' using \'s3://' + s3Bucket + '/' + s3Prefix + ' \' repository');

  if (microservicesStack.length > 0) {
    console.log('---> ', microservicesStack);

    mg.pullBatch(microservicesStack, function() {
      console.log('Done!');
    });
  } else {
    mg.pull(function() {
      console.log('Done!');
    });
  }
};
