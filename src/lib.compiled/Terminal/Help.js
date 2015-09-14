/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _Program = require('./Program');

var _ExceptionProgramInstanceRequiredException = require('./Exception/ProgramInstanceRequiredException');

var Help = (function () {
  /**
   * @param {Program} program
   */

  function Help(program) {
    _classCallCheck(this, Help);

    this._program = program;

    if (!program instanceof _Program.Program) {
      throw new _ExceptionProgramInstanceRequiredException.ProgramInstanceRequiredException();
    }
  }

  /**
   * @returns {Program}
   */

  _createClass(Help, [{
    key: 'print',

    /**
     * @returns {Help}
     */
    value: function print() {
      this._printHead()._printExample()._printArgs()._printCommands();

      return this;
    }

    /**
     * @returns {Help}
     * @private
     */
  }, {
    key: '_printCommands',
    value: function _printCommands() {
      if (this._program.hasCommands) {
        var commands = this._program.commands;

        console.log('Available commands: ');

        for (var i in commands) {
          if (!commands.hasOwnProperty(i)) {
            continue;
          }

          var cmd = commands[i];

          console.log('   ' + cmd.name + ': ' + Help._stringify(cmd.description));
        }
      }

      console.log('');

      return this;
    }

    /**
     * @returns {Help}
     * @private
     */
  }, {
    key: '_printOpts',
    value: function _printOpts() {
      var opts = this._program.opts.list();

      console.log('Options:', opts.length <= 0 ? 'None' : '');

      if (opts.length > 0) {
        for (var i in opts) {
          if (!opts.hasOwnProperty(i)) {
            continue;
          }

          var opt = opts[i];

          var add = '';

          if (opt.alias) {
            add = '|-' + opt.alias;
          }

          console.log('   --' + opt.name + add + ': ' + Help._stringify(opt.description));
        }

        console.log('');
      }

      return this;
    }

    /**
     * @returns {Help}
     * @private
     */
  }, {
    key: '_printArgs',
    value: function _printArgs() {
      var args = this._program.args.list();

      console.log('Arguments:', args.length <= 0 ? 'None' : '');

      if (args.length > 0) {
        for (var i in args) {
          if (!args.hasOwnProperty(i)) {
            continue;
          }

          var arg = args[i];

          console.log('   ' + Help._stringify(arg.name) + ': ' + Help._stringify(arg.description));
        }

        console.log('');
      }

      return this;
    }

    /**
     * @returns {Help}
     * @private
     */
  }, {
    key: '_printExample',
    value: function _printExample() {
      if (this._program.example) {
        console.log('Usage example: ' + this._program.example);
        console.log('');
      }

      return this;
    }

    /**
     * @returns {Help}
     * @private
     */
  }, {
    key: '_printHead',
    value: function _printHead() {
      console.log('');
      console.log(Help._stringify(this._program.name) + '@' + Help._stringify(this._program.version) + ' -', Help._stringify(this._program.description));
      console.log('');

      return this;
    }

    /**
     * @param {*} value
     * @returns {*}
     * @private
     */
  }, {
    key: 'program',
    get: function get() {
      return this._program;
    }
  }], [{
    key: '_stringify',
    value: function _stringify(value) {
      if (value === undefined || value === null) {
        return 'unknown';
      } else if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
      }

      return value.toString();
    }
  }]);

  return Help;
})();

exports.Help = Help;