#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(mainPath) {
  let Server = require('../../lib.compiled/Server/Instance').Instance;
  let Property = require('deep-package-manager').Property_Instance;
  let Autoload = require('deep-package-manager').Microservice_Metadata_Autoload;
  let Exec = require('../../lib.compiled/Helpers/Exec').Exec;
  let Bin = require('../../lib.compiled/NodeJS/Bin').Bin;
  let open = require('open');

  let sslConnection = this.opts.locate('secure').exists;
  let port = parseInt(this.opts.locate('port').value, 10) || 8000;
  let dbServer = this.opts.locate('db-server').value || 'LocalDynamo';
  let openBrowser = this.opts.locate('open-browser').exists;
  let skipBackendBuild = this.opts.locate('skip-backend-build').exists;
  let skipFrontendBuild = this.opts.locate('skip-frontend-build').exists;

  // @todo: implement it in a better way
  if (skipFrontendBuild) {
    Autoload._skipBuild();
  }

  mainPath = this.normalizeInputPath(mainPath);

  let startServer = (server) => {
    let serverAddress = `http${sslConnection ? 's' : ''}://localhost:${port}`;
    
    server.listen(port, dbServer, () => {
      if (openBrowser) {
        open(serverAddress);
      }
    }, sslConnection);
  };

  let compileDevCmd = () => {
    let cmd = new Exec(
      Bin.node,
      this.scriptPath,
      'compile',
      'dev'
    );

    cmd.cwd = mainPath;

    if (skipBackendBuild) {
      cmd.addArg('--skip-install');
    }

    return cmd;
  };

  let property = Property.create(mainPath);

  compileDevCmd().run((result) => {
    if (result.failed) {
      console.error(result.error);
      this.exit(1);
    }

    startServer(new Server(property));
  }, true);
};
