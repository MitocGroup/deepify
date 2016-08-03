#!/usr/bin/env node
/**
 * Created by AlexanderC on 08/07/15.
 */

'use strict';

let Program = require('../lib.compiled/Terminal/Program').Program;
let ValidationException = require('../lib.compiled/Terminal/Exception/ValidationException').ValidationException;
let path = require('path');

let manifest = require('./manifest');
let cli = new Program('deepify', manifest.version, manifest.description);

/**
 * @param {String} name
 * @returns {string}
 */
function escapeCmdName(name) {
  return name.replace(/[^a-zA-Z0-9_\-]/g, '-');
}

/**
 *
 */
function printHelpAction() {
  this.help.print();

  this.exit(0);
}

/**
 * @param {Object} cmdObj
 * @param {Object} cmdManifest
 */
function registerCommandOpts(cmdObj, cmdManifest) {
  for (let optName in cmdManifest.opts) {
    if (!cmdManifest.opts.hasOwnProperty(optName)) {
      continue;
    }

    let optData = cmdManifest.opts[optName];

    cmdObj.opts.create(optName, optData.alias, optData.description, optData.required);
  }
}

/**
 * @param {Program} cmdObj
 * @param {Object} cmdManifest
 */
function registerCommandArgs(cmdObj, cmdManifest) {
  for (let argName in cmdManifest.args) {
    if (!cmdManifest.args.hasOwnProperty(argName)) {
      continue;
    }

    let argData = cmdManifest.args[argName];

    cmdObj.args.create(argName, argData.description, argData.required);
  }
}

/**
 * @param {Program} programObj
 * @param {Object} programManifest
 */
function registerCommands(programObj, programManifest) {
  for (let cmdName in programManifest.commands) {
    if (!programManifest.commands.hasOwnProperty(cmdName)) {
      continue;
    }

    let cmdManifest = programManifest.commands[cmdName];
    let cmdDesc = cmdManifest.description;
    let cmdEx = cmdManifest.example;
    let cmdSection = cmdManifest.section;
    let cmdSubCommands = cmdManifest.commands;
    let requirePath = cmdManifest.actionPath ||
      (`./${path.join(programManifest.commandsPath, escapeCmdName(cmdName))}`);
    let cmdAction = cmdSubCommands ? printHelpAction : require(requirePath);

    let cmd = programObj.command(
      cmdName,
      cmdAction,
      cmdDesc,
      cmdEx,
      cmdSection
    );

    registerCommandOpts(cmd, cmdManifest);
    registerCommandArgs(cmd, cmdManifest);

    if (cmdSubCommands) {
      registerCommands(cmd, cmdManifest);
    }

    cmd.defaults();
  }
}

registerCommands(cli, manifest);

try {
  cli.defaults().run();
} catch (e) {
  if (e instanceof ValidationException) {
    console.error('Invalid command call: [' + e.constructor.name + ']', e.message);
    console.info('Usage example: ' + e.program.example);
    process.exit(1);
  }

  throw e;
}
