/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _Argument = require('./Argument');

var _ExceptionArgumentObjectRequiredException = require('./Exception/ArgumentObjectRequiredException');

var _ExceptionArgumentsObjectRequiredException = require('./Exception/ArgumentsObjectRequiredException');

var _ExceptionMissingArgumentException = require('./Exception/MissingArgumentException');

var Arguments = (function () {
  function Arguments() {
    _classCallCheck(this, Arguments);

    this._vector = [];
    this._unmanagedVector = [];
  }

  /**
   * @returns {Arguments}
   */

  _createClass(Arguments, [{
    key: 'validate',
    value: function validate() {
      for (var i in this._vector) {
        if (!this._vector.hasOwnProperty(i)) {
          continue;
        }

        var item = this._vector[i];

        if (item.required && !item.exists) {
          throw new _ExceptionMissingArgumentException.MissingArgumentException(item);
        }
      }

      return this;
    }

    /**
     * @param {Arguments} sibling
     * @returns {Arguments}
     */
  }, {
    key: 'merge',
    value: function merge(sibling) {
      if (!sibling instanceof Arguments) {
        throw new _ExceptionArgumentsObjectRequiredException.ArgumentsObjectRequiredException();
      }

      this._vector = this._vector.concat(sibling.list());
      this._unmanagedVector = this._unmanagedVector.concat(sibling.listUnmanaged());

      return this;
    }

    /**
     * @param {Array} args
     * @returns {Arguments}
     */
  }, {
    key: 'populateUnmanaged',
    value: function populateUnmanaged(args) {
      for (var i in args) {
        if (!args.hasOwnProperty(i)) {
          continue;
        }

        var item = args[i];

        if (_Argument.Argument._matchNonOption(item)) {
          this._unmanagedVector.push(item);
        }
      }

      return this;
    }

    /**
     * @param {Array} args
     * @returns {Arguments}
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
     * @returns {Arguments}
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
     * @returns {Argument}
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
     * @param {String} description
     * @param {Boolean} required
     * @returns {Arguments}
     */
  }, {
    key: 'create',
    value: function create(name) {
      var description = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
      var required = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

      var argument = new _Argument.Argument(name, description, required);

      return this.add(argument);
    }

    /**
     * @param {Argument} argument
     * @returns {Arguments}
     */
  }, {
    key: 'add',
    value: function add(argument) {
      if (!argument instanceof _Argument.Argument) {
        throw new _ExceptionArgumentObjectRequiredException.ArgumentObjectRequiredException();
      }

      this._vector.push(argument);

      return this;
    }

    /**
     * @returns {Boolean}
     */
  }, {
    key: 'listValues',

    /**
     * @param {Boolean} includeUnmanaged
     * @returns {String[]}
     */
    value: function listValues() {
      var includeUnmanaged = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      var valuesVector = [];

      for (var i in this._vector) {
        if (!this._vector.hasOwnProperty(i)) {
          continue;
        }

        var item = this._vector[i];

        if (!item.exists) {
          break;
        }

        valuesVector.push(item.value);
      }

      if (includeUnmanaged) {
        valuesVector = valuesVector.concat(this._unmanagedVector);
      }

      return valuesVector;
    }

    /**
     *
     * @returns {String[]}
     */
  }, {
    key: 'listUnmanaged',
    value: function listUnmanaged() {
      return this._unmanagedVector;
    }

    /**
     * @returns {Argument[]}
     */
  }, {
    key: 'list',
    value: function list() {
      return this._vector;
    }
  }, {
    key: 'hasUnmanaged',
    get: function get() {
      return this._unmanagedVector.length > 0;
    }
  }]);

  return Arguments;
})();

exports.Arguments = Arguments;