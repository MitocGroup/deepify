'use strict';

import chai from 'chai';
import {Thread} from '../../lib/Lambda/Thread';
import {Runtime} from '../../lib/Lambda/Runtime';

suite('Lambda/Thread', function() {
  let lambda = {
    name: 'testLambda',
  };
  let runtime = new Runtime(lambda);
  let thread = null;

  test('Class Thread exists in Lambda/Thread', function() {
    chai.expect(typeof Thread).to.equal('function');
  });

  test('Check constructor sets _lambda', function() {
    thread = new Thread(runtime);

    chai.expect(thread).to.be.an.instanceOf(Thread);
    chai.expect(thread.runtime).to.be.an.instanceOf(Runtime);
    chai.expect(thread.process).to.equal(null);
  });

  test('Check WRAPPER static getter', function() {
    chai.expect(Thread.WRAPPER).to.contains('thread_wrapper.js');
  });

  test('Check _cleanup()', function() {
    let actualResult = thread._cleanup();

    chai.expect(actualResult).to.be.an.instanceOf(Thread);
    chai.expect(thread.process).to.equal(null);
  });

});
