#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(dependency, dumpPath) {

  // @todo: move it in some json config?
  let DEFAULT_REGISTRY_BASE_HOST = 'https://deep.mg';

  let GitHubDependency = require('deep-package-manager').Registry_GitHub_Dependency;
  let AuthToken = require('../../lib.compiled/Registry/AuthToken').AuthToken;
  let RegistryConfig = require('../../lib.compiled/Registry/Config').Config;
  let Property = require('deep-package-manager').Property_Instance;
  let PropertyConfig = require('deep-package-manager').Property_Config;
  let Registry = require('deep-package-manager').Registry_Registry;
  let RegistryAuthorizer = require('deep-package-manager').Registry_Storage_Driver_Helpers_Api_Auth_Authorizer;
  let Bin = require('../../lib.compiled/NodeJS/Bin').Bin;
  let Exec = require('../../lib.compiled/Helpers/Exec').Exec;
  let Microservice = require('deep-package-manager').Microservice_Instance;
  let path = require('path');

  let createProperty = () => Property.create(workingDirectory, PropertyConfig.DEFAULT_FILENAME);
  let getRegistryToken = () => new AuthToken().refresh().toString();

  let createRegistry = (cb) => {
    console.log('Initializing remote registry');

    Registry.createApiRegistry(registryBaseHost, (error, registry) => {
      if (error) {
        console.error(error);
        this.exit(1);
      }

      registry.storage.driver.authorizer = RegistryAuthorizer.createHeaderToken(getRegistryToken());

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

  let initBackend = () => {
    if (!initApp) {
      return;
    }

    console.log('Start initializing backend');

    npmInstall('"babel-cli@^6.x.x"', (error) => {
      if (error) {
        console.error('Error while installing babel: ' + error);
        this.exit(1);
      }

      //@todo - temporary workaround for FATAL ERROR- JS Allocation failed – process out of memory
      if(/^win/.test(process.platform)) {
        console.warn('The web application was successfully installed on Windows!\n');
        console.info('To initialize backend use "deepify init-backend path/to" command');
        console.info('To run local development server use "deepify server path/to" command');
        return;
      }

      let cmd = new Exec(
        Bin.node,
        this.scriptPath,
        'compile',
        'dev',
        workingDirectory
      );

      cmd.run((result) => {
        if (result.failed) {
          console.error(result.error);
          this.exit(1);
        }

        console.log('Wep app dependencies have been successfully initialized');
      }, true);
    });
  };

  let fetchGitHub = (cb) => {
    console.log('Fetching microservice from GitHub');

    let depObj = new GitHubDependency(depName, depVersion);

    // @todo: move logic into GitHubDependency?
    if (gitHubAuthPair) {
      let gitHubCred = gitHubAuthPair.split(':');

      if (gitHubCred.length === 1) {

        // @todo: read git user followed by this fallback?
        gitHubCred.unshift(depObj.repositoryUser);
      }

      depObj.auth(gitHubCred[0], gitHubCred[1]);
    }

    let localDumpPath = path.join(dumpPath || workingDirectory, depObj.shortDependencyName);

    depObj.extract(
      localDumpPath,
      (error) => {
        if (error) {
          console.error(error);
          this.exit(1);
        }

        let microservice = Microservice.create(localDumpPath);
        let deps = microservice.config.dependencies;

        if (deps && Object.keys(deps).length > 0) {
          createRegistry((registry) => {
            console.log('Installing \'' + depObj.shortDependencyName + '\' dependencies');

            registry.install(createProperty(), (error) => {
              if (error) {
                console.error(error);
                this.exit(1);
              }

              cb();
            }, [microservice.identifier]);
          });
        } else {
          cb();
        }
      }
    );
  };

  let fetchRepository = (cb) => {
    createRegistry((registry) => {
      console.log('Fetching microservice from DEEP repository');

      registry.installModule(
        depName,
        depVersion,
        workingDirectory,
        cb,
        createProperty()
      );
    });
  };

  let npmInstall = (repo, cb) => {
    console.log('Installing ' + repo + ' via NPM globally');

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

  let registryBaseHost = this.opts.locate('registry').value ||
    RegistryConfig.create().refresh('registry').read('registry') ||
    DEFAULT_REGISTRY_BASE_HOST;
  
  let workingDirectory = process.cwd();
  let gitHubAuthPair = this.opts.locate('github-auth').value;
  let initApp = this.opts.locate('init').exists;
  let depParts = parseDep();
  let depName = depParts[0];
  let depVersion = depParts[1];

  if (dumpPath) {
    dumpPath = this.normalizeInputPath(dumpPath);
  }

  if (depName) {

    // @todo: remove on the next major release
    // the following code is here for back compatibility
    depName = depName.replace(/^(?:https?:\/\/)github\.com\/([^\/]+\/[^\/]+)(?:\.git)$/i, 'github://$1');

    let fetcher = GitHubDependency.isGitHubDependency(depName) ? fetchGitHub : fetchRepository;

    fetcher((error) => {
      if (error) {
        console.error(error);
        this.exit(1);
      }

      console.log('The microservice \'' + depName + '\' has been successfully installed');

      initBackend();
    });
  } else {
    createRegistry((registry) => {
      console.log('Installing web app dependencies');

      registry.install(createProperty(), (error) => {
        if (error) {
          console.error(error);
          this.exit(1);
        }

        console.log('Wep app dependencies have been successfully installed');

        initBackend();
      });
    });
  }
};
