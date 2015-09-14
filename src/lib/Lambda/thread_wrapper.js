/**
 * Created by AlexanderC on 8/18/15.
 */

'use strict';

import {Runtime} from './Runtime';
import {StaticDumpFileProfiler} from '../Lambda/Profile/StaticDumpFileProfiler';

/**
 *
 * @param {Runtime} runtime
 * @param {Object} event
 * @param {Boolean} measureTime
 */
let run = function(runtime, event, measureTime) {
  runtime.succeed = function(result) {
    process.send({
      state: 'succeed',
      profile: runtime.profiler ? runtime.profiler.profile : null,
      args: [result],
    });
  }.bind(this);

  runtime.fail = function(error) {
    process.send({
      state: 'fail',
      profile: runtime.profiler ? runtime.profiler.profile : null,
      args: [error],
    });
  }.bind(this);

  runtime.run(event, measureTime);
};

let args = process.argv;

args.shift();
args.shift();

let rawRuntime = JSON.parse(args[0]);

let runtime = Runtime.createLambda(rawRuntime._lambdaPath, rawRuntime._awsConfigFile);
runtime.name = rawRuntime._name;

if (rawRuntime._profiler) {
  runtime.profiler = new StaticDumpFileProfiler(
    rawRuntime._profiler._name,
    rawRuntime._profiler._dumpFile
  );
}

run(
  runtime,
  JSON.parse(args[1]),
  args.length > 2 ? args[2] : undefined
);
