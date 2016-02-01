'use strict';

import chai from 'chai';
import {Hook} from '../../lib/Server/Hook';

suite('Server/Hook', function() {
  test('Class Hook exists in Server/Hook', function() {
    chai.expect(typeof Hook).to.equal('function');
  });
});
