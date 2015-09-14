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
    if (!sibling instanceof Options) {
      throw new OptionsObjectRequiredException();
    }

    this._vector = this._vector.concat(sibling.list());

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
   * @param {String} name
   * @param {String} alias
   * @param {String} description
   * @param {Boolean} required
   * @returns {Options}
   */
  create(name, alias = null, description = null, required = false) {
    let option = new Option(name, alias, description, required);

    return this.add(option);
  }

  /**
   * @param {Option} option
   * @returns {Options}
   */
  add(option) {
    if (!option instanceof Option) {
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
}
