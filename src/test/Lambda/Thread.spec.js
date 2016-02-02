'use strict';

import chai from 'chai';
import path from 'path';
import {Thread} from '../../lib/Lambda/Thread';
import {Runtime} from '../../lib/Lambda/Runtime';

suite('Lambda/Thread', function () {
  let lambda = {
    name: 'testLambda',
    handler: () => {},
  };
  let lambdaPath = path.join(__dirname + './../TestMaterials/Lambda/lambda');
  let runtime = new Runtime(lambda, lambdaPath);
  let thread = null;

  test('Class Thread exists in Lambda/Thread', function () {
    chai.expect(typeof Thread).to.equal('function');
  });

  test('Check constructor sets _lambda', function () {
    thread = new Thread(runtime);

    chai.expect(thread).to.be.an.instanceOf(Thread);
    chai.expect(thread.runtime).to.be.an.instanceOf(Runtime);
    chai.expect(thread.process).to.equal(null);
  });

  test('Check WRAPPER static getter', function () {
    chai.expect(Thread.WRAPPER).to.contains('thread_wrapper.js');
  });

  test('Check _cleanup()', function () {
    let actualResult = thread._cleanup();

    chai.expect(actualResult).to.be.an.instanceOf(Thread);
    chai.expect(thread.process).to.equal(null);
  });

  test('Check run()', function () {
    runtime.silent = true;
    let event = {
      firstInputArg: 'test',
      secondInputArg: 2,
      thirdInputArg: false,
      fourthInputArg: null,
    };
    let expectedResultArray = [
      'domain', '_events', '_eventsCount', '_maxListeners',
      '_closesNeeded', '_closesGot', 'connected', 'signalCode',
      'exitCode', 'killed', 'spawnfile', '_handle',
      'spawnargs', 'pid', 'stdin', 'stdout', 'stderr',
      'stdio', '_channel', '_handleQueue', 'send', '_send',
      'disconnect', '_disconnect',
    ];

    let actualResult = thread.run(event, false);
    let processKeys = Object.keys(thread.process);

    chai.expect(actualResult).to.be.an.instanceOf(Thread);

    expectedResultArray.forEach((value) => {
      chai.expect(processKeys).to.include(value);
    });
  });

});
