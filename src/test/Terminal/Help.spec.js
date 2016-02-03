'use strict';

import chai from 'chai';
import {Help} from '../../lib/Terminal/Help';

suite('Terminal/Help', () => {
  test('Class Help exists in Terminal/Help', () => {
    chai.expect(Help).to.be.an('function');
  });
});
