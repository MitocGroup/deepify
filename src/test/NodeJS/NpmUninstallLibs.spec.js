'use strict';

import chai from 'chai';
import {NpmUninstallLibs} from '../../lib/NodeJS/NpmUninstallLibs';

suite('NodeJS/NpmUninstallLibs', function() {
  test('Class NpmUninstallLibs exists in NodeJS/NpmUninstallLibs', function() {
    chai.expect(typeof NpmUninstallLibs).to.equal('function');
  });
});
