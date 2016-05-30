/**
 * Created by CCristi on 5/27/16.
 */

'use strict';

import {Microservice_Metadata_Autoload as Autoload} from 'deep-package-manager';
import fs from 'fs';
import path from 'path';
import {StrategyInterface} from './StrategyInterface';
import {Exec} from '../../Exec';

export class SymbolicLinkStrategy extends StrategyInterface {
  constructor() {
    super();
  }

  /**
   * @param {String} sharedLib
   * @param {String} lambdaPath
   */
  injectSharedLib(sharedLib, lambdaPath) {
    let sharedLibSymlink = path.join(lambdaPath, Autoload.SHARED_BACKEND_FOLDER);
    let lnsCmd = new Exec(
      'ln -s',
      path.relative(lambdaPath, sharedLib),
      sharedLibSymlink
    );

    fs.existsSync(sharedLibSymlink) && fs.unlinkSync(sharedLibSymlink);
    lnsCmd.runSync();
    
    return sharedLibSymlink;
  }
}
