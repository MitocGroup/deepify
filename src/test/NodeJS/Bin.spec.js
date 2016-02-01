'use strict';

import chai from 'chai';
import {Bin} from '../../lib/NodeJS/Bin';

suite('NodeJS/Bin', function() {
  test('Class Bin exists in NodeJS/Bin', function() {
    chai.expect(typeof Bin).to.equal('function');
  });
});
