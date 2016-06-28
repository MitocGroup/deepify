/**
 * Created by AlexanderC on 3/11/16.
 */

'use strict';

import FileSystem from 'fs';
import Path from 'path';
import Mime from 'mime';
import {AbstractListener} from './AbstractListener';

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
}
