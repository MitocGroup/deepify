'use strict';

import {expect} from 'chai';
import path from 'path';
import {Runtime} from '../../lib/Lambda/Runtime';
import {Timer} from '../../lib/Lambda/Timer';

suite('Lambda/Runtime', () => {
  let runtime = null;
  let lambda = {
    name: 'testLambda',
    handler: () => {},
  };
  let lambdaPath = path.join(__dirname + './../TestMaterials/Lambda/lambda');

  test('Class Runtime exists in Lambda/Runtime', () => {
    expect(Runtime).to.be.an('function');
  });

  test('Check constructor sets _lambda', () => {
    runtime = new Runtime(lambda);

    expect(runtime).to.be.an.instanceOf(Runtime);
    expect(runtime.lambda).to.eql(lambda);
  });

  test('Check constructor sets _measureTime = false', () => {
    expect(runtime.measureTime).to.equal(false);
  });

  test('Check constructor sets _timer = null', () => {
    expect(runtime._timer).to.equal(null);
  });

  test('Check constructor sets _silent = false', () => {
    expect(runtime.silent).to.equal(false);
  });

  test('Check constructor sets _name ', () => {
    expect(runtime.name).to.not.equal('');
  });

  test('Check constructor sets _lambdaPath = null', () => {
    expect(runtime.lambdaPath).to.equal(null);
  });

  test('Check constructor sets _awsConfigFile = null', () => {
    expect(runtime._awsConfigFile).to.equal(null);
  });

  test('Check ENVIRONMENT static getter', () => {
    expect(Runtime.ENVIRONMENT).to.equal('local');
  });

  test('Check SIBLING_EXEC_WRAPPER_NAME static getter', () => {
    expect(Runtime.SIBLING_EXEC_WRAPPER_NAME).to.equal('_deep_lambda_exec_');
  });

  test('Check createLambda()', () => {
    let actualResult = Runtime.createLambda(lambdaPath);

    expect(actualResult).to.be.an.instanceOf(Runtime);
    expect(actualResult.awsConfigFile).to.be.equal(null);
  });

  test('Check complete setter/getter', () => {
    let cb = () => {
      return 'test cb';
    };
    let complete = runtime.complete;

    runtime.complete = cb;
    expect(runtime.complete).to.equal(cb);

    runtime.complete = null;
    expect(runtime.complete).to.equal(null);

    runtime.complete = complete;
    expect(runtime.complete).to.equal(complete);
  });

  test('Check fail setter/getter', () => {
    let cb = () => {
      return 'test cb fail';
    };
    let fail = runtime.fail;

    runtime.fail = cb;
    expect(runtime.fail).to.equal(cb);

    runtime.fail = null;
    expect(runtime.fail).to.equal(null);

    runtime.fail = fail;
    expect(runtime.fail).to.equal(fail);
  });

  test('Check succeed setter/getter', () => {
    let cb = () => {
      return 'test cb succeed';
    };
    let succeed = runtime.succeed;

    runtime.succeed = cb;
    expect(runtime.succeed).to.equal(cb);

    runtime.succeed = null;
    expect(runtime.succeed).to.equal(null);

    runtime.succeed = succeed;
    expect(runtime.succeed).to.equal(succeed);
  });

  test('Check succeed setter/getter', () => {
    let measureTime = runtime.measureTime;

    runtime.measureTime = true;
    expect(runtime.measureTime).to.equal(true);
    expect(runtime._timer).to.be.an.instanceOf(Timer);

    runtime.measureTime = false;
    expect(runtime.measureTime).to.equal(false);
    expect(runtime._timer).to.be.an.instanceOf(Timer);

    runtime.succeed = measureTime;
    expect(runtime.measureTime).to.equal(measureTime);
  });

  test('Check name setter/getter', () => {
    let name = runtime.name;
    let lambdaName = 'new test name';

    runtime.name = lambdaName;
    expect(runtime.name).to.equal(lambdaName);

    runtime.name = null;
    expect(runtime.name).to.equal(null);

    runtime.name = name;
    expect(runtime.name).to.equal(name);
  });

  test('Check silent setter/getter', () => {
    let silent = runtime.silent;

    runtime.silent = true;
    expect(runtime.silent).to.equal(true);

    runtime.silent = false;
    expect(runtime.silent).to.equal(false);

    runtime.silent = null;
    expect(runtime.silent).to.equal(null);

    runtime.silent = silent;
    expect(runtime.silent).to.equal(silent);
  });

  test('Check context getter', () => {
    let expectedContextKeys = [
      'awsRequestId',
      'fail',
      'functionName',
      'functionVersion',
      'invokedFunctionArn',
      'invokeid',
      'logGroupName',
      'logStreamName',
      'memoryLimitInMB',
      'succeed',
    ];
    let actualResult = Object.keys(runtime.context);

    expectedContextKeys.forEach((value) => {
      expect(actualResult).to.include(value);
    });
    expect(runtime.context.succeed).to.be.an('function');
    expect(runtime.context.fail).to.be.an('function');
  });

  test('Check _injectSiblingExecutionWrapper', () => {
    let actualResult = runtime._injectSiblingExecutionWrapper();
    expect(global[Runtime.SIBLING_EXEC_WRAPPER_NAME]).to.be.an('object');
    expect(global[Runtime.SIBLING_EXEC_WRAPPER_NAME].invoke).to.be.an('function');
    expect(global[Runtime.SIBLING_EXEC_WRAPPER_NAME].invokeAsync).to.be.an('function');
  });

  test('Check run for _measureTime = undefined', () => {
    let event = {
      firstInputArg: 'test',
      secondInputArg: 2,
      thirdInputArg: false,
      fourthInputArg: null,
    };

    let actualResult = runtime.run(event);

    expect(actualResult.lambda).to.be.an('object');
    expect(actualResult.lambda.handler).to.be.an('function');
    expect(actualResult.lambda.name).to.equal(lambda.name);
  });

  test('Check run for _measureTime != undefined', () => {
    let event = {
      firstInputArg: 'test',
      secondInputArg: 2,
      thirdInputArg: false,
      fourthInputArg: null,
    };

    let actualResult = runtime.run(event, true);

    expect(actualResult.lambda).to.be.an('object');
    expect(actualResult.measureTime).to.equal(true);
    expect(actualResult._timer).to.be.an.instanceOf(Timer);
    expect(actualResult.lambda.handler).to.be.an('function');
    expect(actualResult.lambda.name).to.equal(lambda.name);
  });

  test('Check _logCallback()', () => {
    runtime.silent = true;
    let type = 'number';

    let actualResult = runtime._logCallback(type);

    expect(actualResult).to.be.an('function');
    expect(actualResult()).to.be.equal(undefined);
  });
});
