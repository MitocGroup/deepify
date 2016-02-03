'use strict';

import chai from 'chai';
import {Options} from '../../lib/Terminal/Options';

suite('Terminal/Options', () => {
  test('Class Options exists in Terminal/Options', () => {
    chai.expect(Options).to.be.an('function');
  });
});
