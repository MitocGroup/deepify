#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(mainPath) {
  let path = require('path');
  let Property = require('deep-package-manager').Property_Instance;
  let Config = require('deep-package-manager').Property_Config;
  let fs = require('fs');
  let fse = require('fs-extra');
  let NpmInstall = require('../../../lib.compiled/NodeJS/NpmInstall').NpmInstall;
  let NpmInstallLibs = require('../../../lib.compiled/NodeJS/NpmInstallLibs').NpmInstallLibs;
  let NpmLink = require('../../../lib.compiled/NodeJS/NpmLink').NpmLink;
  let NpmChain = require('../../../lib.compiled/NodeJS/NpmChain').NpmChain;
  let Bin = require('../../../lib.compiled/NodeJS/Bin').Bin;
  let LambdaExtractor = require('../../../lib.compiled/Helpers/LambdasExtractor').LambdasExtractor;

  let microservicesToInit = this.opts.locate('partial').value;

  mainPath = this.normalizeInputPath(mainPath);

  let propertyConfigFile = path.join(mainPath, Config.DEFAULT_FILENAME);

  if (!fs.existsSync(propertyConfigFile)) {
    fse.outputJsonSync(propertyConfigFile, Config.generate());
  }

  let property = new Property(mainPath);

  property.assureFrontendEngine((error) => {
    if (error) {
      console.error('Error while assuring frontend engine: ' + error);
    }

    property.runInitMsHooks(() => {
      if (!Bin.npmModuleInstalled('aws-sdk', true)) {
        let awsSdkGlobalCmd = new NpmInstallLibs();
        awsSdkGlobalCmd.libs = 'aws-sdk';
        awsSdkGlobalCmd.global = true;

        awsSdkGlobalCmd.run((result) => {
          if (result.failed) {
            console.error('Failed to install aws-sdk globally: ' + result.error);
            this.exit(1);
          }

          initProperty(property, () => {
            console.log('The backend had been successfully initialized.');
          });
        });
      } else {
        initProperty(property, () => {
          console.log('The backend had been successfully initialized.');
        });
      }
    });
  });

  let initProperty = (property, cb) => {
    let lambdaPaths = new LambdaExtractor(property, getMicroservicesToInit()).extract(LambdaExtractor.NPM_PACKAGE_FILTER);

    let chain = new NpmChain();
    let installCmd = new NpmInstall(lambdaPaths)
      .addExtraArg(
      '--loglevel silent'
    );

    installCmd.addExtraArg('--prod');

    chain.add(installCmd);

    let linkCmd = new NpmLink(lambdaPaths);
    linkCmd.libs = 'aws-sdk';

    chain.add(linkCmd);

    chain.runChunk(() => {
      let lambdasConfig = property.fakeBuild();

      for (let lambdaArn in lambdasConfig) {
        if (!lambdasConfig.hasOwnProperty(lambdaArn)) {
          continue;
        }

        let lambdaConfig = lambdasConfig[lambdaArn];
        let lambdaPath = path.dirname(lambdaConfig.path);
        let lambdaConfigPath = path.join(lambdaPath, '_config.json');

        if (fs.existsSync(lambdaConfigPath)) {
          console.log('An old Lambda(' + lambdaArn + ') config found in ' + lambdaPath + '. Removing...');
          fs.unlinkSync(lambdaConfigPath);
        }

        console.log('Persisting Lambda(' + lambdaArn + ') config into ' + lambdaConfigPath);
        fs.writeFileSync(lambdaConfigPath, JSON.stringify(lambdaConfig));
      }

      cb();
    }, NpmInstall.DEFAULT_CHUNK_SIZE);
  };

  let getMicroservicesToInit = () => {
    if (!microservicesToInit) {
      return [];
    }

    let msIdentifiers = arrayUnique(microservicesToInit.split(',').map(id => id.trim()));

    return typeof msIdentifiers === 'string' ? [msIdentifiers] : msIdentifiers;
  };

  let arrayUnique = (a) => {
    return a.reduce((p, c) => {
      if (p.indexOf(c) < 0) p.push(c);
      return p;
    }, []);
  }
};