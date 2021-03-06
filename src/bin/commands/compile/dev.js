#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function (mainPath) {
  let path = require('path');
  let Property = require('deep-package-manager').Property_Instance;
  let Config = require('deep-package-manager').Property_Config;
  let Frontend = require('deep-package-manager').Property_Frontend;
  let fs = require('fs');
  let fse = require('fs-extra');
  let Server = require('../../../lib.compiled/Server/Instance').Instance;
  let NpmInstall = require('../../../lib.compiled/NodeJS/NpmInstall').NpmInstall;
  let NpmUpdate = require('../../../lib.compiled/NodeJS/NpmUpdate').NpmUpdate;
  let NpmInstallLibs = require('../../../lib.compiled/NodeJS/NpmInstallLibs').NpmInstallLibs;
  let NpmChain = require('../../../lib.compiled/NodeJS/NpmChain').NpmChain;
  let LambdaExtractor = require('../../../lib.compiled/Helpers/LambdasExtractor').LambdasExtractor;
  let AsyncConfig = require('../../../lib.compiled/Helpers/AsyncConfig').AsyncConfig;
  let NpmInstallFlatten = require('../../../lib.compiled/NodeJS/NpmInstallFlatten').NpmInstallFlatten;

  let doUpdate = this.opts.locate('update').exists;
  let microservicesToInit = this.opts.locate('partial').value;
  let skipInstall = this.opts.locate('skip-install').exists;

  let libs = 'aws-sdk dtrace-provider';

  mainPath = this.normalizeInputPath(mainPath);

  let property = Property.create(mainPath);

  let objectValues = obj => Object.keys(obj).map(k => obj[k]);

  let initProperty = (property, cb) => {
    let lambdaPathsObj = new LambdaExtractor(property, getMicroservicesToInit())
      .extract(LambdaExtractor.NPM_PACKAGE_FILTER, LambdaExtractor.EXTRACT_OBJECT);
    let lambdaPaths = objectValues(lambdaPathsObj);

    let chain = new NpmChain();
    const flatten = this._opts.locate('flatten').exists;

    if (!flatten) {
      let NpmProcess = doUpdate ? NpmUpdate : NpmInstall;
      let installCmd = new NpmProcess(lambdaPaths)
        .dry(skipInstall)
        .addExtraArg(
        '--loglevel silent'
        );

      installCmd.addExtraArg('--only=prod');

      chain.add(installCmd);

      let linkCmd = new NpmInstallLibs(lambdaPaths).dry(skipInstall);

      // dtrace-provider: Fixes bonyan issue...
      // aws-sdk: use globally
      linkCmd.libs = libs;
      chain.add(linkCmd);
      } else {
        // Flatten mode  
        let flattenCmd = new NpmInstallFlatten().addExtraArg('--loglevel silent').extractDependencies(lambdaPaths);
        flattenCmd.setUpLibs(libs);

        chain.add(flattenCmd);
      }

    chain.runChunk(() => {
      let lambdasConfig = property.fakeBuild();
      let server = new Server(property);
      server.es.dry().launchInstances(); // asyncConfig is looking at running ES instances
      let asyncConfig = server.asyncConfig.json();

      for (let lambdaArn in lambdasConfig) {
        if (!lambdasConfig.hasOwnProperty(lambdaArn)) {
          continue;
        }

        let lambdaConfig = lambdasConfig[lambdaArn];
        let lambdaPath = path.dirname(lambdaConfig.path);
        let lambdaConfigPath = path.join(lambdaPath, Frontend.CONFIG_FILE);
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
            console.debug(`An old Lambda(${lambdaArn}) config found in ${lambdaPath}. Removing...`);
            fs.unlinkSync(configPath);
          }

          console.debug(`Persisting Lambda(${lambdaArn}) config into ${configPath}`);
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
      if (p.indexOf(c) < 0) {
        p.push(c);
      }
      return p;
    }, []);
  };

  property.assureFrontendEngine((error) => {
    if (error) {
      console.error('Error while assuring frontend engine: ' + error);
    }

    property.runInitMsHooks(() => {
      initProperty(property, () => {
        console.info('The backend had been successfully initialized.');
      });
    });
  });
};
