/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

export class Option {
  /**
   * @param {String} name
   * @param {String} alias
   * @param {String} description
   * @param {Boolean} required
   */
  constructor(name, alias = null, description = null, required = false) {
    this._name = name;
    this._description = description;
    this._alias = alias;
    this._value = undefined;
    this._exists = false;
    this._required = required;
  }

  /**
   * @param {Array} args
   * @returns {Option}
   */
  collect(args) {
    for (let i in args) {
      if (!args.hasOwnProperty(i)) {
        continue;
      }

      let obj = this._parse(args[i]);

      if (obj) {
        if (obj && (obj.name === this._name || obj.name === this._alias)) {
          this._value = obj.value;

          this._exists = true;

          args.splice(i, 1);
        }
      }
    }

    return this;
  }

  /**
   * @param {String} option
   * @returns {Object}
   * @private
   */
  _parse(option) {
    if (option.indexOf('-') === 0) {
      while (option.indexOf('-') === 0) {
        option = option.substr(1);
      }

      let eqPos = option.indexOf('=');

      if (eqPos !== -1) {
        return {
          name: option.substr(0, eqPos),
          value: option.substr(eqPos + 1),
        };
      } else {
        return {
          name: option,
          value: true,
        };
      }
    }

    return null;
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
  get alias() {
    return this._alias;
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
