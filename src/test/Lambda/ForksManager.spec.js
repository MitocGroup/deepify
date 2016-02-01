'use strict';

import chai from 'chai';
import {ForksManager} from '../../lib/Lambda/ForksManager';

suite('Lambda/ForksManager', function() {
  test('Class ForksManager exists in Lambda/ForksManager', function() {
    chai.expect(typeof ForksManager).to.equal('function');
  });
});
