'use strict';

import chai from 'chai';
import {Exec} from '../../lib/Helpers/Exec';

suite('Helpers/Exec', () => {
  test('Class Exec exists in Helpers/Exec', () => {
    chai.expect(Exec).to.be.an('function');
  });
});
