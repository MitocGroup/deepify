/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var _bind = Function.prototype.bind;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _Options = require('./Options');

var _Arguments = require('./Arguments');

var _Argument = require('./Argument');

var _ExceptionProgramInstanceRequiredException = require('./Exception/ProgramInstanceRequiredException');

var _Help = require('./Help');

var _ExceptionInvalidActionException = require('./Exception/InvalidActionException');

var _ExceptionUnknownOptionException = require('./Exception/UnknownOptionException');

var _ExceptionValidationException = require('./Exception/ValidationException');

var Program = (function () {
  /**
   * @param {String} name
   * @param {String} version
   * @param {String} description
   * @param {String} example
   */

  function Program() {
    var name = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
    var version = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
    var description = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];
    var example = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];

    _classCallCheck(this, Program);

    this._name = name;
    this._version = version;
    this._example = example;
    this._description = description;
    this._commands = [];
    this._inputParsed = false;
    this._unmanagedArgs = [];
    this._action = function () {};

    this._opts = new _Options.Options();
    this._args = new _Arguments.Arguments();
  }

  /**
   * @param {Program} program
   * @returns {Program}
   */

  _createClass(Program, [{
    key: 'inherit',
    value: function inherit(program) {
      this._args.merge(program.args);
      this._opts.merge(program.opts);

      if (!this.hasCommands) {
        this._args.remove('command');
      }

      this._version = this._version || program.version;

      this.input(program.unmanagedArgs);

      return this;
    }

    /**
     * @param {Array} args
     * @returns {Program}
     */
  }, {
    key: 'input',
    value: function input() {
      var args = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

      if (!args) {
        args = process.argv;

        // @todo: do we have to hook here?
        args.shift(); // remove 'node'
        args.shift(); // remove 'path/to/main/script.js'
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
  }, {
    key: 'defaults',
    value: function defaults() {
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
  }, {
    key: '_validateInput',
    value: function _validateInput() {
      try {
        this.args.validate();
        this.opts.validate();
      } catch (e) {
        if (e instanceof _ExceptionValidationException.ValidationException) {
          e.program = this;
        }

        throw e;
      }

      if (this._unmanagedArgs.length > 0) {
        var opts = [];

        for (var i in this._unmanagedArgs) {
          if (!this._unmanagedArgs.hasOwnProperty(i)) {
            continue;
          }

          var item = this._unmanagedArgs[i];

          if (!_Argument.Argument._matchNonOption(item)) {
            opts.push(item);
          }
        }

        // @todo: remove this hook?
        var error = new (_bind.apply(_ExceptionUnknownOptionException.UnknownOptionException, [null].concat(opts)))();
        error.program = this;

        throw error;
      }

      return this;
    }

    /**
     * @param {Array} args
     */
  }, {
    key: 'run',
    value: function run() {
      var args = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

      if (args || !this._inputParsed) {
        this.input(args);
      }

      var version = this._opts.locate('version');
      var help = this._opts.locate('help');
      var command = this._args.locate('command');

      if (this.hasCommands && command && command.exists) {
        var subProgram = this.getCommand(command.value);

        if (!subProgram) {
          console.log('');
          console.log('No such command \'' + command.value + '\' found!');
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
        this._action.bind(this).apply(undefined, _toConsumableArray(this._args.listValues()));
      } catch (e) {
        console.log(e.message);
        console.log(e.stack);

        this.exit(1);
      }
    }

    /**
     * @param {Number} code
     */
  }, {
    key: 'exit',
    value: function exit(code) {
      process.exit(parseInt(code, 10));
    }

    /**
     * @returns {Program}
     * @private
     */
  }, {
    key: '_outputListCommands',
    value: function _outputListCommands() {
      console.log('');
      console.log('Available commands:');
      console.log('');

      for (var i in this._commands) {
        if (!this._commands.hasOwnProperty(i)) {
          continue;
        }

        var command = this._commands[i];

        console.log('   ' + command.name + ' - ' + command.description);
      }

      console.log('');

      return this;
    }

    /**
     * @param name
     * @returns {*}
     */
  }, {
    key: 'getCommand',
    value: function getCommand(name) {
      for (var i in this._commands) {
        if (!this._commands.hasOwnProperty(i)) {
          continue;
        }

        var command = this._commands[i];

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
  }, {
    key: 'command',
    value: function command(name, action) {
      var description = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];
      var example = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];
      var version = arguments.length <= 4 || arguments[4] === undefined ? null : arguments[4];

      var subProgram = new Program(name, version, description, example);
      subProgram.action = action;

      this._commands.push(subProgram);

      return subProgram;
    }

    /**
     * @param {Program} subProgram
     * @returns {Program}
     */
  }, {
    key: 'addCommand',
    value: function addCommand(subProgram) {
      if (!subProgram instanceof Program) {
        throw new _ExceptionProgramInstanceRequiredException.ProgramInstanceRequiredException();
      }

      this._commands.push(subProgram);

      return this;
    }

    /**
     * @returns {Array}
     */
  }, {
    key: 'unmanagedArgs',
    get: function get() {
      return this._unmanagedArgs;
    }

    /**
     * @param {Function} func
     */
  }, {
    key: 'action',
    set: function set(func) {
      if (typeof func !== 'function') {
        throw new _ExceptionInvalidActionException.InvalidActionException();
      }

      this._action = func;
    },

    /**
     * @returns {Function}
     */
    get: function get() {
      return this._action;
    }

    /**
     * @returns {Boolean}
     */
  }, {
    key: 'hasCommands',
    get: function get() {
      return this._commands.length > 0;
    }

    /**
     * @returns {Help}
     */
  }, {
    key: 'help',
    get: function get() {
      return new _Help.Help(this);
    }

    /**
     * @returns {Boolean}
     */
  }, {
    key: 'inputParsed',
    get: function get() {
      return this._inputParsed;
    }

    /**
     * @returns {Array}
     */
  }, {
    key: 'commands',
    get: function get() {
      return this._commands;
    }

    /**
     * @returns {Options}
     */
  }, {
    key: 'opts',
    get: function get() {
      return this._opts;
    }

    /**
     * @returns {Arguments}
     */
  }, {
    key: 'args',
    get: function get() {
      return this._args;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'example',
    get: function get() {
      return this._example;
    },

    /**
     * @param {String} value
     */
    set: function set(value) {
      this._example = value;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'name',
    get: function get() {
      return this._name;
    },

    /**
     * @param {String} value
     */
    set: function set(value) {
      this._name = value;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'version',
    get: function get() {
      return this._version;
    },

    /**
     * @param {String} value
     */
    set: function set(value) {
      this._version = value;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'description',
    get: function get() {
      return this._description;
    },

    /**
     * @param {String} value
     */
    set: function set(value) {
      this._description = value;
    }
  }]);

  return Program;
})();

exports.Program = Program;