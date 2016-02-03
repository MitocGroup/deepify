'use strict';

import chai from 'chai';
import {Arguments} from '../../lib/Terminal/Arguments';

suite('Terminal/Arguments', () => {
  test('Class Arguments exists in Terminal/Arguments', () => {
    chai.expect(Arguments).to.be.an('function');
  });
});
