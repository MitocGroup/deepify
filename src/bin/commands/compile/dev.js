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
  let Server = require('../../../lib.compiled/Server/Instance').Instance;
  let NpmInstall = require('../../../lib.compiled/NodeJS/NpmInstall').NpmInstall;
  let NpmUpdate = require('../../../lib.compiled/NodeJS/NpmUpdate').NpmUpdate;
  let NpmInstallLibs = require('../../../lib.compiled/NodeJS/NpmInstallLibs').NpmInstallLibs;
  let NpmChain = require('../../../lib.compiled/NodeJS/NpmChain').NpmChain;
  let Bin = require('../../../lib.compiled/NodeJS/Bin').Bin;
  let LambdaExtractor = require('../../../lib.compiled/Helpers/LambdasExtractor').LambdasExtractor;
  let AsyncConfig = require('../../../lib.compiled/Helpers/AsyncConfig').AsyncConfig;

  let doUpdate = this.opts.locate('update').exists;
  let microservicesToInit = this.opts.locate('partial').value;

  mainPath = this.normalizeInputPath(mainPath);

  let propertyConfigFile = path.join(mainPath, Config.DEFAULT_FILENAME);

  if (!fs.existsSync(propertyConfigFile)) {
    fse.outputJsonSync(propertyConfigFile, Config.generate());
  }

  let property = new Property(mainPath);
  let server = new Server(property);

  property.assureFrontendEngine((error) => {
    if (error) {
      console.error('Error while assuring frontend engine: ' + error);
    }

    property.runInitMsHooks(() => {
      initProperty(property, () => {
        console.log('The backend had been successfully initialized.');
      });
    });
  });

  let initProperty = (property, cb) => {
    let lambdaPaths = new LambdaExtractor(property, getMicroservicesToInit()).extract(LambdaExtractor.NPM_PACKAGE_FILTER);

    let chain = new NpmChain();
    let NpmProcess = doUpdate ? NpmUpdate : NpmInstall;
    let installCmd = new NpmProcess(lambdaPaths)
      .addExtraArg(
      '--loglevel silent'
    );

    installCmd.addExtraArg('--prod');

    chain.add(installCmd);

    let linkCmd = new NpmInstallLibs(lambdaPaths);

    // dtrace-provider: Fixes bonyan issue...
    // aws-sdk: use globally
    linkCmd.libs = 'aws-sdk dtrace-provider';

    chain.add(linkCmd);

    chain.runChunk(() => {
      let lambdasConfig = property.fakeBuild();
      server.es.dry().launchInstances(); // asyncConfig is looking at running ES instances
      let asyncConfig = server.asyncConfig.json();

      for (let lambdaArn in lambdasConfig) {
        if (!lambdasConfig.hasOwnProperty(lambdaArn)) {
          continue;
        }

        let lambdaConfig = lambdasConfig[lambdaArn];
        let lambdaPath = path.dirname(lambdaConfig.path);
        let lambdaConfigPath = path.join(lambdaPath, Config.DEFAULT_FILENAME);
        let lambdaAsyncConfigPath = path.join(lambdaPath, AsyncConfig.FILE_NAME);

        let configs = {};
        configs[lambdaConfigPath] = lambdaConfig;
        configs[lambdaAsyncConfigPath] = asyncConfig;

        for (let configPath in configs) {
          if (!configs.hasOwnProperty(configPath)) {
            continue;
          }

          let configObj = configs[configPath];

          if (fs.existsSync(configPath)) {
            console.log(`An old Lambda(${lambdaArn}) config found in ${lambdaPath}. Removing...`);
            fs.unlinkSync(configPath);
          }

          console.log(`Persisting Lambda(${lambdaArn}) config into ${configPath}`);
          fs.writeFileSync(configPath, JSON.stringify(configObj));
        }
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
