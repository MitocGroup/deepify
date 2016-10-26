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
  let path = require('path');

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
    let serverPort = sslConnection ? port + 1 : port;
    
    server.listen(serverPort, dbServer, () => {
      if (openBrowser) {
        open(serverAddress);
      }
      
      if (sslConnection) {
        
        // @todo start it natively
        let sslProxyBinary = path.join(
          __dirname, 
          '..', 
          '..', 
          'node_modules', 
          'local-ssl-proxy', 
          'bin', 
          'local-ssl-proxy'
        );
        
        let cmd = new Exec(Bin.node, sslProxyBinary);
        
        cmd.addArg(`--source=${port}`);
        cmd.addArg(`--target=${serverPort}`);
        
        cmd.avoidBufferOverflow().run(result => {
          if (result.failed) {
            console.error(result.error);
            this.exit(1);
          }
        });
      }
    });
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
