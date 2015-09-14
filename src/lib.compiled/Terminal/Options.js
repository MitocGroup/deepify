/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _Option = require('./Option');

var _ExceptionOptionObjectRequiredException = require('./Exception/OptionObjectRequiredException');

var _ExceptionOptionsObjectRequiredException = require('./Exception/OptionsObjectRequiredException');

var _ExceptionMissingOptionException = require('./Exception/MissingOptionException');

var Options = (function () {
  function Options() {
    _classCallCheck(this, Options);

    this._vector = [];
  }

  /**
   * @returns {Options}
   */

  _createClass(Options, [{
    key: 'validate',
    value: function validate() {
      for (var i in this._vector) {
        if (!this._vector.hasOwnProperty(i)) {
          continue;
        }

        var item = this._vector[i];

        if (item.required && !item.exists) {
          throw new _ExceptionMissingOptionException.MissingOptionException(item);
        }
      }

      return this;
    }

    /**
     * @param {Options} sibling
     * @returns {Options}
     */
  }, {
    key: 'merge',
    value: function merge(sibling) {
      if (!sibling instanceof Options) {
        throw new _ExceptionOptionsObjectRequiredException.OptionsObjectRequiredException();
      }

      this._vector = this._vector.concat(sibling.list());

      return this;
    }

    /**
     * @param {Array} args
     * @returns {Options}
     */
  }, {
    key: 'populate',
    value: function populate(args) {
      for (var i in this._vector) {
        if (!this._vector.hasOwnProperty(i)) {
          continue;
        }

        var item = this._vector[i];

        item.collect(args);
      }

      return this;
    }

    /**
     * @param {String} name
     * @returns {Options}
     */
  }, {
    key: 'remove',
    value: function remove(name) {
      for (var i in this._vector) {
        if (!this._vector.hasOwnProperty(i)) {
          continue;
        }

        var item = this._vector[i];

        if (item.name === name) {
          this._vector.splice(i, 1);

          break;
        }
      }

      return this;
    }

    /**
     * @param {String} name
     * @returns {Option}
     */
  }, {
    key: 'locate',
    value: function locate(name) {
      for (var i in this._vector) {
        if (!this._vector.hasOwnProperty(i)) {
          continue;
        }

        var item = this._vector[i];

        if (item.name === name) {
          return item;
        }
      }

      return null;
    }

    /**
     * @param {String} name
     * @param {String} alias
     * @param {String} description
     * @param {Boolean} required
     * @returns {Options}
     */
  }, {
    key: 'create',
    value: function create(name) {
      var alias = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
      var description = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];
      var required = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

      var option = new _Option.Option(name, alias, description, required);

      return this.add(option);
    }

    /**
     * @param {Option} option
     * @returns {Options}
     */
  }, {
    key: 'add',
    value: function add(option) {
      if (!option instanceof _Option.Option) {
        throw new _ExceptionOptionObjectRequiredException.OptionObjectRequiredException();
      }

      this._vector.push(option);

      return this;
    }

    /**
     * @returns {Option[]}
     */
  }, {
    key: 'list',
    value: function list() {
      return this._vector;
    }
  }]);

  return Options;
})();

exports.Options = Options;