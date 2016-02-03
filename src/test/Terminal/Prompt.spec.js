'use strict';

import chai from 'chai';
import {Prompt} from '../../lib/Terminal/Prompt';

suite('Terminal/Prompt', function() {
  test('Class Prompt exists in Terminal/Prompt', function() {
    chai.expect(typeof Prompt).to.equal('function');
  });
});
