/**
 * Created by CCristi on 5/27/16.
 */

'use strict';

import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import {StrategyInterface} from './StrategyInterface';
import {Microservice_Metadata_Autoload as Autoload} from 'deep-package-manager';

export class FSCopyStrategy extends StrategyInterface {
  constructor() {
    super();
  }

  /**
   * @param {String} shareLib
   * @param {String} lambdaPath
   */
  injectSharedLib(shareLib, lambdaPath) {
    let sharedLibDest = path.join(lambdaPath, Autoload.SHARED_BACKEND_FOLDER);

    fs.existsSync(sharedLibDest) && fse.removeSync(sharedLibDest);
    fse.copySync(shareLib, sharedLibDest);
    
    return sharedLibDest;
  }
}