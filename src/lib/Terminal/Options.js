/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

import {Option} from './Option';
import {OptionObjectRequiredException} from './Exception/OptionObjectRequiredException';
import {OptionsObjectRequiredException} from './Exception/OptionsObjectRequiredException';
import {MissingOptionException} from './Exception/MissingOptionException';

export class Options {
  constructor() {
    this._vector = [];
  }

  /**
   * @returns {Options}
   */
  validate() {
    for (let i in this._vector) {
      if (!this._vector.hasOwnProperty(i)) {
        continue;
      }

      let item = this._vector[i];

      if (item.required && !item.exists) {
        throw new MissingOptionException(item);
      }
    }

    return this;
  }

  /**
   * @param {Options} sibling
   * @returns {Options}
   */
  merge(sibling) {
    if (!(sibling instanceof Options)) {
      throw new OptionsObjectRequiredException();
    }

    sibling.list().forEach((opt) => {
      let selfOpt = this.locate(opt.name);

      if (selfOpt) {
        let selfIdx = this._vector.indexOf(selfOpt);

        this._vector[selfIdx] = opt;
      } else {
        this.add(opt);
      }
    });

    return this;
  }

  /**
   * @param {Array} args
   * @returns {Options}
   */
  populate(args) {
    for (let i in this._vector) {
      if (!this._vector.hasOwnProperty(i)) {
        continue;
      }

      let item = this._vector[i];

      item.collect(args);
    }

    return this;
  }

  /**
   * @param {String} name
   * @returns {Options}
   */
  remove(name) {
    for (let i in this._vector) {
      if (!this._vector.hasOwnProperty(i)) {
        continue;
      }

      let item = this._vector[i];

      if (item.name === name) {
        this._vector.splice(i, 1);

        break;
      }
    }

    return this;
  }

  /**
   * @param {String} name
   * @returns {Option}
   */
  locate(name) {
    for (let i in this._vector) {
      if (!this._vector.hasOwnProperty(i)) {
        continue;
      }

      let item = this._vector[i];

      if (item.name === name) {
        return item;
      }
    }

    return null;
  }

  /**
   * @returns {Options}
   */
  create(...args) {
    return this.add(new Option(...args));
  }

  /**
   * @param {Option} option
   * @returns {Options}
   */
  add(option) {
    if (!(option instanceof Option)) {
      throw new OptionObjectRequiredException();
    }

    this._vector.push(option);

    return this;
  }

  /**
   * @returns {Option[]}
   */
  list() {
    return this._vector;
  }

  /**
   * Parse smth like this:
   *  deepify --resource=somevelue arg1 -- -coptval3 -b optval --dirty -- arg2
   *
   * @param {String[]} args
   */
  static normalizeInputOpts(args) {
    let len = args.length;

    for (let i = 0; i < len; i++) {
      let item = args[i];

      if (Options.SHORT_OPT_REGEX.test(item) ||
        Options.LONG_OPT_REGEX.test(item)) {

        if (!Options.EXPL_OPT_VAL_REGEX.test(item) && i < (len - 1)) {
          if (Options.SL_SHORT_OPT_VAL_REGEX.test(item)) {
            let slMatches = item.match(Options.SL_SHORT_OPT_VAL_REGEX);

            args[i] = `${slMatches[1]}=${slMatches[2]}`;
            continue;
          }

          let nextItem = args[i + 1];

          if(Options.SHORT_OPT_REGEX.test(nextItem) ||
            Options.LONG_OPT_REGEX.test(nextItem)) {
            continue;
          } else if(!Options.SKIP_OPT_VAL_REGEX.test(nextItem)) {
            args[i] = `${item}=${nextItem}`;
          }

          args.splice(i + 1, 1);
          len--;
        }
      }
    }
  }

  /**
   * @returns {RegExp}
   */
  static get SKIP_OPT_VAL_REGEX() {
    return /^--$/;
  }

  /**
   * @returns {RegExp}
   */
  static get EXPL_OPT_VAL_REGEX() {
    return /^--?[a-z0-9]+=.*$/i;
  }

  /**
   * @returns {RegExp}
   */
  static get SL_SHORT_OPT_VAL_REGEX() {
    return /^(-[a-z0-9])([^=].*)$/i;
  }

  /**
   * @returns {RegExp}
   */
  static get SHORT_OPT_REGEX() {
    return /^-[a-z0-9]/i;
  }

  /**
   * @returns {RegExp}
   * @constructor
   */
  static get LONG_OPT_REGEX() {
    return /^--[a-z0-9]/i;
  }
}
