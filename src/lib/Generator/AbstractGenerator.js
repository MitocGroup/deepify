/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/25/16.
 */

'use strict';

import FS from 'fs';
import Core from 'deep-core';
import path from 'path';
import Joi from 'joi';
import {TwigEngine} from './TemplatingEngine/TwigEngine';
import {InvalidGenerationSchema} from './Exception/InvalidGenerationSchema';
import {MissingTemplateException} from './Exception/MissingTemplateException';

/**
 * Abstract Generator
 */
export class AbstractGenerator extends Core.OOP.Interface {
  /**
   * @param {Object} templatingEngine
   * @param {String} skeletonsDirectory
   */
  constructor(templatingEngine = AbstractGenerator.TWIG_TEMPLATING,
              skeletonsDirectory = AbstractGenerator.DEFAULT_SKELETONS_DIR) {
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
   * @param {String} template
   * @param {Object} params
   * @returns {Object}
   */
  render(template, params = {}) {
    if (!this.templateExists(template)) {
      throw new MissingTemplateException(template);
    }

    let templateContent = FS
      .readFileSync(this.templatePath(template))
      .toString();

    return this.templatingEngine.render(templateContent, params);
  }

  /**
   * @param {String} targetFile
   * @param {String} template
   * @param {Object} params
   */
  renderFile(template, targetFile, params = {}) {
    FS.writeFileSync(
      targetFile,
      this.render(template, params)
    );
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
   * @param {String} template
   * @returns {String}
   */
  templatePath(template) {
    return path.join(this._skeletonsDirectory, `${template}${this._templatingEngine.extension()}`);
  }

  /**
   * @param {String} template
   * @returns {Boolean}
   */
  templateExists(template) {
    let fullPath = this.templatePath(template);

    return FS.existsSync(fullPath) && FS.lstatSync(fullPath).isFile();
  }

  /**
   * @returns {TwigEngine}
   */
  static get TWIG_TEMPLATING() {
    return new TwigEngine();
  }

  /**
   * @returns {String}
   */
  static get DEFAULT_SKELETONS_DIR() {
    return path.join(__dirname, '../../resources/skeletons');
  }

  /**
   * @returns {RegExp}
   */
  static get DEEP_NAME_REGEXP() {
    return /^[a-zA-Z0-9_\-]{2,}$/;
  }
}
