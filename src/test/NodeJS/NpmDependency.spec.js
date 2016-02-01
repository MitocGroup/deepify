'use strict';

import chai from 'chai';
import {NpmDependency} from '../../lib/NodeJS/NpmDependency';

suite('NodeJS/NpmDependency', function() {
  test('Class NpmDependency exists in NodeJS/NpmDependency', function() {
    chai.expect(typeof NpmDependency).to.equal('function');
  });
});
