/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

export class Argument {
  /**
   * @param {String} name
   * @param {String} description
   * @param {Boolean} required
   * @param {Boolean} hidden
   */
  constructor(name, description = null, required = false, hidden = false) {
    this._name = name;
    this._description = description;
    this._required = required;
    this._hidden = hidden;

    this._value = undefined;
    this._exists = false;
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
   * @returns {Boolean}
   */
  get hidden() {
    return this._hidden;
  }

  /**
   * @param {Boolean} state
   */
  set hidden(state) {
    this._hidden = state;
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
