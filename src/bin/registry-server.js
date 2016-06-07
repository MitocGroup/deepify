#!/usr/bin/env node
/**
 * Created by AlexanderC on 2/23/16.
 */

var input = process.argv;
input.shift();
input.shift();

var RegistryServer = require('deep-package-manager').Registry_Local_Server;
var path = require('path');

var serverPath = path.join(process.cwd(), '.deepRegistry');

if (input.length > 0) {
  serverPath = input[0];

  if (serverPath.indexOf(path.sep) !== 0) {
    serverPath = path.join(process.cwd(), serverPath);
  }
}

var server = new RegistryServer(serverPath);

server.start(function(error) {
  if (error) {
    console.error(error);
    process.exit(1);
  }

  console.debug('--->', RegistryServer.DEFAULT_REGISTRY_HOST);
  console.info('\nPress Ctrl-C to stop the server');
});

process.on('uncaughtException', function(error) {
  server.stop();
  console.error(error);
  process.exit(1);
});

process.on('SIGINT', function() {
  server.stop();
});
