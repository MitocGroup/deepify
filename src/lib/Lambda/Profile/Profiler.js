/**
 * Created by AlexanderC on 8/17/15.
 */

'use strict';

import {AbstractProfiler} from './AbstractProfiler';
import V8Profiler from './v8ProfilerFallback';
import TraceViewConverter from 'traceviewify';

export class Profiler extends AbstractProfiler {
  /**
   * @param {String} name
   */
  constructor(name = null) {
    super(name);
  }

  /**
   * Start profiling
   */
  start() {
    V8Profiler.startProfiling(this._name);
  }

  /**
   * Stop profiling
   */
  stop() {
    let profile = V8Profiler.stopProfiling(this._name);

    if (!profile) {
      this._lastProfile = {};
      return;
    }

    this._lastProfile = TraceViewConverter(Profiler._normalizeProfile(profile));

    profile.delete();
  }

  /**
   * @param {CpuProfile} profile
   * @returns {Object}
   * @private
   */
  static _normalizeProfile(profile) {
    return JSON.parse(JSON.stringify(profile, null, 2));
  }
}
