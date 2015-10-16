/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

import {Argument} from './Argument';
import {ArgumentObjectRequiredException} from './Exception/ArgumentObjectRequiredException';
import {ArgumentsObjectRequiredException} from './Exception/ArgumentsObjectRequiredException';
import {MissingArgumentException} from './Exception/MissingArgumentException';

export class Arguments {
  constructor() {
    this._vector = [];
    this._unmanagedVector = [];
  }

  /**
   * @returns {Arguments}
   */
  validate() {
    for (let i in this._vector) {
      if (!this._vector.hasOwnProperty(i)) {
        continue;
      }

      let item = this._vector[i];

      if (item.required && !item.exists) {
        throw new MissingArgumentException(item);
      }
    }

    return this;
  }

  /**
   * @param {Arguments} sibling
   * @returns {Arguments}
   */
  merge(sibling) {
    if (!sibling instanceof Arguments) {
      throw new ArgumentsObjectRequiredException();
    }

    this._vector = this._vector.concat(sibling.list());
    this._unmanagedVector = this._unmanagedVector.concat(sibling.listUnmanaged());

    return this;
  }

  /**
   * @param {Array} args
   * @returns {Arguments}
   */
  populateUnmanaged(args) {
    for (let i in args) {
      if (!args.hasOwnProperty(i)) {
        continue;
      }

      let item = args[i];

      if (Argument._matchNonOption(item)) {
        this._unmanagedVector.push(item);
      }
    }

    return this;
  }

  /**
   * @param {Array} args
   * @returns {Arguments}
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
   * @returns {Arguments}
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
   * @returns {Argument}
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
   * @returns {Arguments}
   */
  create(...args) {
    return this.add(new Argument(...args));
  }

  /**
   * @param {Argument} argument
   * @returns {Arguments}
   */
  add(argument) {
    if (!argument instanceof Argument) {
      throw new ArgumentObjectRequiredException();
    }

    this._vector.push(argument);

    return this;
  }

  /**
   * @returns {Boolean}
   */
  get hasUnmanaged() {
    return this._unmanagedVector.length > 0;
  }

  /**
   * @param {Boolean} includeUnmanaged
   * @returns {String[]}
   */
  listValues(includeUnmanaged = true) {
    let valuesVector = [];

    for (let i in this._vector) {
      if (!this._vector.hasOwnProperty(i)) {
        continue;
      }

      let item = this._vector[i];

      if (!item.exists) {
        break;
      }

      valuesVector.push(item.value);
    }

    if (includeUnmanaged) {
      valuesVector = valuesVector.concat(this._unmanagedVector);
    }

    return valuesVector;
  }

  /**
   *
   * @returns {String[]}
   */
  listUnmanaged() {
    return this._unmanagedVector;
  }

  /**
   * @returns {Argument[]}
   */
  list() {
    return this._vector;
  }
}
