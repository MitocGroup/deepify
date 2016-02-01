'use strict';

import chai from 'chai';
import {Help} from '../../lib/Terminal/Help';

suite('Terminal/Help', function() {
  test('Class Help exists in Terminal/Help', function() {
    chai.expect(typeof Help).to.equal('function');
  });
});
