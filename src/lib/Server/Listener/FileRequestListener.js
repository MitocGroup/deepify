'use strict';
import FileSystem from 'fs';
import Path from 'path';
import Mime from 'mime';
import {AbstractRequestListener} from './AbstractRequestListener';
import {Tags_Driver_RootAssetsDriver as RootAssetsDriver} from 'deep-package-manager';
import {Tags_Driver_PageLoaderDriver as PageLoaderDriver} from 'deep-package-manager';

export class FileRequestListener  extends AbstractRequestListener {

  /**
   *
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);

    this._server.listener.registerFileRequestListener((...args) => {
      this._handler(...args);
    });
  }

  /**
   *
   * @param {ResponseEvent} event
   * @private
   */
  _handler(event) {
    let request = event.request;
    let uri = this.getUri(request.url);
    let filename = this._resolveMicroservice(uri);

    if (this.isLambdaRequest(uri)) {
      return;
    }

    if (uri === '/_config.json') {
      if (!this._server.buildPath) {
        return;
      }

      this._server.logger(`Triggering frontend config hook...`);

      filename = Path.join(this._server.buildPath, '_www', this.getUri(request.url));
    }

    FileSystem.exists(filename, (exists) => {
      if (!exists) {
        if (this._server.fs.public.existsSync(uri)) {
          filename = Path.join(this._server.fs.public._rootFolder, uri);

          this._server.logger(`{LFS} ${uri} resolved into ${filename}`);
        } else {
          this._server.logger(`File ${filename} not found`);
          event.send404();

          return;
        }
      }

      FileSystem.stat(filename, (error, stats) => {
        if (error) {
          this._server.logger(`Unable to stat file ${filename}: ${error}`);
          event.send500(error);
          return;
        }

        if (stats.isDirectory()) {
          this._server.logger(`Resolving ${filename} into ${filename}/index.html`);

          filename = Path.join(filename, 'index.html');
        }

        FileSystem.readFile(filename, 'binary', (error, file) => {
          if (error) {
            this._server.logger(`Unable to read file ${filename}: ${error}`);
            event.send500(error);
            return;
          }

          file = this._tagInjector(event.request.url, file);

          let mimeType = Mime.lookup(filename);

          this._server.logger(`Serving file ${filename} of type ${mimeType}`);
          event.send(file, 200, mimeType, true);
        });
      });
    });
  }

  /**
   *
   * @param {String} url
   * @param {String} content
   * @returns {String}
   * @private
   */
  _tagInjector(url, content) {
    if (url === '/index.html' || url === '/') {
      let config = this._server.property.config;
      var rootAssetsDriver = new RootAssetsDriver(config.microservices);
      content = rootAssetsDriver.inject(content);

      if (config.globals.pageLoader && config.globals.pageLoader.src) {
        var pageLoaderDriver = new PageLoaderDriver(config.globals.pageLoader, config.microservices);
        content = pageLoaderDriver.inject(content);
      }
    }

    return content;
  }
}
