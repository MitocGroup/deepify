'use strict';

import {expect} from 'chai';
import {Exec} from '../../lib/Helpers/Exec';

suite('Helpers/Exec', () => {
  test('Class Exec exists in Helpers/Exec', () => {
    expect(Exec).to.be.an('function');
  });
});
