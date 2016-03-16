#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(mainPath) {
  var path = require('path');
  var Server = require('../../lib.compiled/Server/Instance').Instance;
  var Config = require('deep-package-manager').Property_Config;
  var Property = require('deep-package-manager').Property_Instance;
  var Autoload = require('deep-package-manager').Microservice_Metadata_Autoload;
  var Exec = require('../../lib.compiled/Helpers/Exec').Exec;
  var Bin = require('../../lib.compiled/NodeJS/Bin').Bin;
  var fs = require('fs');
  var open = require('open');

  var port = this.opts.locate('port').value || '8000';
  var buildPath = this.opts.locate('build-path').value || null;
  var dbServer = this.opts.locate('db-server').value || 'LocalDynamo';
  var serverAddress = 'http://localhost:' + port;
  var openBrowser = this.opts.locate('open-browser').exists;
  var skipBackendBuild = this.opts.locate('skip-backend-build').exists;
  var skipFrontendBuild = this.opts.locate('skip-frontend-build').exists;

  // @todo: implement it in a better way
  if (skipFrontendBuild) {
    Autoload._skipBuild();
  }

  mainPath = this.normalizeInputPath(mainPath);

  if (buildPath) {
    buildPath = this.normalizeInputPath(buildPath);
  }

  var propertyConfigFile = path.join(mainPath, Config.DEFAULT_FILENAME);

  if (!fs.existsSync(propertyConfigFile)) {
    fs.writeFileSync(propertyConfigFile, JSON.stringify(Config.generate()));
  }

  var property = new Property(mainPath);

  if (skipBackendBuild) {
    property.assureFrontendEngine(function(error) {
      if (error) {
        console.error('Error while assuring frontend engine: ' + error);
      }

      property.runInitMsHooks(function() {
        startServer(new Server(property));
      }.bind(this));
    }.bind(this));
  } else {
    var cmd = new Exec(
      Bin.node,
      this.scriptPath,
      'init-backend'
    );

    cmd.cwd = mainPath;

    cmd.run(function(result) {
      if (result.failed) {
        console.error(result.error);
        this.exit(1);
      }

      startServer(new Server(property));
    }.bind(this), true);
  }

  function startServer(server) {
    if (buildPath) {
      server.buildPath = buildPath;
    }

    server.listen(parseInt(port, 10), dbServer, function() {
      if (openBrowser) {
        open(serverAddress);
      }
    }.bind(this));
  }
};
