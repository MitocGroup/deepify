'use strict';

import chai from 'chai';
import {Timer} from '../../lib/Lambda/Timer';

suite('Lambda/Timer', function() {
  test('Class Timer exists in Lambda/Timer', function() {
    chai.expect(typeof Timer).to.equal('function');
  });
});
