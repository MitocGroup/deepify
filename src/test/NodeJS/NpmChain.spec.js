'use strict';

import chai from 'chai';
import {NpmChain} from '../../lib/NodeJS/NpmChain';

suite('NodeJS/NpmChain', function() {
  test('Class NpmChain exists in NodeJS/NpmChain', function() {
    chai.expect(typeof NpmChain).to.equal('function');
  });
});
