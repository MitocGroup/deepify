/**
 * Created by AlexanderC on 8/10/15.
 */

'use strict';

import {Instance as Property} from '../Property/Instance';
import {PropertyObjectRequiredException} from './Exception/PropertyObjectRequiredException';
import Http from 'http';
import Path from 'path';
import FileSystem from 'fs';
import FileSystemExtra from 'fs-extra';
import Url from 'url';
import {FailedToStartServerException} from './Exception/FailedToStartServerException';
import OS from 'os';
import Mime from 'mime';
import JsonFile from 'jsonfile';
import {Runtime as LambdaRuntime} from '../Lambda/Runtime';
import {Frontend} from '../Property/Frontend';
import {Profiler} from '../Lambda/Profile/Profiler';
import QueryString from 'querystring';
import {TraceBuilder} from './TraceBuilder';
import {Action} from '../Microservice/Metadata/Action';
import {Config} from '../Property/Config';
import DeepDB from 'deep-db';

export class Instance {
  /**
   * @param {Property} property
   */
  constructor(property) {
    if (!property instanceof Property) {
      throw new PropertyObjectRequiredException();
    }

    this._logger = (...args) => {
      console.log(...args);
    };
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
  get host() {
    return this._host;
  }

  /**
   * @returns {String}
   */
  get buildPath() {
    return this._buildPath;
  }

  /**
   * @param {String} path
   */
  set buildPath(path) {
    this._buildPath = path;

    this._populateBuildConfig();
  }

  /**
   * @returns {Object}
   */
  get buildConfig() {
    return this._buildConfig;
  }

  /**
   * @private
   */
  _populateBuildConfig() {
    this._buildConfig = {
      lambdas: {},
    };

    let frontendConfig = JsonFile.readFileSync(Path.join(this.buildPath, '_www/_config.json'));

    for (let microservice in frontendConfig.microservices) {
      if (!frontendConfig.microservices.hasOwnProperty(microservice)) {
        continue;
      }

      let microserviceLocalData = microservice === this._rootMicroservice.identifier
        ? this._rootMicroservice : this._microservices[microservice];

      let microserviceConfig = frontendConfig.microservices[microservice];

      for (let resourceName in microserviceConfig.resources) {
        if (!microserviceConfig.resources.hasOwnProperty(resourceName)) {
          continue;
        }

        let resourceActions = microserviceConfig.resources[resourceName];

        for (let actionName in resourceActions) {
          if (!resourceActions.hasOwnProperty(actionName)) {
            continue;
          }

          let resourceIdentifier = `${resourceName}-${actionName}`;
          let resourceAction = resourceActions[actionName];

          if (resourceAction.type === Action.LAMBDA) {
            this._buildConfig.lambdas[resourceAction.source.original] = {
              identifier: resourceIdentifier,
              methods: resourceAction.methods,
              name: resourceAction.source.original,
              buildPath: Path.join(this.buildPath, `${microservice}_lambda_${resourceIdentifier}`),
              path: microserviceLocalData.lambdas[resourceIdentifier].path,
            };
          }
        }
      }
    }
  }

  /**
   * @returns {Boolean}
   */
  get profiling() {
    return this._profiling;
  }

  /**
   * @param {Boolean} state
   */
  set profiling(state) {
    this._profiling = state;
  }

  /**
   * @returns {Function}
   */
  get logger() {
    return this._logger;
  }

  /**
   * @param {Function} logger
   */
  set logger(logger) {
    this._logger = logger;
  }

  /**
   * @private
   */
  _setup() {
    this._defaultLambdasConfig = this._property.fakeBuild();

    let microservices = this._property.microservices;

    for (let microservice of microservices) {
      if (microservice.isRoot) {
        this._rootMicroservice = this._buildMicroservice(microservice);
      } else {
        this._microservices[microservice.identifier] = this._buildMicroservice(microservice);
      }
    }

    this._defaultFrontendConfig = Frontend.createConfig(this._property.config);
  }

  /**
   * @param {Microservice} microservice
   * @returns {Object}
   * @private
   */
  _buildMicroservice(microservice) {
    let build = {
      identifier: microservice.identifier,
      path: microservice.basePath,
      frontend: microservice.autoload.frontend,
      lambdas: {},
    };

    for (let action of microservice.resources.actions) {
      if (action.type === Action.LAMBDA) {
        build.lambdas[action.identifier] = {
          path: Path.join(microservice.autoload.backend, action.source, 'bootstrap.js'),
          methods: action.methods,
        };
      }
    }

    return build;
  }

  /**
   * @returns {Property}
   */
  get property() {
    return this._property;
  }

  /**
   * @returns {Http.Server}
   */
  get nativeServer() {
    return this._server;
  }

  /**
   * @returns {Boolean}
   */
  get running() {
    return !!this._server;
  }

  /**
   * @param {String} mainPath
   * @param {String} configFile
   * @returns {Instance}
   */
  static create(mainPath, configFile = Config.DEFAULT_FILENAME) {
    return new Instance(new Property(mainPath, configFile));
  }

  /**
   * @param {Number} port
   * @param {String} dbServer
   * @param {Function} callback
   * @returns {Instance}
   */
  listen(port = 8080, dbServer = null, callback = () => {}) {
    this._log(`Creating server on port ${port}`);

    this._server = Http.createServer((...args) => {
      this._handler(...args);
    });

    var localDbInstance = null;

    this._server.listen(port, (error) => {
      if (error) {
        throw new FailedToStartServerException(port, error);
      }

      this._host = `http://localhost:${port}`;

      this._log('HTTP Server is up and running!');

      if (!dbServer) {
        callback(this);
        return;
      }

      this._log(`Creating local DynamoDB instance on port ${DeepDB.LOCAL_DB_PORT}`);

      localDbInstance = DeepDB.startLocalDynamoDBServer((error) => {
        if (error) {
          throw new FailedToStartServerException(port, error);
        }

        this._log(`You can access DynamoDB Console via http://localhost:${DeepDB.LOCAL_DB_PORT}/shell`);

        callback(this);
      }, dbServer);
    });

    // @todo: move it in destructor?
    process.on('exit', () => {
      this.stop(() => {
        if (localDbInstance) {
          localDbInstance.stop(() => {
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      });
    });

    return this;
  }

  /**
   * @param {Function} callback
   * @returns {Instance}
   */
  stop(callback = () => {}) {
    this.running ? this._server.close(callback) : callback();

    return this;
  }

  /**
   * @param {LambdaRuntime} lambda
   * @private
   */
  _trySaveProfile(lambda) {
    // the second check is done because of threaded version!
    if (!lambda.profiler || !lambda.profiler.profile) {
      return;
    }

    lambda.profiler.save(function(error, profilePath) {
      if (error) {
        this._log(`Error while saving profile for Lambda ${lambda.name}: ${error}`);
        return;
      }

      let profileUrl = `${this._host}${Instance.PROFILE_URI}?p=${lambda.name}`;

      this._log(`Profile for Lambda ${lambda.name} accessible at ${profileUrl}`);
    }.bind(this));
  }

  /**
   * @returns {Number}
   */
  get localId() {
    return this._localId++;
  }

  /**
   * @param {Http.ServerResponse} response
   * @param {Object} lambdaConfig
   * @param {Object} payload
   * @private
   */
  _runLambda(response, lambdaConfig, payload) {
    let lambda = LambdaRuntime.createLambda(
      lambdaConfig.path,
      lambdaConfig.buildPath ? Path.join(lambdaConfig.buildPath, '.aws.json') : null
    );

    lambda.name = `${lambdaConfig.name}-${this.localId}`;
    lambda.profiler = this._profiling ? new Profiler(lambda.name) : null;

    lambda.runForked(payload);

    lambda.succeed = function(result) {
      this._trySaveProfile(lambda);

      let plainResult = JSON.stringify(result);

      this._log(`Serving result for Lambda ${lambdaConfig.name}: ${plainResult}`);
      this._send(response, plainResult, 200, 'application/json', false);
    }.bind(this);

    lambda.fail = function(error) {
      this._trySaveProfile(lambda);

      this._log(`Lambda ${lambdaConfig.name} execution fail: ${error.message}`);
      this._send500(response, error);
    }.bind(this);
  }

  /**
   * @param {Http.IncomingMessage} request
   * @param {Http.ServerResponse} response
   * @private
   */
  _handler(request, response) {
    let urlParts = Url.parse(request.url);
    let uri = urlParts.pathname;
    let queryObject = QueryString.parse(urlParts.query);

    this._log(`Request ${request.url} -> ${uri}`);

    let filename = this._resolveMicroservice(uri);

    if (uri === '/_config.json') {
      if (this.buildPath) {
        this._log(`Triggering frontend config hook...`);

        filename = Path.join(this.buildPath, '_www', uri);
      } else {
        this._send(response, JSON.stringify(this._defaultFrontendConfig), 200, 'application/json');
        return;
      }
    }

    if (uri === Instance.PROFILE_URI) {
      if (queryObject.p) {
        // @todo: make it compatible with other browsers
        if (!this._isTracerCompatible(request)) {
          this._send(response, '<h1>Try open profiling url in Chrome/Chromium browser</h1>', 200, 'text/html', false);
          return;
        }

        let profileFile = Profiler.getDumpFile(queryObject.p);
        let traceBuilder = new TraceBuilder(profileFile);

        traceBuilder.compile(function(error, file) {
          if (error) {
            this._log(`Unable to read profile ${profileFile}: ${error}`);
            this._send500(response, error);
            return;
          }

          this._log(`Serving profile ${profileFile}`);
          this._send(response, file, 200, 'text/html', true);
        }.bind(this));

        return;
      }

      this._send500(response, 'You have to specify profile id');
      return;
    } else if (uri === Instance.LAMBDA_URI) {
      this._readRequestData(request, function(rawData) {
        let data = JSON.parse(rawData);

        if (!data) {
          this._log(`Broken Lambda payload: ${rawData}`);
          this._send500(response, 'Error while parsing JSON request payload');
          return;
        }

        let lambda = data.lambda;
        let payload = data.payload;

        this._log(`Running Lambda ${lambda} with payload ${JSON.stringify(payload)}`);

        if (this.buildPath) {
          let lambdaConfig = this._buildConfig.lambdas[lambda];

          if (!lambdaConfig) {
            this._log(`Missing Lambda ${lambda} built config`);
            this._send404(response, `Unknown Lambda ${lambda}`);
            return;
          }

          FileSystemExtra.ensureSymlink(
            Path.join(lambdaConfig.buildPath, '_config.json'),
            Path.join(Path.dirname(lambdaConfig.path), '_config.json'),
            function(error) {
              // @todo: manage this error?
              //if (error) {
              //  this._log(`Unable to link Lambda ${lambda} config: ${error}`);
              //  this._send500(response, error);
              //  return;
              //}

              this._runLambda(response, lambdaConfig, payload);
            }.bind(this)
          );
        } else {
          let lambdaConfig = this._defaultLambdasConfig[lambda];

          if (!lambdaConfig) {
            this._log(`Missing Lambda ${lambda} config`);
            this._send404(response, `Unknown Lambda ${lambda}`);
            return;
          }

          let lambdaConfigFile = Path.join(Path.dirname(lambdaConfig.path), '_config.json');

          FileSystemExtra.remove(lambdaConfigFile, function(error) {
            // @todo: manage this error?
            //if (error) {
            //  this._log(`Error while removing Lambda ${lambda} old config: ${error}`);
            //  this._send500(response, error);
            //  return;
            //}

            FileSystemExtra.outputJson(
              lambdaConfigFile,
              lambdaConfig,
              function(error) {
                if (error) {
                  this._log(`Unable to persist fake Lambda ${lambda} config: ${error}`);
                  this._send500(response, error);
                  return;
                }

                this._runLambda(response, lambdaConfig, payload);
              }.bind(this)
            );
          }.bind(this));
        }
      }.bind(this));

      return;
    }

    FileSystem.exists(filename, function(exists) {
      if (!exists) {
        this._log(`File ${filename} not found`);
        this._send404(response);
        return;
      }

      FileSystem.stat(filename, function(error, stats) {
        if (error) {
          this._log(`Unable to stat file ${filename}: ${error}`);
          this._send500(response, error);
          return;
        }

        if (stats.isDirectory()) {
          this._log(`Resolving ${filename} into ${filename}/index.html`);

          filename = Path.join(filename, 'index.html');
        }

        FileSystem.readFile(filename, 'binary', function(error, file) {
          if (error) {
            this._log(`Unable to read file ${filename}: ${error}`);
            this._send500(response, error);
            return;
          }

          let mimeType = Mime.lookup(filename);

          this._log(`Serving file ${filename} of type ${mimeType}`);
          this._send(response, file, 200, mimeType, true);
        }.bind(this));
      }.bind(this));
    }.bind(this));
  }

  /**
   * @param {Http.IncomingMessage} request
   * @returns {Boolean}
   * @private
   */
  _isTracerCompatible(request) {
    let ua = request.headers['user-agent'] || '';

    return /chrom(e|ium)/i.test(ua);
  }

  /**
   * @param {Http.IncomingMessage} request
   * @param {Function} callback
   */
  _readRequestData(request, callback) {
    if (request.method === 'POST') {
      let rawData = '';

      request.on('data', function(chunk) {
        rawData += chunk.toString();
      });

      request.on('end', function() {
        callback(rawData);
      });
    } else {
      callback(null);
    }
  }

  /**
   * @param {String} uri
   * @returns {String}
   * @private
   */
  _resolveMicroservice(uri) {
    let parts = uri.replace(/^\/(.+)$/, '$1').split(Path.sep);

    if (parts.length > 0) {
      for (let identifier in this._microservices) {
        if (!this._microservices.hasOwnProperty(identifier)) {
          continue;
        }

        if (identifier === parts[0]) {
          let microservice = this._microservices[identifier];

          parts.shift();

          return Path.join(microservice.frontend, ...parts);
        }
      }
    }

    return Path.join(this._rootMicroservice.frontend, ...parts);
  }

  /**
   * @param {Http.ServerResponse} response
   * @param {String} error
   * @private
   */
  _send500(response, error) {
    this._send(response, `${error}${OS.EOL}`, 500);
  }

  /**
   * @param {Http.ServerResponse} response
   * @param {String} message
   * @private
   */
  _send404(response, message = null) {
    this._send(response, message || `404 Not Found${OS.EOL}`, 404);
  }

  /**
   * @param {Http.ServerResponse} response
   * @param {String} content
   * @param {Number} code
   * @param {String} contentType
   * @param {Boolean} isBinary
   * @private
   */
  _send(response, content, code = 200, contentType = 'text/plain', isBinary = false) {
    response.writeHead(code, {'Content-Type': contentType});

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
  _log(...args) {
    this._logger(...args);
  }

  /**
   * @returns {String}
   */
  static get PROFILE_URI() {
    return '/_/profile';
  }

  /**
   * @returns {String}
   */
  static get LAMBDA_URI() {
    return '/_/lambda';
  }
}
