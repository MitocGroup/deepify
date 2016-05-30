/**
 * Created by CCristi on 5/27/16.
 */

'use strict';

import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import {DeepPackageJson} from '../DeepPackageJson';
import {Microservice_Metadata_Autoload as Autoload} from 'deep-package-manager';

export class Injector {
  /**
   * @param {Object} lambdasPathObj
   * @param {Property} property
   * @param {SymbolicLinkStrategy} strategy
   */
  constructor(lambdasPathObj, property, strategy) {
    this._lambdasObj = lambdasPathObj;
    this._property = property;
    this._strategy = strategy;
  }

  /**
   * Inject all
   */
  injectAll() {
    for (let lambdaIdentifier in this._lambdasObj) {
      if (!this._lambdasObj.hasOwnProperty(lambdaIdentifier)) {
        continue;
      }

      let lambdaPath = this._lambdasObj[lambdaIdentifier];
      let sharedLib = this._resolveSharedLib(lambdaIdentifier);

      if (!sharedLib) {
        continue;
      }

      let sharedPackageFile = path.join(sharedLib, 'package.json');
      let lambdaPackageFile = path.join(lambdaPath, 'package.json');
      let deepPackageJson = DeepPackageJson.createFromFile(lambdaPackageFile);

      deepPackageJson.sharedDependencies = fs.existsSync(sharedPackageFile) ?
        fse.readJsonSync(sharedPackageFile) : {};

      this.strategy.injectSharedLib(sharedLib, lambdaPath);

      deepPackageJson.dumpInto(lambdaPackageFile);
    }
  }

  /**
   * @param {String} lambdaIdentifier
   * @returns {null}
   */
  _resolveSharedLib(lambdaIdentifier) {
    let microserviceName = lambdaIdentifier.split(':')[0];
    let microservice = this._property.microservice(microserviceName);
    let sharedBackendPath = microservice.autoload.sharedBackend;

    return fs.existsSync(sharedBackendPath) ? 
      sharedBackendPath : 
      null;
  }

  /**
   * @returns {SymbolicLinkStrategy}
   */
  get strategy() {
    return this._strategy;
  }

  /**
   * @param {SymbolicLinkStrategy} strategy
   */
  set strategy(strategy) {
    this._strategy = strategy;
  }
}
