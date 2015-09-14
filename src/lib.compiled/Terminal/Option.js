/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Option = (function () {
  /**
   * @param {String} name
   * @param {String} alias
   * @param {String} description
   * @param {Boolean} required
   */

  function Option(name) {
    var alias = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
    var description = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];
    var required = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

    _classCallCheck(this, Option);

    this._name = name;
    this._description = description;
    this._alias = alias;
    this._value = undefined;
    this._exists = false;
    this._required = required;
  }

  /**
   * @param {Array} args
   * @returns {Option}
   */

  _createClass(Option, [{
    key: 'collect',
    value: function collect(args) {
      for (var i in args) {
        if (!args.hasOwnProperty(i)) {
          continue;
        }

        var obj = this._parse(args[i]);

        if (obj) {
          if (obj && (obj.name === this._name || obj.name === this._alias)) {
            this._value = obj.value;

            this._exists = true;

            args.splice(i, 1);
          }
        }
      }

      return this;
    }

    /**
     * @param {String} option
     * @returns {Object}
     * @private
     */
  }, {
    key: '_parse',
    value: function _parse(option) {
      if (option.indexOf('-') === 0) {
        while (option.indexOf('-') === 0) {
          option = option.substr(1);
        }

        var eqPos = option.indexOf('=');

        if (eqPos !== -1) {
          return {
            name: option.substr(0, eqPos),
            value: option.substr(eqPos + 1)
          };
        } else {
          return {
            name: option,
            value: true
          };
        }
      }

      return null;
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
    key: 'alias',
    get: function get() {
      return this._alias;
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
  }]);

  return Option;
})();

exports.Option = Option;