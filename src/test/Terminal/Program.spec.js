'use strict';

import chai from 'chai';
import {Program} from '../../lib/Terminal/Program';

suite('Terminal/Program', () => {
  test('Class Program exists in Terminal/Program', () => {
    chai.expect(Program).to.be.an('function');
  });
});
