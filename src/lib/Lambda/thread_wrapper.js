/**
 * Created by AlexanderC on 8/18/15.
 */

'use strict';

import {Runtime} from './Runtime';
import {StaticDumpFileProfiler} from '../Lambda/Profile/StaticDumpFileProfiler';

let args = process.argv;

// @todo: remove this hack
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

/**
 *
 * @param {Runtime} runtime
 * @param {Object} event
 * @param {Boolean} measureTime
 */
((runtime, event, measureTime) => {
  let contextSent = false;

  let assureContextNotSent = (thing) => {
    if (!contextSent) {
      contextSent = true;

      return true;
    }

    console.error(`Trying to send ${runtime.name} Lambda context more times!`, thing);

    return false;
  };

  runtime.succeed = (result) => {
    if (assureContextNotSent(result)) {
      process.send({
        state: 'succeed',
        profile: runtime.profiler ? runtime.profiler.profile : null,
        args: [result],
      });
    }
  };

  runtime.fail = (error) => {
    if (assureContextNotSent(error)) {
      process.send({
        state: 'fail',
        profile: runtime.profiler ? runtime.profiler.profile : null,
        args: [error],
      });
    }
  };

  runtime.run(event, measureTime);
})(
  runtime,
  JSON.parse(args[1]),
  args.length > 2 ? args[2] : undefined
);
