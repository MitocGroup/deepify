/**
 * Created by AlexanderC on 8/10/15.
 */

'use strict';

import {PropertyObjectRequiredException} from './Exception/PropertyObjectRequiredException';
import Http from 'http';
import Path from 'path';
import Url from 'url';
import {FailedToStartServerException} from './Exception/FailedToStartServerException';
import JsonFile from 'jsonfile';
import QueryString from 'querystring';
import {Property_Instance as Property} from 'deep-package-manager';
import {Property_Frontend as Frontend} from 'deep-package-manager';
import {Microservice_Metadata_Action as Action} from 'deep-package-manager';
import {Property_Config as Config} from 'deep-package-manager';
import DeepDB from 'deep-db';
import DeepFS from 'deep-fs';
import {Hook} from './Hook';
import {ResponseEvent} from '../Helpers/ResponseEvent';
import {RequestListener} from './Listener/RequestListener';
import {ConfigListener} from './Listener/ConfigListener';
import {FileListener} from './Listener/FileListener';
import {LambdaListener} from './Listener/LambdaListener';

export class Instance {
  /**
   * @param {Property} property
   */
  constructor(property) {
    if (!(property instanceof Property)) {
      throw new PropertyObjectRequiredException();
    }

    this._logger = (...args) => {
      console.log(...args);
    };
    this._property = property;
    this._server = null;
    this._fs = null;

    this._host = null;

    this._localId = 0;
    this._profiling = false;

    this._defaultFrontendConfig = {};
    this._defaultLambdasConfig = {};

    this._buildPath = null;
    this._buildConfig = null;

    this._rootMicroservice = {};
    this._microservices = {};

    this._events = {};
    this._events[Instance.RESPONSE_EVENT] = [];

    this._setup();

    this._listener = new RequestListener(this);
    this._listener
      .register(new ConfigListener(), 0)
      .register(new LambdaListener(), 1)
      .register(new FileListener(), 2);
  }

  /**
   * @returns {DeepFS}
   */
  get fs() {
    return this._fs;
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
   * @returns {Object}
   */
  get defaultLambdasConfig() {
    return this._defaultLambdasConfig;
  }

  /**
   * @returns {Object}
   */
  get defaultFrontendConfig() {
    return this._defaultFrontendConfig;
  }

  /**
   *
   * @returns {Listener}
   */
  get listener () {
    return this._listener;
  }

  /**
   *
   * @returns {Object}
   */
  get microservices() {
    return this._microservices;
  }

  /**
   *
   * @returns {Object}
   */
  get rootMicroservice() {
    return this._rootMicroservice;
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
   * @returns {Object}
   * @private
   */
  get _kernelMock() {
    let lambdasArns = Object.keys(this._defaultLambdasConfig);

    let kernel = {
      config: {
        buckets: {
          system: {
            name: ''
          },
          public: {
            name: ''
          },
          temp: {
            name: ''
          }
        },
      },
      microservice: () => {
        return {
          identifier: '',
        };
      },
    };

    if (lambdasArns.length > 0) {
      kernel.config = this._defaultLambdasConfig[lambdasArns[0]];
    }

    return kernel;
  }

  /**
   * @param {Number} port
   * @param {String} dbServer
   * @param {Function} callback
   * @returns {Instance}
   */
  listen(port = 8080, dbServer = null, callback = () => {}) {
    let hook = new Hook(this);

    hook.runBefore(() => {
      this._log('Booting local FS');

      this._fs = new DeepFS();
      this._fs.localBackend = true;

      this._fs.boot(this._kernelMock, () => {
        this._log(`Linking custom validation schemas`);

        Frontend.dumpValidationSchemas(this._property.config, this._fs.public._rootFolder, true);

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
            hook.runAfter(() => {
              callback(this);
            });

            return;
          }

          this._log(`Creating local DynamoDB instance on port ${DeepDB.LOCAL_DB_PORT}`);

          localDbInstance = DeepDB.startLocalDynamoDBServer((error) => {
            if (error) {
              throw new FailedToStartServerException(port, error);
            }

            this._log(`You can access DynamoDB Console via http://localhost:${DeepDB.LOCAL_DB_PORT}/shell`);

            hook.runAfter(() => {
              callback(this);
            });
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
   * @returns {Number}
   */
  get localId() {
    return this._localId++;
  }

  /**
   * @param {Http.IncomingMessage} request
   * @param {Http.ServerResponse} response
   * @private
   */
  _handler(request, response) {
    let urlParts = Url.parse(request.url);
    let uri = urlParts.pathname;

    this._log(`Request ${request.url} -> ${uri}`);
    this.listener.dispatchEvent(new ResponseEvent(request, response));
  }

  /**
   * @param {String} args
   * @private
   */
  _log(...args) {
    this._logger(...args);
  }
}
