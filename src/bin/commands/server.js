#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(mainPath) {
  let path = require('path');
  let Server = require('../../lib.compiled/Server/Instance').Instance;
  let Config = require('deep-package-manager').Property_Config;
  let Property = require('deep-package-manager').Property_Instance;
  let Autoload = require('deep-package-manager').Microservice_Metadata_Autoload;
  let Exec = require('../../lib.compiled/Helpers/Exec').Exec;
  let Bin = require('../../lib.compiled/NodeJS/Bin').Bin;
  let fs = require('fs');
  let open = require('open');

  let port = this.opts.locate('port').value || '8000';
  let buildPath = this.opts.locate('build-path').value || null;
  let dbServer = this.opts.locate('db-server').value || 'LocalDynamo';
  let serverAddress = 'http://localhost:' + port;
  let openBrowser = this.opts.locate('open-browser').exists;
  let skipBackendBuild = this.opts.locate('skip-backend-build').exists;
  let skipFrontendBuild = this.opts.locate('skip-frontend-build').exists;

  // @todo: implement it in a better way
  if (skipFrontendBuild) {
    Autoload._skipBuild();
  }

  mainPath = this.normalizeInputPath(mainPath);

  if (buildPath) {
    buildPath = this.normalizeInputPath(buildPath);
  }

  let propertyConfigFile = path.join(mainPath, Config.DEFAULT_FILENAME);

  if (!fs.existsSync(propertyConfigFile)) {
    fs.writeFileSync(propertyConfigFile, JSON.stringify(Config.generate()));
  }

  let property = new Property(mainPath);

  if (skipBackendBuild) {
    property.assureFrontendEngine((error) => {
      if (error) {
        console.error('Error while assuring frontend engine: ' + error);
      }

      property.runInitMsHooks(() => {
        startServer(new Server(property));
      });
    });
  } else {
    let cmd = new Exec(
      Bin.node,
      this.scriptPath,
      'init-backend'
    );

    cmd.cwd = mainPath;

    cmd.run((result) => {
      if (result.failed) {
        console.error(result.error);
        this.exit(1);
      }

      startServer(new Server(property));
    }, true);
  }

  let startServer = (server) => {
    if (buildPath) {
      server.buildPath = buildPath;
    }

    server.listen(parseInt(port, 10), dbServer, () => {
      if (openBrowser) {
        open(serverAddress);
      }
    });
  };
};
