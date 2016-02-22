#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(dependency) {

  // @todo: move it in some json config?
  var DEFAULT_REGISTRY_BASE_HOST = 'https://deep.mg';

  var GitHubDependency = require('deep-package-manager').Registry_GitHub_Dependency;
  var AuthToken = require('../../lib.compiled/Registry/AuthToken').AuthToken;
  var RegistryConfig = require('../../lib.compiled/Registry/Config').Config;
  var Property = require('deep-package-manager').Property_Instance;
  var PropertyConfig = require('deep-package-manager').Property_Config;
  var Registry = require('deep-package-manager').Registry_Registry;
  var RegistryAuthorizer = require('deep-package-manager').Registry_Storage_Driver_Helpers_Api_Auth_Authorizer;
  var Bin = require('../../lib.compiled/NodeJS/Bin').Bin;
  var Exec = require('../../lib.compiled/Helpers/Exec').Exec;
  var Microservice = require('deep-package-manager').Microservice_Instance;
  var path = require('path');

  var registryBaseHost = this.opts.locate('registry').value ||
    RegistryConfig.create().refresh('registry').read('registry') ||
    DEFAULT_REGISTRY_BASE_HOST;

  var workingDirectory = process.cwd();
  var skipGitHubDeps = this.opts.locate('skip-github-deps').exists;
  var initApp = this.opts.locate('init').exists;
  var depParts = parseDep();
  var depName = depParts[0];
  var depVersion = depParts[1];

  if (depName) {
    var fetcher = GitHubDependency.isGitHubDependency(depName) ? fetchGitHub : fetchRepository;

    fetcher.bind(this)(function(error) {
      if (error) {
        console.error(error);
        this.exit(1);
      }

      console.log('The microservice \'' + depName + '\' has been successfully installed');

      initBackend.bind(this)();
    }.bind(this));
  } else {
    createRegistry.bind(this)(function(registry) {
      console.log('Installing web app dependencies');

      registry.install(createProperty(), function(error) {
        if (error) {
          console.error(error);
          this.exit(1);
        }

        console.log('Wep app dependencies have been successfully installed');

        initBackend.bind(this)();
      }.bind(this));
    }.bind(this));
  }

  function createProperty() {
    return Property.create(workingDirectory, PropertyConfig.DEFAULT_FILENAME);
  }

  function getRegistryToken() {
    return (new AuthToken()).refresh().toString();
  }

  function createRegistry(cb) {
    console.log('Initializing remote registry');

    Registry.createApiRegistry(registryBaseHost, function(error, registry) {
      if (error) {
        console.error(error);
        this.exit(1);
      }

      registry.storage.driver.authorizer = RegistryAuthorizer.createHeaderToken(getRegistryToken());

      cb(registry);
    }.bind(this), true);
  }

  function parseDep() {
    var parts = (dependency || '').split('@');

    if (parts.length <= 1) {
      return [parts[0], '*'];
    }

    return [parts[0], parts[1]];
  }

  function initBackend() {
    if (!initApp) {
      return;
    }

    console.log('Start initializing backend');

    npmInstall('"babel@^5.x.x"', function(error) {
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

      var cmd = new Exec(
        Bin.node,
        this.scriptPath,
        'init-backend',
        workingDirectory
      );

      cmd.run(function(result) {
        if (result.failed) {
          console.error(result.error);
          this.exit(1);
        }

        console.log('Wep app dependencies have been successfully initialized');
      }.bind(this), true);
    }.bind(this));
  }

  function fetchGitHub(cb) {
    console.log('Fetching microservice from GitHub');

    var depObj = new GitHubDependency(depName, depVersion);
    var dumpPath = path.join(workingDirectory, depObj.shortDependencyName);

    depObj.extract(
      dumpPath,
      function(error) {
        if (error) {
          console.error(error);
          this.exit(1);
        }

        if (skipGitHubDeps) {
          cb.bind(this)();
          return;
        }

        var microservice = Microservice.create(dumpPath);

        createRegistry.bind(this)(function(registry) {
          console.log('Installing \'' + depObj.shortDependencyName + '\' dependencies');

          registry.install(createProperty(), function(error) {
            if (error) {
              console.error(error);
              this.exit(1);
            }

            cb.bind(this)();
          }.bind(this), [microservice.identifier]);
        }.bind(this));
      }.bind(this)
    );
  }

  function fetchRepository(cb) {
    createRegistry.bind(this)(function(registry) {
      console.log('Fetching microservice from DEEP repository');

      registry.installModule(
        depName,
        depVersion,
        workingDirectory,
        cb.bind(this),
        createProperty.bind(this)()
      );
    }.bind(this));
  }

  function npmInstall(repo, cb) {
    console.log('Installing ' + repo + ' via NPM globally');

    new Exec('npm list -g --depth 0 ' + repo + ' || npm install -g ' + repo)
      .avoidBufferOverflow()
      .run(function(result) {
        if (result.failed) {
          console.error('Error installing ' + repo + ' globally: ' + result.error);

          cb(result.error);
          return;
        }

        cb(null);
      }.bind(this));
  }
};
