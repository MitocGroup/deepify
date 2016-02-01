'use strict';

import chai from 'chai';
import {Thread} from '../../lib/Lambda/Thread';

suite('Lambda/Thread', function() {
  test('Class Thread exists in Lambda/Thread', function() {
    chai.expect(typeof Thread).to.equal('function');
  });
});
