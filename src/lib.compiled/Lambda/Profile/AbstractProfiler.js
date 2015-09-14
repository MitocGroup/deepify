/**
 * Created by AlexanderC on 8/17/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x3, _x4, _x5) { var _again = true; _function: while (_again) { var object = _x3, property = _x4, receiver = _x5; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x3 = parent; _x4 = property; _x5 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _mitocgroupDeepCore = require('@mitocgroup/deep-core');

var _mitocgroupDeepCore2 = _interopRequireDefault(_mitocgroupDeepCore);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _HelpersHash = require('../../Helpers/Hash');

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var AbstractProfiler = (function (_Core$OOP$Interface) {
  _inherits(AbstractProfiler, _Core$OOP$Interface);

  /**
   * @param {String} name
   */

  function AbstractProfiler() {
    var name = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

    _classCallCheck(this, AbstractProfiler);

    _get(Object.getPrototypeOf(AbstractProfiler.prototype), 'constructor', this).call(this, ['start', 'stop']);

    this._profilesPath = AbstractProfiler._tmpDir;

    _mkdirp2['default'].sync(this._profilesPath);

    this._name = null;
    this._lastProfile = null;

    this.name = name || _HelpersHash.Hash.pseudoRandomId(this._lambda);
  }

  /**
   * @returns {String}
   * @private
   */

  _createClass(AbstractProfiler, [{
    key: 'save',

    /**
     * @param {Function} callback
     */
    value: function save(callback) {
      _fs2['default'].writeFile(this.dumpFile, this.profilePlain, 'utf8', (function (error) {
        callback(error, this.dumpFile);
      }).bind(this));
    }

    /**
     * @returns {String}
     * @constructor
     */
  }, {
    key: 'name',

    /**
     * @returns {String}
     */
    get: function get() {
      return this._name;
    },

    /**
     * @param {String} name
     */
    set: function set(name) {
      this._name = name;
      this._dumpFile = AbstractProfiler.getDumpFile(name, this._profilesPath);
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'dumpFile',
    get: function get() {
      return this._dumpFile;
    }

    /**
     * @param {Object} profileData
     */
  }, {
    key: 'profile',
    set: function set(profileData) {
      this._lastProfile = profileData;
    },

    /**
     * @returns {Object}
     */
    get: function get() {
      return this._lastProfile;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'profilePlain',
    get: function get() {
      return JSON.stringify(this.profile, null, 2);
    }
  }], [{
    key: 'getDumpFile',

    /**
     * @param {String} name
     * @param {String} rootPath
     * @returns {String}
     */
    value: function getDumpFile(name) {
      var rootPath = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      return _path2['default'].join(rootPath || AbstractProfiler._tmpDir, '' + _HelpersHash.Hash.md5(name) + AbstractProfiler.EXTENSION);
    }
  }, {
    key: '_tmpDir',
    get: function get() {
      return _path2['default'].join(_os2['default'].tmpdir(), '__deep_profiling-' + process.pid);
    }
  }, {
    key: 'EXTENSION',
    get: function get() {
      return '.cpuprofile';
    }
  }]);

  return AbstractProfiler;
})(_mitocgroupDeepCore2['default'].OOP.Interface);

exports.AbstractProfiler = AbstractProfiler;