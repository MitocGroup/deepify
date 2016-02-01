'use strict';

import chai from 'chai';
import {Option} from '../../lib/Terminal/Option';

suite('Terminal/Option', function() {
  test('Class Option exists in Terminal/Option', function() {
    chai.expect(typeof Option).to.equal('function');
  });
});
