/**
 * Created by AlexanderC on 3/11/16.
 */

'use strict';

import FileSystem from 'fs';
import Path from 'path';
import Mime from 'mime';
import {AbstractListener} from './AbstractListener';
import {Tags_Driver_RootAssetsDriver as RootAssetsDriver} from 'deep-package-manager';
import {Tags_Driver_PageLoaderDriver as PageLoaderDriver} from 'deep-package-manager';
import {Tags_Driver_FaviconDriver as FaviconDriver} from 'deep-package-manager';
import {Tags_Driver_VersionDriver as VersionDriver} from 'deep-package-manager';

export class FileListener  extends AbstractListener {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @param {ResponseEvent} event
   */
  handler(event) {
    let request = event.request;
    let uri = this.getUri(request.url);
    let filename = this._resolveMicroservice(uri);

    FileSystem.exists(filename, (exists) => {
      if (!exists) {
        if (this.server.fs.public.existsSync(uri)) {
          filename = Path.join(this.server.fs.public._rootFolder, uri);

          this.server.logger(`{LFS} ${uri} resolved into ${filename}`);
        } else {
          this.server.logger(`File ${filename} not found`);
          event.send404();

          return;
        }
      }

      FileSystem.stat(filename, (error, stats) => {
        if (error) {
          this.server.logger(`Unable to stat file ${filename}: ${error}`);
          event.send500(error);
          return;
        }

        if (stats.isDirectory()) {
          this.server.logger(`Resolving ${filename} into ${filename}/index.html`);

          filename = Path.join(filename, 'index.html');
        }

        FileSystem.readFile(filename, 'binary', (error, file) => {
          if (error) {
            this.server.logger(`Unable to read file ${filename}: ${error}`);
            event.send500(error);
            return;
          }

          file = this._tagInjector(event.request.url, file);

          let mimeType = Mime.lookup(filename);

          this.server.logger(`Serving file ${filename} of type ${mimeType}`);
          event.send(file, 200, mimeType, true);
        });
      });
    });
  }

  /**
   * @param {String} url
   * @param {String} content
   * @returns {String}
   * @private
   */
  _tagInjector(url, content) {
    if (url === '/index.html' || url === '/') {
      let config = this.server.property.config;
      let rootAssetsDriver = new RootAssetsDriver(config.microservices);
      content = rootAssetsDriver.inject(content);

      if (config.globals.pageLoader && config.globals.pageLoader.src) {
        let pageLoaderDriver = new PageLoaderDriver(config.globals.pageLoader, config.microservices);
        content = pageLoaderDriver.inject(content);
      }

      if (config.globals.favicon) {
        let faviconDriver = new FaviconDriver(config.globals.favicon, config.microservices);
        content = faviconDriver.inject(content);
      }

      if (config.globals.version) {
        let versionDriver = new VersionDriver(config.globals.version);
        content = versionDriver.inject(content);
      }
    }

    return content;
  }
}
