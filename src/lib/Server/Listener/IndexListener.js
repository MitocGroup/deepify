/**
 * Created by CCristi on 6/28/16.
 */

'use strict';

import {AbstractListener} from './AbstractListener';
import {Tags_Driver_RootAssetsDriver as RootAssetsDriver} from 'deep-package-manager';
import {Tags_Driver_PageLoaderDriver as PageLoaderDriver} from 'deep-package-manager';
import {Tags_Driver_FaviconDriver as FaviconDriver} from 'deep-package-manager';
import {Tags_Driver_DeepEnvPlaceholderDriver as DeepEnvPlaceholderDriver} from 'deep-package-manager';
import {Tags_Driver_VersionDriver as VersionDriver} from 'deep-package-manager';
import fs from 'fs';
import path from 'path';

export class IndexListener extends AbstractListener {
  constructor(...args) {
    super(...args);

    this._workingMicroservice = this.rootMicroservice;
  }

  /**
   * @param {ResponseEvent} event
   */
  handler(event) {
    let request = event.request;
    let uri = this.getUri(request.url);

    if (['/', `/${IndexListener.INDEX_FILE}`].indexOf(uri) !== -1) {
      let htmlContent = fs
        .readFileSync(this._findSuitableIndexFile())
        .toString();
      
      htmlContent = this._injectTags(htmlContent);

      event
        .stopPropagation()
        .send(htmlContent, 200, 'text/html')
    }
  }

  /**
   * @returns {String}
   * @private
   */
  _findSuitableIndexFile() {
    let microservices = this.microservices;

    for (let identifier in microservices) {
      if (!microservices.hasOwnProperty(identifier)) {
        continue;
      }

      let microservice = microservices[identifier];
      let indexFile = path.join(microservice.frontend, IndexListener.INDEX_FILE);

      if (fs.existsSync(indexFile)) {
        this._workingMicroservice = microservice;

        return indexFile;
      }
    }

    return path.join(this.rootMicroservice.frontend, IndexListener.INDEX_FILE);
  }

  /**
   * @param {String} content
   * @returns {String}
   * @private
   */
  _injectTags(content) {
    let config = this.server.property.config;
    let globalConfig = config.globals;
    let drivers = [];

    drivers.push(new RootAssetsDriver(config.microservices));
    drivers.push(new DeepEnvPlaceholderDriver(this._workingMicroservice));

    if (globalConfig.pageLoader && globalConfig.pageLoader.src) {
      drivers.push(new PageLoaderDriver(globalConfig.pageLoader, config.microservices));
    }

    if (globalConfig.favicon) {
      drivers.push(new FaviconDriver(globalConfig.favicon, config.microservices));
    }

    if (globalConfig.version) {
      drivers.push(new VersionDriver(globalConfig.version));
    }

    return drivers.reduce((content, driver) => {
      return driver.inject(content);
    }, content);
  }

  /**
   * @returns {Object}
   */
  get microservices() {
    return this.server.microservices;
  }

  /**
   * @returns {Object}
   */
  get rootMicroservice() {
    return this.server.rootMicroservice;
  }

  /**
   * @returns {String}
   */
  static get INDEX_FILE() {
    return 'index.html';
  }
}
