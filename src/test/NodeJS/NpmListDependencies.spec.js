'use strict';

import chai from 'chai';
import {NpmListDependencies} from '../../lib/NodeJS/NpmListDependencies';

suite('NodeJS/NpmListDependencies', function() {
  test('Class NpmListDependencies exists in NodeJS/NpmListDependencies', function() {
    chai.expect(typeof NpmListDependencies).to.equal('function');
  });
});
