/**
 * Created by AlexanderC on 3/11/16.
 */


'use strict';

import {AbstractListener} from './AbstractListener';
import FileSystem from 'fs';
import Path from 'path';
import Mime from 'mime';

export class ConfigListener extends AbstractListener {
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

    if (uri === '/_config.json') {
      event
        .stopPropagation()
        .send(JSON.stringify(this.server.defaultFrontendConfig), 200, 'application/json')
      ;
    }
  }
}
