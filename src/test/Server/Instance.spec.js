'use strict';

import chai from 'chai';
import {Instance} from '../../lib/Server/Instance';

suite('Server/Instance', () => {
  test('Class Instance exists in Server/Instance', () => {
    chai.expect(Instance).to.be.an('function');
  });
});
