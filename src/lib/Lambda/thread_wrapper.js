/**
 * Created by AlexanderC on 8/18/15.
 */

/* eslint no-undefined: 1 */

'use strict';

import {Runtime} from './Runtime';
import {ForksManager} from './ForksManager';

// avoid process to be killed when some async calls are still active!
ForksManager.registerListener();

let args = process.argv;

// @todo: remove this hack
args.shift();
args.shift();

let rawRuntime = JSON.parse(args[0]);

let runtime = Runtime.createLambda(rawRuntime._lambdaPath, rawRuntime._dynamicContext);
runtime.name = rawRuntime._name;

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
        args: [result],
      });
    }
  };

  runtime.fail = (error) => {
    if (assureContextNotSent(error)) {
      if (typeof error !== 'string') {
        try {
          error = JSON.parse(error);
        } catch (e) {
          console.error('Unable to parse error: ', error)
        }
      }

      process.send({
        state: 'fail',
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
