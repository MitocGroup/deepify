'use strict';

import chai from 'chai';
import {Option} from '../../lib/Terminal/Option';

suite('Terminal/Option', () => {
  test('Class Option exists in Terminal/Option', () => {
    chai.expect(Option).to.be.an('function');
  });
});
