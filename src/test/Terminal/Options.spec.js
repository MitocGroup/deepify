'use strict';

import {expect} from 'chai';
import {Options} from '../../lib/Terminal/Options';

suite('Terminal/Options', () => {
  test('Class Options exists in Terminal/Options', () => {
    expect(Options).to.be.an('function');
  });
});
