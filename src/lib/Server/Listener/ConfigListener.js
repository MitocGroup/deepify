'use strict';
import {AbstractListener} from './AbstractListener';
import FileSystem from 'fs';
import Path from 'path';
import Mime from 'mime';

export class ConfigListener extends AbstractListener {

  /**
   *
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   *
   * @param {ResponseEvent} event
   */
  handler(event) {
    let request = event.request;
    let uri = this.getUri(request.url);

    if (uri === '/_config.json') {
      event.stopPropagation(); // stop other listeners

      if (this.server.buildPath) {
        this.server.logger(`Triggering frontend config hook...`);

        filename = Path.join(this.server.buildPath, '_www', uri);

        FileSystem.exists(filename, (exists) => {
          if (!exists) {
            this.server.logger(`File ${filename} not found`);
            event.send404();
          }

          FileSystem.readFile(filename, 'binary', (error, file) => {
            if (error) {
              this.server.logger(`Unable to read file ${filename}: ${error}`);
              event.send500(error);
              return;
            }

            let mimeType = Mime.lookup(filename);

            this.logger(`Serving file ${filename} of type ${mimeType}`);
            event.send(file, 200, mimeType, true);
          });
        });
      } else {
        event.send(JSON.stringify(this.server.defaultFrontendConfig), 200, 'application/json');
      }
    }
  }
}
