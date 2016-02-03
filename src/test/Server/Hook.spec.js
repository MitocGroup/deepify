'use strict';

import chai from 'chai';
import {Hook} from '../../lib/Server/Hook';

suite('Server/Hook', () => {
  test('Class Hook exists in Server/Hook', () => {
    chai.expect(Hook).to.be.an('function');
  });
});
