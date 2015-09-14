/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

import {Program} from './Program';
import {ProgramInstanceRequiredException} from './Exception/ProgramInstanceRequiredException';

export class Help {
  /**
   * @param {Program} program
   */
  constructor(program) {
    this._program = program;

    if (!program instanceof Program) {
      throw new ProgramInstanceRequiredException();
    }
  }

  /**
   * @returns {Program}
   */
  get program() {
    return this._program;
  }

  /**
   * @returns {Help}
   */
  print() {
    this
      ._printHead()
      ._printExample()
      ._printArgs()
      ._printCommands()
    ;

    return this;
  }

  /**
   * @returns {Help}
   * @private
   */
  _printCommands() {
    if (this._program.hasCommands) {
      let commands = this._program.commands;

      console.log('Available commands: ');

      for (let i in commands) {
        if (!commands.hasOwnProperty(i)) {
          continue;
        }

        let cmd = commands[i];

        console.log(`   ${cmd.name}: ${Help._stringify(cmd.description)}`);
      }
    }

    console.log('');

    return this;
  }

  /**
   * @returns {Help}
   * @private
   */
  _printOpts() {
    let opts = this._program.opts.list();

    console.log('Options:', opts.length <= 0 ? 'None' : '');

    if (opts.length > 0) {
      for (let i in opts) {
        if (!opts.hasOwnProperty(i)) {
          continue;
        }

        let opt = opts[i];

        let add = '';

        if (opt.alias) {
          add = `|-${opt.alias}`;
        }

        console.log(`   --${opt.name}${add}: ${Help._stringify(opt.description)}`);
      }

      console.log('');
    }

    return this;
  }

  /**
   * @returns {Help}
   * @private
   */
  _printArgs() {
    let args = this._program.args.list();

    console.log('Arguments:', args.length <= 0 ? 'None' : '');

    if (args.length > 0) {
      for (let i in args) {
        if (!args.hasOwnProperty(i)) {
          continue;
        }

        let arg = args[i];

        console.log(`   ${Help._stringify(arg.name)}: ${Help._stringify(arg.description)}`);
      }

      console.log('');
    }

    return this;
  }

  /**
   * @returns {Help}
   * @private
   */
  _printExample() {
    if (this._program.example) {
      console.log(`Usage example: ${this._program.example}`);
      console.log('');
    }

    return this;
  }

  /**
   * @returns {Help}
   * @private
   */
  _printHead() {
    console.log('');
    console.log(
      `${Help._stringify(this._program.name)}@${Help._stringify(this._program.version)} -`,
      Help._stringify(this._program.description)
    );
    console.log('');

    return this;
  }

  /**
   * @param {*} value
   * @returns {*}
   * @private
   */
  static _stringify(value) {
    if (value === undefined || value === null) {
      return 'unknown';
    } else if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    return value.toString();
  }
}
