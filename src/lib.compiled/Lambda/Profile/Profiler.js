/**
 * Created by AlexanderC on 8/17/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _AbstractProfiler2 = require('./AbstractProfiler');

var _v8Profiler = require('v8-profiler');

var _v8Profiler2 = _interopRequireDefault(_v8Profiler);

var _traceviewify = require('traceviewify');

var _traceviewify2 = _interopRequireDefault(_traceviewify);

var Profiler = (function (_AbstractProfiler) {
  _inherits(Profiler, _AbstractProfiler);

  /**
   * @param {String} name
   */

  function Profiler() {
    var name = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

    _classCallCheck(this, Profiler);

    _get(Object.getPrototypeOf(Profiler.prototype), 'constructor', this).call(this, name);
  }

  _createClass(Profiler, [{
    key: 'start',
    value: function start() {
      _v8Profiler2['default'].startProfiling(this._name);
    }
  }, {
    key: 'stop',
    value: function stop() {
      this._lastProfile = (0, _traceviewify2['default'])(_v8Profiler2['default'].stopProfiling(this._name));
    }
  }]);

  return Profiler;
})(_AbstractProfiler2.AbstractProfiler);

exports.Profiler = Profiler;