'use strict';

import chai from 'chai';
import {Runtime} from '../../lib/Lambda/Runtime';

suite('Lambda/Runtime', function() {
  test('Class Runtime exists in Lambda/Runtime', function() {
    chai.expect(typeof Runtime).to.equal('function');
  });
});
