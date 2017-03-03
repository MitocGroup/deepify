#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

/* eslint no-use-before-define: 1 */

'use strict';

module.exports = function(dependency, dumpPath) {

  // @todo: move it in some json config?
  let DEFAULT_REGISTRY_BASE_HOST = 'https://deep.mg';

  let AuthToken = require('../../lib.compiled/Registry/AuthToken').AuthToken;
  let RegistryConfig = require('../../lib.compiled/Registry/Config').Config;
  let Property = require('deep-package-manager').Property_Instance;
  let PropertyConfig = require('deep-package-manager').Property_Config;
  let Registry = require('deep-package-manager').Registry_Registry;
  let ApiDriver = require('deep-package-manager').Registry_Storage_Driver_ApiDriver;
  let ModuleContext = require('deep-package-manager').Registry_Context_Context;
  let GitHubDriver = require('deep-package-manager').Registry_Storage_Driver_GitHubDriver;
  let RegistryAuthorizer = require('deep-package-manager').Registry_Storage_Driver_Helpers_Api_Auth_Authorizer;
  let Bin = require('../../lib.compiled/NodeJS/Bin').Bin;
  let Exec = require('../../lib.compiled/Helpers/Exec').Exec;
  let path = require('path');

  dumpPath = this.normalizeInputPath(dumpPath);

  let createProperty = () => Property.create(dumpPath, PropertyConfig.DEFAULT_FILENAME);
  let getRegistryToken = () => new AuthToken().refresh().toString();

  let createRegistry = (cb) => {
    console.debug('Initializing remote registry');

    Registry.createApiRegistry(registryBaseHost, (error, registry) => {
      if (error) {
        console.error(error);
        this.exit(1);
      }

      if (registry.storage.driver.find(ApiDriver)) {
        registry.storage.driver.find(ApiDriver).authorizer = RegistryAuthorizer.createHeaderToken(getRegistryToken());
      }

      if (registry.storage.driver.find(GitHubDriver) && gitHubAuthPair) {
        let gitHubCred = gitHubAuthPair.split(':');

        registry.storage.driver.find(GitHubDriver).auth(gitHubCred[0], gitHubCred[1]);
      }

      cb(registry);
    }, true);
  };

  let parseDep = () => {
    let parts = (dependency || '').split('@');

    if (parts.length <= 1) {
      return [parts[0], '*'];
    }

    return [parts[0], parts[1]];
  };

  let npmInstall = (repo, cb) => {
    console.debug('Installing ' + repo + ' via NPM globally');

    new Exec('npm list -g --depth 0 ' + repo + ' || npm install -g ' + repo)
      .avoidBufferOverflow()
      .run((result) => {
        if (result.failed) {
          console.error('Error installing ' + repo + ' globally: ' + result.error);

          cb(result.error);
          return;
        }

        cb(null);
      });
  };

  let initBackend = () => {
    if (!initApp) {
      return;
    }

    console.debug('Start initializing backend');

    npmInstall('"babel-cli@^6.x.x"', (error) => {
      if (error) {
        console.error('Error while installing babel: ' + error);
        this.exit(1);
      }

      //@todo - temporary workaround for FATAL ERROR- JS Allocation failed – process out of memory
      if(/^win/.test(process.platform)) {
        console.warn('The web application was successfully installed on Windows!\n');
        console.info('To initialize backend use "deepify compile dev path/to" command');
        console.info('To run local development server use "deepify server path/to" command');
        return;
      }

      let cmd = new Exec(
        Bin.node,
        this.scriptPath,
        'compile',
        'dev',
        dumpPath
      );

      cmd.run((result) => {
        if (result.failed) {
          console.error(result.error);
          this.exit(1);
        }

        console.info('Web app dependencies have been successfully initialized');
      }, true);
    });
  };

  let fetchRepository = (moduleContext, cb) => {
    createRegistry((registry) => {
      console.debug('Fetching microservice from DEEP repository');

      registry.installModule(
        moduleContext,
        dumpPath,
        cb,
        createProperty()
      );
    });
  };

  let registryConfig = RegistryConfig.create().refresh('registry', 'github');
  let registryBaseHost = this.opts.locate('registry').value ||
    registryConfig.read('registry') ||
    DEFAULT_REGISTRY_BASE_HOST;
  let gitHubAuthPair = this.opts.locate('github-auth').value || registryConfig.read('github');
  let initApp = this.opts.locate('init').exists;

  let depParts = parseDep();
  let depName = depParts[0];
  let depVersion = depParts[1];

  if (depName) {
    // @todo: remove on the next major release
    // the following code is here for back compatibility
    depName = depName.replace(/^(?:https?:\/\/)github\.com\/([^\/]+\/[^\/]+)(?:\.git)$/i, 'github://$1');
    depName = depName.replace(/^github:\/\/([^#]+)(#[\w\.]+)?$/, (_, _depRepo, _depVersion) => {
      let depName = path.basename(_depRepo.replace('/', path.sep));
      depName = depName.replace(/-microservices?/, '');
      depVersion = `github://${_depRepo}${_depVersion || '#*'}`;

      return depName;
    });

    fetchRepository(ModuleContext.create(depName, depVersion), (error) => {
      if (error) {
        console.error(error);
        this.exit(1);
      }

      console.info('The microservice \'' + depName + '\' has been successfully installed');

      initBackend();
    });
  } else {
    createRegistry((registry) => {
      console.debug('Ensure root microservice in place');

      let property = createProperty();

      property.assureFrontendEngine((error) => {
        if (error) {
          console.error('Error while assuring frontend engine: ' + error);
        }
        
        console.debug('Installing web app dependencies');

        registry.install(property, (error) => {
          if (error) {
            console.error(error);
            this.exit(1);
          }

          console.info('Web app dependencies have been successfully installed');

          initBackend();
        });
      });
    });
  }
};
