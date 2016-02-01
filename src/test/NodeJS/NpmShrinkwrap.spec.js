'use strict';

import chai from 'chai';
import {NpmShrinkwrap} from '../../lib/NodeJS/NpmShrinkwrap';

suite('NodeJS/NpmShrinkwrap', function() {
  test('Class NpmShrinkwrap exists in NodeJS/NpmShrinkwrap', function() {
    chai.expect(typeof NpmShrinkwrap).to.equal('function');
  });
});
