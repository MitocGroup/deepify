'use strict';

import chai from 'chai';
import {Argument} from '../../lib/Terminal/Argument';

suite('Terminal/Argument', () => {
  test('Class Argument exists in Terminal/Argument', () => {
    chai.expect(Argument).to.be.an('function');
  });
});
