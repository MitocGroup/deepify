/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/25/16.
 */

'use strict';

import FS from 'fs';
import Core from 'deep-core';
import path from 'path';
import Joi from 'joi';
import {InvalidGenerationSchema} from './Exception/InvalidGenerationSchema';
import FSe from 'fs-extra';
import {MustacheEngine} from './TemplatingEngine/MustacheEngine';

/**
 * Abstract Generator
 */
export class AbstractGenerator extends Core.OOP.Interface {
  /**
   * @param {Object} templatingEngine
   * @param {String} skeletonsDirectory
   */
  constructor(templatingEngine = AbstractGenerator.MUSTACHE_TEMPLATING,
              skeletonsDirectory = '/Users/ccristi/mitocgroup/deep-microservices-skeleton/src/DeepSkeleton') {
    super('validationSchema', '_generate');

    this._templatingEngine = templatingEngine;
    this._skeletonsDirectory = skeletonsDirectory;
    this._targetPath = null;
    this._generationSchema = null;
  }

  /**
   * @returns {String}
   */
  get skeletonsDirectory() {
    return this._skeletonsDirectory;
  }

  /**
   * @returns {Object}
   */
  get templatingEngine() {
    return this._templatingEngine;
  }

  /**
   * @returns {String|null}
   */
  get targetPath() {
    return this._targetPath;
  }

  /**
   * @returns {Object|null}
   */
  get generationSchema() {
    return this._generationSchema;
  }

  /**
   * @param {Object} template
   * @param {Object} params
   * @returns {Object}
   */
  render(template, params = {}) {
    let templatePath = path.join(this._skeletonsDirectory, template);

    if (!FS.existsSync(templatePath)) {
      console.error(`${template} doesn't exists`);
      return;
    }

    let templateContent = FS.readFileSync(templatePath).toString();

    return this.templatingEngine.render(templateContent, params);
  }

  /**
   * @param {String} targetFile
   * @param {Object} template
   * @param {Object} params
   */
  renderFile(template, targetFile, params = {}) {
    FS.writeFileSync(
      targetFile,
      this.render(template, params)
    );
  }

  /**
   * @param dirList
   */
  ensureTargetDir(...dirList) {
    dirList.forEach((dir) => {
      FSe.ensureDirSync(path.join(this._targetPath, dir));
    });
  }

  /**
   * @param {String} targetDir
   * @param {Object} generationSchema
   * @param {Function} cb
   */
  generate(targetDir, generationSchema, cb = () => {}) {
    let validationResult = Joi.validate(generationSchema, this.validationSchema(), {
      stripUnknown: true,
      convert: true,
      abortEarly: false,
    });

    if (validationResult.error) {
      cb(new InvalidGenerationSchema(this.constructor.name, validationResult.error));
      return;
    }

    this._targetPath = targetDir;
    this._generationSchema = validationResult.value;

    this._generate(cb);
  }

  /**
   * @returns {MustacheEngine}
   */
  static get MUSTACHE_TEMPLATING() {
    return new MustacheEngine();
  }
}
