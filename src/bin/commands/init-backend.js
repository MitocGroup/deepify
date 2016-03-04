#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(mainPath) {
  var path = require('path');
  var Property = require('deep-package-manager').Property_Instance;
  var Config = require('deep-package-manager').Property_Config;
  var fs = require('fs');
  var fse = require('fs-extra');
  var NpmInstall = require('../../lib.compiled/NodeJS/NpmInstall').NpmInstall;
  var NpmInstallLibs = require('../../lib.compiled/NodeJS/NpmInstallLibs').NpmInstallLibs;
  var NpmLink = require('../../lib.compiled/NodeJS/NpmLink').NpmLink;
  var NpmChain = require('../../lib.compiled/NodeJS/NpmChain').NpmChain;
  var Bin = require('../../lib.compiled/NodeJS/Bin').Bin;
  var LambdaExtractor = require('../../lib.compiled/Helpers/LambdasExtractor').LambdasExtractor;

  var microservicesToInit = this.opts.locate('partial').value;
  var useProd = this.opts.locate('prod').exists;

  mainPath = this.normalizeInputPath(mainPath);

  var propertyConfigFile = path.join(mainPath, Config.DEFAULT_FILENAME);

  if (!fs.existsSync(propertyConfigFile)) {
    fse.outputJsonSync(propertyConfigFile, Config.generate());
  }

  var property = new Property(mainPath);
  property.microservicesToUpdate = getMicroservicesToInit();

  property.assureFrontendEngine(function(error) {
    if (error) {
      console.error('Error while assuring frontend engine: ' + error);
    }

    property.runInitMsHooks(function() {
      if (!Bin.npmModuleInstalled('aws-sdk', true)) {
        var awsSdkGlobalCmd = new NpmInstallLibs();
        awsSdkGlobalCmd.libs = 'aws-sdk';
        awsSdkGlobalCmd.global = true;

        awsSdkGlobalCmd.run(function(result) {
          if (result.failed) {
            console.error('Failed to install aws-sdk globally: ' + result.error);
            this.exit(1);
          }

          initProperty.bind(this)(property, function() {
            console.log('The backend had been successfully initialized.');
          });
        }.bind(this));
      } else {
        initProperty.bind(this)(property, function() {
          console.log('The backend had been successfully initialized.');
        });
      }
    }.bind(this));
  }.bind(this));

  function initProperty(property, cb) {
    var lambdaPaths = new LambdaExtractor(property).extractWorking(LambdaExtractor.NPM_PACKAGE_FILTER);

    var chain = new NpmChain();
    var installCmd = new NpmInstall(lambdaPaths)
      .addExtraArg(
      '--loglevel silent'
    );

    if (useProd) {
      installCmd.addExtraArg('--prod');
    }

    chain.add(installCmd);

    var linkCmd = new NpmLink(lambdaPaths);
    linkCmd.libs = 'aws-sdk';

    chain.add(linkCmd);

    chain.runChunk(function() {
      var lambdasConfig = property.fakeBuild();

      for (var lambdaArn in lambdasConfig) {
        if (!lambdasConfig.hasOwnProperty(lambdaArn)) {
          continue;
        }

        var lambdaConfig = lambdasConfig[lambdaArn];
        var lambdaPath = path.dirname(lambdaConfig.path);
        var lambdaConfigPath = path.join(lambdaPath, '_config.json');

        if (fs.existsSync(lambdaConfigPath)) {
          console.log('An old Lambda(' + lambdaArn + ') config found in ' + lambdaPath + '. Removing...');
          fs.unlinkSync(lambdaConfigPath);
        }

        console.log('Persisting Lambda(' + lambdaArn + ') config into ' + lambdaConfigPath);
        fs.writeFileSync(lambdaConfigPath, JSON.stringify(lambdaConfig));
      }

      cb();
    }.bind(this), NpmInstall.DEFAULT_CHUNK_SIZE);
  }

  function getMicroservicesToInit() {
    if (!microservicesToInit) {
      return [];
    }

    var msIdentifiers = arrayUnique(microservicesToInit.split(',').map(function(id) {
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
