/**
 * Created by AlexanderC on 8/18/15.
 */

'use strict';

var _Runtime = require('./Runtime');

var _LambdaProfileStaticDumpFileProfiler = require('../Lambda/Profile/StaticDumpFileProfiler');

/**
 *
 * @param {Runtime} runtime
 * @param {Object} event
 * @param {Boolean} measureTime
 */
var run = function run(runtime, event, measureTime) {
  runtime.succeed = (function (result) {
    process.send({
      state: 'succeed',
      profile: runtime.profiler ? runtime.profiler.profile : null,
      args: [result]
    });
  }).bind(this);

  runtime.fail = (function (error) {
    process.send({
      state: 'fail',
      profile: runtime.profiler ? runtime.profiler.profile : null,
      args: [error]
    });
  }).bind(this);

  runtime.run(event, measureTime);
};

var args = process.argv;

args.shift();
args.shift();

var rawRuntime = JSON.parse(args[0]);

var runtime = _Runtime.Runtime.createLambda(rawRuntime._lambdaPath, rawRuntime._awsConfigFile);
runtime.name = rawRuntime._name;

if (rawRuntime._profiler) {
  runtime.profiler = new _LambdaProfileStaticDumpFileProfiler.StaticDumpFileProfiler(rawRuntime._profiler._name, rawRuntime._profiler._dumpFile);
}

run(runtime, JSON.parse(args[1]), args.length > 2 ? args[2] : undefined);