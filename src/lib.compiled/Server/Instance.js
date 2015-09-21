/**
 * Created by AlexanderC on 8/10/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _PropertyInstance = require('../Property/Instance');

var _ExceptionPropertyObjectRequiredException = require('./Exception/PropertyObjectRequiredException');

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _ExceptionFailedToStartServerException = require('./Exception/FailedToStartServerException');

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _mime = require('mime');

var _mime2 = _interopRequireDefault(_mime);

var _jsonfile = require('jsonfile');

var _jsonfile2 = _interopRequireDefault(_jsonfile);

var _LambdaRuntime = require('../Lambda/Runtime');

var _PropertyFrontend = require('../Property/Frontend');

var _LambdaProfileProfiler = require('../Lambda/Profile/Profiler');

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

var _TraceBuilder = require('./TraceBuilder');

var _MicroserviceMetadataAction = require('../Microservice/Metadata/Action');

var _PropertyConfig = require('../Property/Config');

var _mitocgroupDeepDb = require('@mitocgroup/deep-db');

var Instance = (function () {
  /**
   * @param {Property} property
   */

  function Instance(property) {
    _classCallCheck(this, Instance);

    if (!property instanceof _PropertyInstance.Instance) {
      throw new _ExceptionPropertyObjectRequiredException.PropertyObjectRequiredException();
    }

    this._logger = console.log;
    this._property = property;
    this._server = null;
    this._host = null;

    this._localId = 0;
    this._profiling = false;

    this._defaultFrontendConfig = {};
    this._defaultLambdasConfig = {};

    this._buildPath = null;
    this._buildConfig = null;

    this._rootMicroservice = {};
    this._microservices = {};

    this._setup();
  }

  /**
   * @returns {String}
   */

  _createClass(Instance, [{
    key: '_populateBuildConfig',

    /**
     * @private
     */
    value: function _populateBuildConfig() {
      this._buildConfig = {
        lambdas: {}
      };

      var frontendConfig = _jsonfile2['default'].readFileSync(_path2['default'].join(this.buildPath, '_www/_config.json'));

      for (var microservice in frontendConfig.microservices) {
        if (!frontendConfig.microservices.hasOwnProperty(microservice)) {
          continue;
        }

        var microserviceLocalData = microservice === this._rootMicroservice.identifier ? this._rootMicroservice : this._microservices[microservice];

        var microserviceConfig = frontendConfig.microservices[microservice];

        for (var resourceName in microserviceConfig.resources) {
          if (!microserviceConfig.resources.hasOwnProperty(resourceName)) {
            continue;
          }

          var resourceActions = microserviceConfig.resources[resourceName];

          for (var actionName in resourceActions) {
            if (!resourceActions.hasOwnProperty(actionName)) {
              continue;
            }

            var resourceIdentifier = resourceName + '-' + actionName;
            var resourceAction = resourceActions[actionName];

            if (resourceAction.type === _MicroserviceMetadataAction.Action.LAMBDA) {
              this._buildConfig.lambdas[resourceAction.source] = {
                identifier: resourceIdentifier,
                methods: resourceAction.methods,
                name: resourceAction.source,
                buildPath: _path2['default'].join(this.buildPath, microservice + '_lambda_' + resourceIdentifier),
                path: microserviceLocalData.lambdas[resourceIdentifier].path
              };
            }
          }
        }
      }
    }

    /**
     * @returns {Boolean}
     */
  }, {
    key: '_setup',

    /**
     * @private
     */
    value: function _setup() {
      this._defaultLambdasConfig = this._property.fakeBuild();

      var microservices = this._property.microservices;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = microservices[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var microservice = _step.value;

          if (microservice.isRoot) {
            this._rootMicroservice = this._buildMicroservice(microservice);
          } else {
            this._microservices[microservice.identifier] = this._buildMicroservice(microservice);
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator['return']) {
            _iterator['return']();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      this._defaultFrontendConfig = _PropertyFrontend.Frontend.createConfig(this._property.config);
    }

    /**
     * @param {Microservice} microservice
     * @returns {Object}
     * @private
     */
  }, {
    key: '_buildMicroservice',
    value: function _buildMicroservice(microservice) {
      var build = {
        identifier: microservice.identifier,
        path: microservice.basePath,
        frontend: microservice.autoload.frontend,
        lambdas: {}
      };

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = microservice.resources.actions[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var action = _step2.value;

          if (action.type === _MicroserviceMetadataAction.Action.LAMBDA) {
            build.lambdas[action.identifier] = {
              path: _path2['default'].join(microservice.autoload.backend, action.source, 'bootstrap.js'),
              methods: action.methods
            };
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2['return']) {
            _iterator2['return']();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return build;
    }

    /**
     * @returns {Property}
     */
  }, {
    key: 'listen',

    /**
     * @param {Number} port
     * @param {Function} callback
     * @returns {Instance}
     */
    value: function listen() {
      var port = arguments.length <= 0 || arguments[0] === undefined ? 8080 : arguments[0];
      var callback = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      var _this = this;

      this._log('Creating server on port ' + port);

      this._server = _http2['default'].createServer(function () {
        _this._handler.apply(_this, arguments);
      });

      this._server.listen(port, (function (error) {
        var _this2 = this;

        if (error) {
          throw new _ExceptionFailedToStartServerException.FailedToStartServerException(port, error);
        }

        this._host = 'http://localhost:' + port;

        this._log('HTTP Server is up and running!');

        this._log('Creating local DynamoDB instance on port ' + _mitocgroupDeepDb.DeepDB.LOCAL_DB_PORT);

        _mitocgroupDeepDb.DeepDB.startLocalDynamoDBServer(function (error) {
          if (error) {
            throw new _ExceptionFailedToStartServerException.FailedToStartServerException(port, error);
          }

          callback && callback(_this2);
        });
      }).bind(this));

      // @todo: move it in destructor?
      process.on('exit', (function () {
        this.stop((function () {
          process.exit(0);
        }).bind(this));
      }).bind(this));

      return this;
    }

    /**
     * @param {Function} callback
     * @returns {Instance}
     */
  }, {
    key: 'stop',
    value: function stop() {
      var callback = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

      callback = callback || function () {};

      this.running ? this._server.close(callback) : callback();

      return this;
    }

    /**
     * @param {LambdaRuntime} lambda
     * @private
     */
  }, {
    key: '_trySaveProfile',
    value: function _trySaveProfile(lambda) {
      // the second check is done because of threaded version!
      if (!lambda.profiler || !lambda.profiler.profile) {
        return;
      }

      lambda.profiler.save((function (error, profilePath) {
        if (error) {
          this._log('Error while saving profile for Lambda ' + lambda.name + ': ' + error);
          return;
        }

        var profileUrl = '' + this._host + Instance.PROFILE_URI + '?p=' + lambda.name;

        this._log('Profile for Lambda ' + lambda.name + ' accessible at ' + profileUrl);
      }).bind(this));
    }

    /**
     * @returns {Number}
     */
  }, {
    key: '_runLambda',

    /**
     * @param {Http.ServerResponse} response
     * @param {Object} lambdaConfig
     * @param {Object} payload
     * @private
     */
    value: function _runLambda(response, lambdaConfig, payload) {
      var lambda = _LambdaRuntime.Runtime.createLambda(lambdaConfig.path, lambdaConfig.buildPath ? _path2['default'].join(lambdaConfig.buildPath, '.aws.json') : null);

      lambda.name = lambdaConfig.name + '-' + this.localId;
      lambda.profiler = this._profiling ? new _LambdaProfileProfiler.Profiler(lambda.name) : null;

      lambda.runForked(payload);

      lambda.succeed = (function (result) {
        this._trySaveProfile(lambda);

        var plainResult = JSON.stringify(result);

        this._log('Serving result for Lambda ' + lambdaConfig.name + ': ' + plainResult);
        this._send(response, plainResult, 200, 'application/json', false);
      }).bind(this);

      lambda.fail = (function (error) {
        this._trySaveProfile(lambda);

        this._log('Lambda ' + lambdaConfig.name + ' execution fail: ' + error.message);
        this._send500(response, error);
      }).bind(this);
    }

    /**
     * @param {Http.IncomingMessage} request
     * @param {Http.ServerResponse} response
     * @private
     */
  }, {
    key: '_handler',
    value: function _handler(request, response) {
      var _this3 = this;

      var urlParts = _url2['default'].parse(request.url);
      var uri = urlParts.pathname;
      var queryObject = _querystring2['default'].parse(urlParts.query);

      this._log('Request ' + request.url + ' -> ' + uri);

      var filename = this._resolveMicroservice(uri);

      if (uri === '/_config.json') {
        if (this.buildPath) {
          this._log('Triggering frontend config hook...');

          filename = _path2['default'].join(this.buildPath, '_www', uri);
        } else {
          this._send(response, JSON.stringify(this._defaultFrontendConfig), 200, 'application/json');
          return;
        }
      }

      if (uri === Instance.PROFILE_URI) {
        if (queryObject.p) {
          var _ret = (function () {
            // @todo: make it compatible with other browsers
            if (!_this3._isTracerCompatible(request)) {
              _this3._send(response, '<h1>Try open profiling url in Chrome/Chromium browser</h1>', 200, 'text/html', false);
              return {
                v: undefined
              };
            }

            var profileFile = _LambdaProfileProfiler.Profiler.getDumpFile(queryObject.p);
            var traceBuilder = new _TraceBuilder.TraceBuilder(profileFile);

            traceBuilder.compile((function (error, file) {
              if (error) {
                this._log('Unable to read profile ' + profileFile + ': ' + error);
                this._send500(response, error);
                return;
              }

              this._log('Serving profile ' + profileFile);
              this._send(response, file, 200, 'text/html', true);
            }).bind(_this3));

            return {
              v: undefined
            };
          })();

          if (typeof _ret === 'object') return _ret.v;
        }

        this._send500(response, 'You have to specify profile id');
        return;
      } else if (uri === Instance.LAMBDA_URI) {
        this._readRequestData(request, (function (rawData) {
          var _this4 = this;

          var data = JSON.parse(rawData);

          if (!data) {
            this._log('Broken Lambda payload: ' + rawData);
            this._send500(response, 'Error while parsing JSON request payload');
            return;
          }

          var lambda = data.lambda;
          var payload = data.payload;

          this._log('Running Lambda ' + lambda + ' with payload ' + JSON.stringify(payload));

          if (this.buildPath) {
            var _ret2 = (function () {
              var lambdaConfig = _this4._buildConfig.lambdas[lambda];

              if (!lambdaConfig) {
                _this4._log('Missing Lambda ' + lambda + ' built config');
                _this4._send404(response, 'Unknown Lambda ' + lambda);
                return {
                  v: undefined
                };
              }

              _fsExtra2['default'].ensureSymlink(_path2['default'].join(lambdaConfig.buildPath, '_config.json'), _path2['default'].join(_path2['default'].dirname(lambdaConfig.path), '_config.json'), (function (error) {
                // @todo: manage this error?
                //if (error) {
                //  this._log(`Unable to link Lambda ${lambda} config: ${error}`);
                //  this._send500(response, error);
                //  return;
                //}

                this._runLambda(response, lambdaConfig, payload);
              }).bind(_this4));
            })();

            if (typeof _ret2 === 'object') return _ret2.v;
          } else {
            var _ret3 = (function () {
              var lambdaConfig = _this4._defaultLambdasConfig[lambda];

              if (!lambdaConfig) {
                _this4._log('Missing Lambda ' + lambda + ' config');
                _this4._send404(response, 'Unknown Lambda ' + lambda);
                return {
                  v: undefined
                };
              }

              var lambdaConfigFile = _path2['default'].join(_path2['default'].dirname(lambdaConfig.path), '_config.json');

              _fsExtra2['default'].remove(lambdaConfigFile, (function (error) {
                // @todo: manage this error?
                //if (error) {
                //  this._log(`Error while removing Lambda ${lambda} old config: ${error}`);
                //  this._send500(response, error);
                //  return;
                //}

                _fsExtra2['default'].outputJson(lambdaConfigFile, lambdaConfig, (function (error) {
                  if (error) {
                    this._log('Unable to persist fake Lambda ' + lambda + ' config: ' + error);
                    this._send500(response, error);
                    return;
                  }

                  this._runLambda(response, lambdaConfig, payload);
                }).bind(this));
              }).bind(_this4));
            })();

            if (typeof _ret3 === 'object') return _ret3.v;
          }
        }).bind(this));

        return;
      }

      _fs2['default'].exists(filename, (function (exists) {
        if (!exists) {
          this._log('File ' + filename + ' not found');
          this._send404(response);
          return;
        }

        _fs2['default'].stat(filename, (function (error, stats) {
          if (error) {
            this._log('Unable to stat file ' + filename + ': ' + error);
            this._send500(response, error);
            return;
          }

          if (stats.isDirectory()) {
            this._log('Resolving ' + filename + ' into ' + filename + '/index.html');

            filename = _path2['default'].join(filename, 'index.html');
          }

          _fs2['default'].readFile(filename, 'binary', (function (error, file) {
            if (error) {
              this._log('Unable to read file ' + filename + ': ' + error);
              this._send500(response, error);
              return;
            }

            var mimeType = _mime2['default'].lookup(filename);

            this._log('Serving file ' + filename + ' of type ' + mimeType);
            this._send(response, file, 200, mimeType, true);
          }).bind(this));
        }).bind(this));
      }).bind(this));
    }

    /**
     * @param {Http.IncomingMessage} request
     * @returns {Boolean}
     * @private
     */
  }, {
    key: '_isTracerCompatible',
    value: function _isTracerCompatible(request) {
      var ua = request.headers['user-agent'] || '';

      return (/chrom(e|ium)/i.test(ua)
      );
    }

    /**
     * @param {Http.IncomingMessage} request
     * @param {Function} callback
     */
  }, {
    key: '_readRequestData',
    value: function _readRequestData(request, callback) {
      if (request.method === 'POST') {
        (function () {
          var rawData = '';

          request.on('data', function (chunk) {
            rawData += chunk.toString();
          });

          request.on('end', function () {
            callback(rawData);
          });
        })();
      } else {
        callback(null);
      }
    }

    /**
     * @param {String} uri
     * @returns {String}
     * @private
     */
  }, {
    key: '_resolveMicroservice',
    value: function _resolveMicroservice(uri) {
      var parts = uri.replace(/^\/(.+)$/, '$1').split(_path2['default'].sep);

      if (parts.length > 0) {
        for (var identifier in this._microservices) {
          if (!this._microservices.hasOwnProperty(identifier)) {
            continue;
          }

          if (identifier === parts[0]) {
            var microservice = this._microservices[identifier];

            parts.shift();

            return _path2['default'].join.apply(_path2['default'], [microservice.frontend].concat(_toConsumableArray(parts)));
          }
        }
      }

      return _path2['default'].join.apply(_path2['default'], [this._rootMicroservice.frontend].concat(_toConsumableArray(parts)));
    }

    /**
     * @param {Http.ServerResponse} response
     * @param {String} error
     * @private
     */
  }, {
    key: '_send500',
    value: function _send500(response, error) {
      this._send(response, '' + error + _os2['default'].EOL, 500);
    }

    /**
     * @param {Http.ServerResponse} response
     * @param {String} message
     * @private
     */
  }, {
    key: '_send404',
    value: function _send404(response) {
      var message = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      this._send(response, message || '404 Not Found' + _os2['default'].EOL, 404);
    }

    /**
     * @param {Http.ServerResponse} response
     * @param {String} content
     * @param {Number} code
     * @param {String} contentType
     * @param {Boolean} isBinary
     * @private
     */
  }, {
    key: '_send',
    value: function _send(response, content) {
      var code = arguments.length <= 2 || arguments[2] === undefined ? 200 : arguments[2];
      var contentType = arguments.length <= 3 || arguments[3] === undefined ? 'text/plain' : arguments[3];
      var isBinary = arguments.length <= 4 || arguments[4] === undefined ? false : arguments[4];

      response.writeHead(code, { 'Content-Type': contentType });

      if (isBinary) {
        response.write(content, 'binary');
      } else {
        response.write(content);
      }

      response.end();
    }

    /**
     * @param {String} args
     * @private
     */
  }, {
    key: '_log',
    value: function _log() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      this._logger.apply(this, ['[' + new Date().toISOString() + ']'].concat(args));
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'host',
    get: function get() {
      return this._host;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'buildPath',
    get: function get() {
      return this._buildPath;
    },

    /**
     * @param {String} path
     */
    set: function set(path) {
      this._buildPath = path;

      this._populateBuildConfig();
    }

    /**
     * @returns {Object}
     */
  }, {
    key: 'buildConfig',
    get: function get() {
      return this._buildConfig;
    }
  }, {
    key: 'profiling',
    get: function get() {
      return this._profiling;
    },

    /**
     * @param {Boolean} state
     */
    set: function set(state) {
      this._profiling = state;
    }

    /**
     * @returns {Function}
     */
  }, {
    key: 'logger',
    get: function get() {
      return this._logger;
    },

    /**
     * @param {Function} logger
     */
    set: function set(logger) {
      this._logger = logger;
    }
  }, {
    key: 'property',
    get: function get() {
      return this._property;
    }

    /**
     * @returns {Http.Server}
     */
  }, {
    key: 'nativeServer',
    get: function get() {
      return this._server;
    }

    /**
     * @returns {Boolean}
     */
  }, {
    key: 'running',
    get: function get() {
      return !!this._server;
    }

    /**
     * @param {String} mainPath
     * @param {String} configFile
     * @returns {Instance}
     */
  }, {
    key: 'localId',
    get: function get() {
      return this._localId++;
    }
  }], [{
    key: 'create',
    value: function create(mainPath) {
      var configFile = arguments.length <= 1 || arguments[1] === undefined ? _PropertyConfig.Config.DEFAULT_FILENAME : arguments[1];

      return new Instance(new _PropertyInstance.Instance(mainPath, configFile));
    }
  }, {
    key: 'PROFILE_URI',
    get: function get() {
      return '/_/profile';
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'LAMBDA_URI',
    get: function get() {
      return '/_/lambda';
    }
  }]);

  return Instance;
})();

exports.Instance = Instance;