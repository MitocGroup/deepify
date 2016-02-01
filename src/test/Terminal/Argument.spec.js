'use strict';

import chai from 'chai';
import {Argument} from '../../lib/Terminal/Argument';

suite('Terminal/Argument', function() {
  test('Class Argument exists in Terminal/Argument', function() {
    chai.expect(typeof Argument).to.equal('function');
  });
});
