/**
 * Created by CCristi on 5/11/16.
 */

'use strict';

import {AbstractGenerator} from './AbstractGenerator';
import {Microservice_Instance as Microservice} from 'deep-package-manager';
import path from 'path';
import FSExtra from 'fs-extra';
import Joi from 'joi';

export class MigrationGenerator extends AbstractGenerator {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);
  }
  
  _generate(cb) {
    let microservice = this.generationSchema.microservice;
    let cmdName = this.generationSchema.cmdName;
    let cmdVersion = this.generationSchema.cmdVersion;
    let migrationFolder = microservice.autoload.migration;
    let migrationPath = path.join(migrationFolder, `Version${Date.now()}.js`);
    let templateArgs = {
      name: cmdName,
      version: cmdVersion
    };

    console.log('migrationFolder', migrationFolder);

    FSExtra.ensureDirSync(migrationFolder);
    
    this.renderFile(
      'Data/Migration/migration.js',
      migrationPath,
      templateArgs
    );
    
    cb(null, migrationPath);
  }

  /**
   * @returns {Object}
   */
  validationSchema() {
    return Joi.object().keys({
      microservice: Joi.object().type(Microservice).required(),
      version: Joi.string().required(),
    });
  }
}
