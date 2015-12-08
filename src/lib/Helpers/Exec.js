/**
 * Created by AlexanderC on 12/1/15.
 */

'use strict';

import ChildProcess from 'child_process';
import syncExec from 'sync-exec';

export class Exec {
  /**
   * @param {String} cmd
   * @param {String|*} args
   */
  constructor(cmd, ...args) {
    this._cmd = cmd;
    this._args = args;

    this._error = null;
    this._isExec = false;
    this._devNull = false;
    this._result = null;

    this._cwd = process.cwd();
  }

  /**
   * @returns {String}
   */
  get cwd() {
    return this._cwd;
  }

  /**
   * @param {String} path
   */
  set cwd(path) {
    this._cwd = path;
  }

  /**
   * @returns {String|null}
   */
  get result() {
    this._assureCmdExecuted();

    return this._result;
  }

  /**
   * @returns {Boolean}
   */
  get succeed() {
    return !this.error;
  }

  /**
   * @returns {Boolean}
   */
  get failed() {
    return !!this.error;
  }

  /**
   * @returns {String|Error|null}
   */
  get error() {
    this._assureCmdExecuted();

    return this._error;
  }

  /**
   * @returns {Exec}
   */
  avoidBufferOverflow() {
    this._devNull = true;

    return this;
  }

  /**
   * @returns {String}
   */
  get cmd() {
    return this._cmd;
  }

  /**
   * @returns {Array}
   */
  get args() {
    return this._args;
  }

  /**
   * @returns {Exec}
   */
  runSync() {
    this._isExec = true;

    let result = syncExec(this._fullCmd, {
      cwd: this._cwd,
    });

    this._checkError(result.status);

    if (this.succeed) {
      this._result = result.stdout.toString().trim();
    }

    return this;
  }

  /**
   * @param {Function} cb
   * @param {Boolean} pipeOutput
   * @returns {Exec}
   */
  run(cb, pipeOutput = false) {
    this._isExec = true;

    if (pipeOutput) {
      return this._spawn(cb);
    }

    return this._exec(cb);
  }

  /**
   * @param {Boolean} increase
   * @param {EventEmitter|*} emitters
   * @private
   */
  static _tweakProcessListeners(increase = true, ...emitters) {
    /**
     * @type {EventEmitter[]}
     */
    emitters = [
      process,
      process.stdout,
      process.stderr,
      process.stdin,
    ].concat(emitters);

    for (let i in emitters) {
      if (!emitters.hasOwnProperty(i)) {
        continue;
      }

      let emitter = emitters[i];

      if (increase) {
        emitter.setMaxListeners(emitter.getMaxListeners() + 1);
      } else {
        emitter.setMaxListeners(Math.max(emitter.getMaxListeners() - 1, 0));
      }
    }
  }

  /**
   * @param {Function} cb
   * @returns {Exec}
   * @private
   */
  _spawn(cb) {
    let cmdParts = this._cmd.trim().split(' ');
    let realCmd = cmdParts.shift();
    let realArgs = cmdParts.concat(this._args);
    let uncaughtError = false;

    let proc = ChildProcess.spawn(realCmd, realArgs, {
      cwd: this._cwd,
      stdio: [process.stdin, 'pipe', 'pipe'],
    });

    Exec._tweakProcessListeners(true, proc);

    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);

    proc.stdout.on('data', (data) => {
      if (!this._result) {
        this._result = '';
      }

      this._result += data.toString();
    });

    proc.on('uncaughtException', (error) => {
      uncaughtError = true;

      Exec._tweakProcessListeners(false, proc);

      this._error = error;

      cb(this);
    });

    proc.on('close', (code) => {
      if (uncaughtError) {
        return;
      }

      Exec._tweakProcessListeners(false, proc);

      this._checkError(code);

      if (this.succeed && this._result) {
        this._result = this._result.trim();
      }

      cb(this);
    });

    return this;
  }

  /**
   * @param {Function} cb
   * @returns {Exec}
   * @private
   */
  _exec(cb) {
    ChildProcess.exec(this._fullCmd, {
      cwd: this._cwd,
    }, (error, stdout) => {
      if (error) {
        this._error = new Error(
          `Command '${this._fullCmd}' failed in '${this._cwd}' with error: ${error}`
        );
      } else {
        this._result = stdout.toString().trim();
      }

      cb(this);
    });

    return this;
  }

  /**
   * @param {String|Number} code
   * @private
   */
  _checkError(code) {
    if (parseInt(code) !== 0) {
      this._error = new Error(`Command '${this._fullCmd}' failed in '${this._cwd}' with exit code ${code}`);
    }
  }

  /**
   * @returns {String}
   * @private
   */
  get _fullCmd() {
    return `${this._cmd} ${this._args.join(' ')} ${this._internalCmdSuffix}`.trim();
  }

  /**
   * @returns {String}
   * @private
   */
  get _internalCmdSuffix() {
    return this._devNull ? '&>/dev/null' : '';
  }

  /**
   * @private
   */
  _assureCmdExecuted() {
    if (!this._isExec) {
      throw new Error(`Command '${this._fullCmd}' is not yet executed (cwd: '${this._cwd}')`);
    }
  }
}
