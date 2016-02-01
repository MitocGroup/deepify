'use strict';

import chai from 'chai';
import {Arguments} from '../../lib/Terminal/Arguments';

suite('Terminal/Arguments', function() {
  test('Class Arguments exists in Terminal/Arguments', function() {
    chai.expect(typeof Arguments).to.equal('function');
  });
});
