'use strict';

import chai from 'chai';
import {Program} from '../../lib/Terminal/Program';

suite('Terminal/Program', function() {
  test('Class Program exists in Terminal/Program', function() {
    chai.expect(typeof Program).to.equal('function');
  });
});
