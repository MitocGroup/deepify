/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

import {Options} from './Options';
import {Arguments} from './Arguments';
import {Argument} from './Argument';
import {ProgramInstanceRequiredException} from './Exception/ProgramInstanceRequiredException';
import {Help} from './Help';
import {InvalidActionException} from './Exception/InvalidActionException';
import {UnknownOptionException} from './Exception/UnknownOptionException';
import {ValidationException} from './Exception/ValidationException';
import DeepLog from 'deep-log';
import path from 'path';
import os from 'os';

export class Program {
  /**
   * @param {String} name
   * @param {String} version
   * @param {String} description
   * @param {String} example
   */
  constructor(name = null, version = null, description = null, example = null) {
    this._name = name;
    this._version = version;
    this._example = example;
    this._description = description;
    this._commands = [];
    this._inputParsed = false;
    this._unmanagedArgs = [];
    this._action = function() {};

    this._opts = new Options();
    this._args = new Arguments();

    this._nodeBinary = Program.NODE_BINARY;
    this._scriptPath = null;
  }

  /**
   * @returns {String}
   */
  get nodeBinary() {
    return this._nodeBinary;
  }

  /**
   * @returns {String|null}
   */
  get scriptPath() {
    return this._scriptPath;
  }

  /**
   * @param {Program} program
   * @returns {Program}
   */
  inherit(program) {
    this._opts.merge(program.opts);
    this._args.merge(program.args);

    if (!this.hasCommands) {
      this._args.remove('command');
    }

    this._nodeBinary = program.nodeBinary;
    this._scriptPath = this._scriptPath || program.scriptPath;
    this._version = this._version || program.version;

    this.input([].concat(program.unmanagedArgs));

    return this;
  }

  /**
   * @param {Array} args
   * @returns {Program}
   */
  input(args = null) {
    if (args === null) {
      args = process.argv;

      // @todo: do we have to hook here?
      this._nodeBinary = args.shift(); // remove 'node'
      this._scriptPath = args.shift(); // remove 'path/to/main/script.js'

      Options.normalizeInputOpts(args);
    }

    this._opts.populate(args);
    this._args.populate(args);

    this._unmanagedArgs = args;
    this._inputParsed = true;

    this._args.populateUnmanaged(args);

    return this;
  }

  /**
   * @returns {Program}
   */
  defaults() {
    this._opts.create('cmd-auto-complete', null, 'Used by bash auto completion', false, true);
    this._opts.create('version', 'v', 'Prints command version');
    this._opts.create('help', 'h', 'Prints command help');

    if (this.hasCommands) {
      this._args.create('command', 'Command to run');
    }

    return this;
  }

  /**
   * @returns {Program}
   * @private
   */
  _validateInput() {
    try {
      this.args.validate();
      this.opts.validate();
    } catch (e) {
      if (e instanceof ValidationException) {
        e.program = this;
      }

      throw e;
    }

    if (this._unmanagedArgs.length > 0) {
      let opts = [];

      for (let i in this._unmanagedArgs) {
        if (!this._unmanagedArgs.hasOwnProperty(i)) {
          continue;
        }

        let item = this._unmanagedArgs[i];

        if (!Argument._matchNonOption(item)) {
          opts.push(item);
        }
      }

      // @todo: remove this hook?
      let error = new UnknownOptionException(...opts);
      error.program = this;

      throw error;
    }

    return this;
  }

  /**
   * @param {Array} args
   */
  run(args = null) {
    Program._logDriver.overrideJsConsole(false);

    if (args || !this._inputParsed) {
      this.input(args);
    }

    let showAutoCompletion = this._opts.locate('cmd-auto-complete');
    let version = this._opts.locate('version');
    let help = this._opts.locate('help');
    let command = this._args.locate('command');

    // @todo: add it for commands as well
    if (showAutoCompletion && showAutoCompletion.exists) {
      Program._logDriver.overrideJsConsole(false, false);

      this.help.printAutoCompletion(
        (this.hasCommands && command) ? command.value : ''
      );

      this.exit(0);
    }

    if (this.hasCommands && command && command.exists) {
      let subProgram = this.getCommand(command.value);

      if (!subProgram) {
        console.log('');
        console.error(`No such command '${command.value}' found!`);
        this._outputListCommands();

        this.exit(1);
      }

      subProgram.inherit(this).run();

      return;
    }

    if (help.exists) {
      this.help.print();

      this.exit(0);
    } else if (version.exists) {
      console.log(this.version);

      this.exit(0);
    } else if (this.hasCommands && command && !command.exists) {
      this.help.print();

      this.exit(1);
    }

    this._validateInput();

    try {
      Program._logDriver.overrideJsConsole();

      this._action.bind(this)(...this._args.listValues());
    } catch (e) {
      console.error(e.message);
      console.error(e.stack);

      this.exit(1);
    }
  }

  /**
   * @param {Number} code
   */
  exit(code) {
    process.exit(parseInt(code, 10));
  }

  /**
   * @returns {Program}
   * @private
   */
  _outputListCommands() {
    console.log('');
    console.log('Available commands:');
    console.log('');

    for (let i in this._commands) {
      if (!this._commands.hasOwnProperty(i)) {
        continue;
      }

      let command = this._commands[i];

      console.log(`   ${command.name} - ${command.description}`);
    }

    console.log('');

    return this;
  }

  /**
   * @param name
   * @returns {*}
   */
  getCommand(name) {
    for (let i in this._commands) {
      if (!this._commands.hasOwnProperty(i)) {
        continue;
      }

      let command = this._commands[i];

      if (command.name === name) {
        return command;
      }
    }

    return null;
  }

  /**
   * @param {String} name
   * @param {Function} action
   * @param {String} description
   * @param {String} example
   * @param {String} version
   * @returns {Program}
   */
  command(name, action, description = null, example = null, version = null) {
    let subProgram = new Program(name, version, description, example);
    subProgram.action = action;

    this._commands.push(subProgram);

    return subProgram;
  }

  /**
   * @param {Program} subProgram
   * @returns {Program}
   */
  addCommand(subProgram) {
    if (!(subProgram instanceof Program)) {
      throw new ProgramInstanceRequiredException();
    }

    this._commands.push(subProgram);

    return this;
  }

  /**
   * @returns {Array}
   */
  get unmanagedArgs() {
    return this._unmanagedArgs;
  }

  /**
   * @param {Function} func
   */
  set action(func) {
    if (typeof func !== 'function') {
      throw new InvalidActionException();
    }

    this._action = func;
  }

  /**
   * @returns {Function}
   */
  get action() {
    return this._action;
  }

  /**
   * @returns {Boolean}
   */
  get hasCommands() {
    return this._commands.length > 0;
  }

  /**
   * @returns {Help}
   */
  get help() {
    return new Help(this);
  }

  /**
   * @returns {Boolean}
   */
  get inputParsed() {
    return this._inputParsed;
  }

  /**
   * @returns {Array}
   */
  get commands() {
    return this._commands;
  }

  /**
   * @returns {Options}
   */
  get opts() {
    return this._opts;
  }

  /**
   * @returns {Arguments}
   */
  get args() {
    return this._args;
  }

  /**
   * @returns {String}
   */
  get example() {
    return this._example;
  }

  /**
   * @param {String} value
   */
  set example(value) {
    this._example = value;
  }

  /**
   * @returns {String}
   */
  get name() {
    return this._name;
  }

  /**
   * @param {String} value
   */
  set name(value) {
    this._name = value;
  }

  /**
   * @returns {String}
   */
  get version() {
    return this._version;
  }

  /**
   * @param {String} value
   */
  set version(value) {
    this._version = value;
  }

  /**
   * @returns {String}
   */
  get description() {
    return this._description;
  }

  /**
   * @param {String} value
   */
  set description(value) {
    this._description = value;
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get NODE_BINARY() {
    return 'node';
  }

  /**
   * @returns {DeepLog}
   * @private
   */
  static get _logDriver() {
    if (!Program.hasOwnProperty('__deep_log')) {
      Program.__deep_log = new DeepLog();
    }

    return Program.__deep_log;
  }

  /**
   * @returns {String}
   * @private
   */
  get _homeDir() {
    if (os.homedir) {
      return os.homedir();
    }

    return process.env.HOME || path.sep;
  }

  /**
   * @param {String} inputPath
   * @returns {String}
   */
  normalizeInputPath(inputPath) {

    // set current working directory if empty or no path provided
    inputPath = inputPath || process.cwd();

    // case some unresolved bash pwd
    inputPath = inputPath.replace(/(`\s*pwd\s*`|\$\(\s*pwd\s*\))/ig, process.cwd());

    // case tilda used (both ~ and ~/xxx cases)
    if (/^~(?:(?:\/|\\).+)?$/i.test(inputPath)) {
      inputPath = path.join(this._homeDir, (inputPath && inputPath.length >= 2) ? inputPath.substr(2) : '');
    }

    // case relative path provided
    // check for windows full path like c:/xxx to avoid transformation
    if (!/^(?:\/|\\)/i.test(inputPath) &&
      !(/^win/.test(process.platform) && /^[a-z]:(?:\/|\\)/i.test(inputPath))) {

      inputPath = path.join(process.cwd(), inputPath);
    }

    return path.resolve(inputPath);
  }
}
