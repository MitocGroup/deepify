'use strict';

import {expect} from 'chai';
import {Bin} from '../../lib/NodeJS/Bin';

suite('NodeJS/Bin', () => {
  test('Class Bin exists in NodeJS/Bin', () => {
    expect(Bin).to.be.an('function');
  });

  test('Check npmModuleInstalled() returns true for global mocha', () => {
    expect(Bin.npmModuleInstalled('mocha', true)).to.equal(true);
  });

  test('Check npmModuleInstalled() returns true for local fs-extra', () => {
    expect(Bin.npmModuleInstalled('fs-extra', false)).to.equal(true);
  });

  test('Check npmMajorVersion returns version above than 1', () => {
    expect(Bin.npmMajorVersion).to.be.above(1);
  });

  test('Check nodeMajorVersion returns version above than -1', () => {
    expect(Bin.nodeMajorVersion).to.be.above(-1);
  });

  test('Check node returns valid string', () => {
    expect(Bin.node).to.contain('node');

    //check when Bin._node already setted
    expect(Bin.node).to.contain('node');
  });

  test('Check npm returns valid string', () => {
    expect(Bin.npm).to.contain('npm');

    //check when Bin._node already setted
    expect(Bin.npm).to.contain('npm');
  });
});
