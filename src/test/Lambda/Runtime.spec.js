'use strict';

import chai from 'chai';
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
    chai.expect(Runtime).to.be.an('function');
  });

  test('Check constructor sets _lambda', () => {
    runtime = new Runtime(lambda);

    chai.expect(runtime).to.be.an.instanceOf(Runtime);
    chai.expect(runtime.lambda).to.eql(lambda);
  });

  test('Check constructor sets _measureTime = false', () => {
    chai.expect(runtime.measureTime).to.equal(false);
  });

  test('Check constructor sets _timer = null', () => {
    chai.expect(runtime._timer).to.equal(null);
  });

  test('Check constructor sets _silent = false', () => {
    chai.expect(runtime.silent).to.equal(false);
  });

  test('Check constructor sets _name ', () => {
    chai.expect(runtime.name).to.not.equal('');
  });

  test('Check constructor sets _lambdaPath = null', () => {
    chai.expect(runtime.lambdaPath).to.equal(null);
  });

  test('Check constructor sets _awsConfigFile = null', () => {
    chai.expect(runtime._awsConfigFile).to.equal(null);
  });

  test('Check ENVIRONMENT static getter', () => {
    chai.expect(Runtime.ENVIRONMENT).to.equal('local');
  });

  test('Check SIBLING_EXEC_WRAPPER_NAME static getter', () => {
    chai.expect(Runtime.SIBLING_EXEC_WRAPPER_NAME).to.equal('_deep_lambda_exec_');
  });

  test('Check createLambda()', () => {
    let actualResult = Runtime.createLambda(lambdaPath);

    chai.expect(actualResult).to.be.an.instanceOf(Runtime);
    chai.expect(actualResult.awsConfigFile).to.be.equal(null);
  });

  test('Check complete setter/getter', () => {
    let cb = () => {
      return 'test cb';
    };
    let complete = runtime.complete;

    runtime.complete = cb;
    chai.expect(runtime.complete).to.equal(cb);

    runtime.complete = null;
    chai.expect(runtime.complete).to.equal(null);

    runtime.complete = complete;
    chai.expect(runtime.complete).to.equal(complete);
  });

  test('Check fail setter/getter', () => {
    let cb = () => {
      return 'test cb fail';
    };
    let fail = runtime.fail;

    runtime.fail = cb;
    chai.expect(runtime.fail).to.equal(cb);

    runtime.fail = null;
    chai.expect(runtime.fail).to.equal(null);

    runtime.fail = fail;
    chai.expect(runtime.fail).to.equal(fail);
  });

  test('Check succeed setter/getter', () => {
    let cb = () => {
      return 'test cb succeed';
    };
    let succeed = runtime.succeed;

    runtime.succeed = cb;
    chai.expect(runtime.succeed).to.equal(cb);

    runtime.succeed = null;
    chai.expect(runtime.succeed).to.equal(null);

    runtime.succeed = succeed;
    chai.expect(runtime.succeed).to.equal(succeed);
  });

  test('Check succeed setter/getter', () => {
    let measureTime = runtime.measureTime;

    runtime.measureTime = true;
    chai.expect(runtime.measureTime).to.equal(true);
    chai.expect(runtime._timer).to.be.an.instanceOf(Timer);

    runtime.measureTime = false;
    chai.expect(runtime.measureTime).to.equal(false);
    chai.expect(runtime._timer).to.be.an.instanceOf(Timer);

    runtime.succeed = measureTime;
    chai.expect(runtime.measureTime).to.equal(measureTime);
  });

  test('Check name setter/getter', () => {
    let name = runtime.name;
    let lambdaName = 'new test name';

    runtime.name = lambdaName;
    chai.expect(runtime.name).to.equal(lambdaName);

    runtime.name = null;
    chai.expect(runtime.name).to.equal(null);

    runtime.name = name;
    chai.expect(runtime.name).to.equal(name);
  });

  test('Check silent setter/getter', () => {
    let silent = runtime.silent;

    runtime.silent = true;
    chai.expect(runtime.silent).to.equal(true);

    runtime.silent = false;
    chai.expect(runtime.silent).to.equal(false);

    runtime.silent = null;
    chai.expect(runtime.silent).to.equal(null);

    runtime.silent = silent;
    chai.expect(runtime.silent).to.equal(silent);
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
      chai.expect(actualResult).to.include(value);
    });
    chai.expect(runtime.context.succeed).to.be.an('function');
    chai.expect(runtime.context.fail).to.be.an('function');
  });

  test('Check _injectSiblingExecutionWrapper', () => {
    let actualResult = runtime._injectSiblingExecutionWrapper();
    chai.expect(global[Runtime.SIBLING_EXEC_WRAPPER_NAME]).to.be.an('object');
    chai.expect(global[Runtime.SIBLING_EXEC_WRAPPER_NAME].invoke).to.be.an('function');
    chai.expect(global[Runtime.SIBLING_EXEC_WRAPPER_NAME].invokeAsync).to.be.an('function');
  });

  test('Check run for _measureTime = undefined', () => {
    let event = {
      firstInputArg: 'test',
      secondInputArg: 2,
      thirdInputArg: false,
      fourthInputArg: null,
    };

    let actualResult = runtime.run(event);

    chai.expect(actualResult.lambda).to.be.an('object');
    chai.expect(actualResult.lambda.handler).to.be.an('function');
    chai.expect(actualResult.lambda.name).to.equal(lambda.name);
  });

  test('Check run for _measureTime != undefined', () => {
    let event = {
      firstInputArg: 'test',
      secondInputArg: 2,
      thirdInputArg: false,
      fourthInputArg: null,
    };

    let actualResult = runtime.run(event, true);

    chai.expect(actualResult.lambda).to.be.an('object');
    chai.expect(actualResult.measureTime).to.equal(true);
    chai.expect(actualResult._timer).to.be.an.instanceOf(Timer);
    chai.expect(actualResult.lambda.handler).to.be.an('function');
    chai.expect(actualResult.lambda.name).to.equal(lambda.name);
  });

  test('Check _logCallback()', () => {
    runtime.silent = true;
    let type = 'number';

    let actualResult = runtime._logCallback(type);

    chai.expect(actualResult).to.be.an('function');
    chai.expect(actualResult()).to.be.equal(undefined);
  });
});
