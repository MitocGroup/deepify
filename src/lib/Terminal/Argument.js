/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

export class Argument {
  /**
   * @param {String} name
   * @param {String} description
   * @param {Boolean} required
   */
  constructor(name, description = null, required = false) {
    this._name = name;
    this._description = description;
    this._value = undefined;
    this._exists = false;
    this._required = required;
  }

  /**
   * @param {String} arg
   * @returns {Boolean}
   */
  static _matchNonOption(arg) {
    return arg.indexOf('-') !== 0;
  }

  /**
   * @param {Array} args
   * @returns {Argument}
   */
  collect(args) {
    for (let i in args) {
      if (!args.hasOwnProperty(i)) {
        continue;
      }

      let arg = args[i];

      if (Argument._matchNonOption(arg)) {
        this._value = arg;
        this._exists = true;

        args.splice(i, 1);

        break;
      }
    }

    return this;
  }

  /**
   * @param {Boolean} state
   */
  set required(state) {
    this._required = state;
  }

  /**
   * @returns {Boolean}
   */
  get required() {
    return this._required;
  }

  /**
   * @returns {*}
   */
  get value() {
    return this._value;
  }

  /**
   * @returns {Boolean}
   */
  get exists() {
    return this._exists;
  }

  /**
   * @returns {String}
   */
  get name() {
    return this._name;
  }

  /**
   * @returns {String}
   */
  get description() {
    return this._description;
  }
}
