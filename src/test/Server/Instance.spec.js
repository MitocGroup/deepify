'use strict';

import chai from 'chai';
import {Instance} from '../../lib/Server/Instance';

suite('Server/Instance', function() {
  test('Class Instance exists in Server/Instance', function() {
    chai.expect(typeof Instance).to.equal('function');
  });
});
