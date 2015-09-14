/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Argument = (function () {
  /**
   * @param {String} name
   * @param {String} description
   * @param {Boolean} required
   */

  function Argument(name) {
    var description = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
    var required = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

    _classCallCheck(this, Argument);

    this._name = name;
    this._description = description;
    this._value = undefined;
    this._exists = false;
    this._required = required;
  }

  /**
   * @param {String} arg
   * @returns {Boolean}
   */

  _createClass(Argument, [{
    key: 'collect',

    /**
     * @param {Array} args
     * @returns {Argument}
     */
    value: function collect(args) {
      for (var i in args) {
        if (!args.hasOwnProperty(i)) {
          continue;
        }

        var arg = args[i];

        if (Argument._matchNonOption(arg)) {
          this._value = arg;
          this._exists = true;

          args.splice(i, 1);

          break;
        }
      }

      return this;
    }

    /**
     * @param {Boolean} state
     */
  }, {
    key: 'required',
    set: function set(state) {
      this._required = state;
    },

    /**
     * @returns {Boolean}
     */
    get: function get() {
      return this._required;
    }

    /**
     * @returns {*}
     */
  }, {
    key: 'value',
    get: function get() {
      return this._value;
    }

    /**
     * @returns {Boolean}
     */
  }, {
    key: 'exists',
    get: function get() {
      return this._exists;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'name',
    get: function get() {
      return this._name;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'description',
    get: function get() {
      return this._description;
    }
  }], [{
    key: '_matchNonOption',
    value: function _matchNonOption(arg) {
      return arg.indexOf('-') !== 0;
    }
  }]);

  return Argument;
})();

exports.Argument = Argument;