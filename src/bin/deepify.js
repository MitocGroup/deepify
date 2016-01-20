#!/usr/bin/env node
/**
 * Created by AlexanderC on 08/07/15.
 */

'use strict';

var Program = require('../lib.compiled/Terminal/Program').Program;
var ValidationException = require('../lib.compiled/Terminal/Exception/ValidationException').ValidationException;
var path = require('path');

var manifest = require('./manifest');

var cli = new Program('deepify', manifest.version, manifest.description);

for (var cmdName in manifest.commands) {
  if (!manifest.commands.hasOwnProperty(cmdName)) {
    continue;
  }

  var cmdData = manifest.commands[cmdName];
  var cmdDesc = cmdData.description;
  var cmdEx = cmdData.example;

  var cmd = cli.command(
    cmdName,
    require('./' + path.join(manifest.commandsPath, cmdName)),
    cmdDesc,
    cmdEx
  );

  for (var optName in cmdData.opts) {
    if (!cmdData.opts.hasOwnProperty(optName)) {
      continue;
    }

    var optData = cmdData.opts[optName];

    cmd.opts
      .create(optName, optData.alias, optData.description, optData.required);
  }

  for (var argName in cmdData.args) {
    if (!cmdData.args.hasOwnProperty(argName)) {
      continue;
    }

    var argData = cmdData.args[argName];

    cmd.args
      .create(argName, argData.description, argData.required);
  }
}

try {
  cli.defaults().run();
} catch (e) {
  if (e instanceof ValidationException) {
    console.error('Invalid command call: [' + e.constructor.name + ']', e.message);
    console.log('Usage example: ' + e.program.example);
    process.exit(1);
  }

  throw e;
}
