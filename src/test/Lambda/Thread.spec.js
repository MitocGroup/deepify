'use strict';

import {expect} from 'chai';
import path from 'path';
import {Thread} from '../../lib/Lambda/Thread';
import {Runtime} from '../../lib/Lambda/Runtime';

suite('Lambda/Thread', () => {
  let lambda = {
    name: 'testLambda',
    handler: () => {},
  };
  let lambdaPath = path.join(__dirname + './../TestMaterials/Lambda/lambda');
  let runtime = new Runtime(lambda, lambdaPath);
  let thread = null;

  test('Class Thread exists in Lambda/Thread', () => {
    expect(Thread).to.be.an('function');
  });

  test('Check constructor sets _lambda', () => {
    thread = new Thread(runtime);

    expect(thread).to.be.an.instanceOf(Thread);
    expect(thread.runtime).to.be.an.instanceOf(Runtime);
    expect(thread.process).to.equal(null);
  });

  test('Check WRAPPER static getter', () => {
    expect(Thread.WRAPPER).to.contains('thread_wrapper.js');
  });

  test('Check _cleanup()', () => {
    let actualResult = thread._cleanup();

    expect(actualResult).to.be.an.instanceOf(Thread);
    expect(thread.process).to.equal(null);
  });

  test('Check run()', () => {
    runtime.silent = true;
    let event = {
      firstInputArg: 'test',
      secondInputArg: 2,
      thirdInputArg: false,
      fourthInputArg: null,
    };

    //'spawnargs', '_eventsCount' do not exist in node 0.12
    let expectedResultArray = [
      'domain', '_events', '_maxListeners',
      '_closesNeeded', '_closesGot', 'connected', 'signalCode',
      'exitCode', 'killed', 'spawnfile', '_handle',
      'pid', 'stdin', 'stdout', 'stderr',
      'stdio', '_channel', '_handleQueue', 'send', '_send',
      'disconnect', '_disconnect',
    ];

    let actualResult = thread.run(event, false);
    let processKeys = Object.keys(thread.process);

    expect(actualResult).to.be.an.instanceOf(Thread);

    expectedResultArray.forEach((value) => {
      expect(processKeys).to.include(value);
    });
  });

});
