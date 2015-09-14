/**
 * Created by AlexanderC on 8/17/15.
 */

'use strict';

import {AbstractProfiler} from './AbstractProfiler';
import V8Profiler from 'v8-profiler';
import TraceViewConverter from 'traceviewify';

export class Profiler extends AbstractProfiler {
  /**
   * @param {String} name
   */
  constructor(name = null) {
    super(name);
  }

  start() {
    V8Profiler.startProfiling(this._name);
  }

  stop() {
    this._lastProfile = TraceViewConverter(V8Profiler.stopProfiling(this._name));
  }
}
