'use strict';

import chai from 'chai';
import {Options} from '../../lib/Terminal/Options';

suite('Terminal/Options', function() {
  test('Class Options exists in Terminal/Options', function() {
    chai.expect(typeof Options).to.equal('function');
  });
});
