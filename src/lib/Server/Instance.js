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
import {AsyncConfig} from '../Helpers/AsyncConfig';
import {RequestListener} from './Listener/RequestListener';
import {ConfigListener} from './Listener/ConfigListener';
import {AsyncConfigListener} from './Listener/AsyncConfigListener';
import {FileListener} from './Listener/FileListener';
import {LambdaListener} from './Listener/LambdaListener';
import {Server as ESServer} from '../Elasticsearch/Server';

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
    this._es = new ESServer(property);

    this._host = null;

    this._localId = 0;
    this._profiling = false;

    this._defaultFrontendConfig = {};
    this._defaultLambdasConfig = {};

    this._rootMicroservice = {};
    this._microservices = {};

    this._events = {};
    this._events[Instance.RESPONSE_EVENT] = [];

    this._setup();

    this._asyncConfig = new AsyncConfig(this);
    this._listener = new RequestListener(this);
    this._listener
      .register(new ConfigListener(), 0)
      .register(new AsyncConfigListener(this), 1)
      .register(new LambdaListener(this), 2)
      .register(new FileListener(this), 3);
  }

  /**
   * @returns {DeepFS}
   */
  get fs() {
    return this._fs;
  }

  /**
   * @returns {ES}
   */
  get es() {
    return this._es;
  }

  /**
   * @returns {AsyncConfig}
   */
  get asyncConfig() {
    return this._asyncConfig;
  }

  /**
   * @returns {String}
   */
  get host() {
    return this._host;
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

    this._defaultFrontendConfig = Frontend.createConfig(this._property.config, true);
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
        // do not return a real microservice identifier
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
      this._es.launchInstances();

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
