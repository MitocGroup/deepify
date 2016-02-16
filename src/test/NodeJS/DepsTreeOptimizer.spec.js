'use strict';

import {expect} from 'chai';
import path from 'path';
import {DepsTreeOptimizer} from '../../lib/NodeJS/DepsTreeOptimizer';

suite('NodeJS/DepsTreeOptimizer', () => {
  let inputPath =  path.resolve(__dirname, '../TestMaterials/') ;
  let depsTreeOptimizer = null;

  test('Class DepsTreeOptimizer exists in NodeJS/DepsTreeOptimizer', () => {
    expect(DepsTreeOptimizer).to.be.an('function');
  });

  test('Check constructor', () => {
    depsTreeOptimizer = new DepsTreeOptimizer(inputPath);

    expect(depsTreeOptimizer).to.be.an.instanceOf(DepsTreeOptimizer);
    expect(depsTreeOptimizer.path).to.equal(inputPath);
    expect(depsTreeOptimizer._packageCache).to.eql({});
  });

  test('Check _deepModulesPath', () => {
    let actualResult = depsTreeOptimizer._deepModulesPath;
    let expectedResult = path.resolve('/test/TestMaterials/deep_modules');

    expect(actualResult).to.contains(expectedResult);
  });

  test('Check _shrinkwrapConfig', () => {
    let actualResult = depsTreeOptimizer._shrinkwrapConfig;
    let expectedResult = path.join(inputPath, DepsTreeOptimizer.SHRINKWRAP_FILE);

    expect(actualResult).to.equal(expectedResult);
  });
});
