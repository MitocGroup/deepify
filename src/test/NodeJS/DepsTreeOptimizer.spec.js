'use strict';

import {expect} from 'chai';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import path from 'path';
import {DepsTreeOptimizer} from '../../lib/NodeJS/DepsTreeOptimizer';
import {NpmDependency} from '../../lib/NodeJS/NpmDependency';

chai.use(sinonChai);

suite('NodeJS/DepsTreeOptimizer', () => {
  let inputPath =  path.resolve(__dirname, '../TestMaterials/') ;
  let depsTreeOptimizer = null;
  let name, version, mainDep;
  let sinonName, sinonVersion, sinonNpmDependency;
  let utilName, utilVersion, utilNpmDependency;
  let undefNpmDependencyName, undefinedNpmDependencyVersion1, undefinedNpmDependencyVersion2;
  let actualResult, expectedResult;

  suiteSetup('', () => {
    name = 'mocha';
    version = '2.3.4';
    mainDep = new NpmDependency(name, version, true);

    sinonName = 'sinon';
    sinonVersion = '1.17';
    sinonNpmDependency = new NpmDependency(sinonName, sinonVersion, true);

    utilName = 'util';
    utilVersion = '0.10';
    utilNpmDependency = new NpmDependency(utilName, utilVersion);

    undefNpmDependencyName = 'name';
    undefinedNpmDependencyVersion1 = new NpmDependency(undefNpmDependencyName);
    undefinedNpmDependencyVersion2 = new NpmDependency(undefNpmDependencyName);

    sinonNpmDependency.addChild(utilNpmDependency);
    sinonNpmDependency.addChild(undefinedNpmDependencyVersion1);
    utilNpmDependency.addChild(undefinedNpmDependencyVersion2);

    //add explicitly parent
    utilNpmDependency.parent = sinonNpmDependency;
    undefinedNpmDependencyVersion1.parent = sinonNpmDependency;
    undefinedNpmDependencyVersion2.parent = utilNpmDependency;
  });


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
    expectedResult = path.resolve('/test/TestMaterials/deep_modules');

    actualResult = depsTreeOptimizer._deepModulesPath;

    expect(actualResult).to.contains(expectedResult);
  });

  test('Check _shrinkwrapConfig', () => {
    expectedResult = path.join(inputPath, DepsTreeOptimizer.SHRINKWRAP_FILE);

    actualResult = depsTreeOptimizer._shrinkwrapConfig;

    expect(actualResult).to.equal(expectedResult);
  });

  test('Check _findPkgUpperTheTree for !upperPath returns null', () => {
    let upperPath = path.resolve('./test/TestMaterialss');
    let pkgName = 'deep_modules';

    actualResult = depsTreeOptimizer._findPkgUpperTheTree(upperPath, pkgName);

    expect(actualResult).to.equal(null);
  });

  test('Check _findPkgUpperTheTree returns null for upperPath  and !pkgPath', () => {
    let upperPath = path.resolve('./test/TestMaterials');
    let pkgName = 'deep_modules';

    actualResult = depsTreeOptimizer._findPkgUpperTheTree(upperPath, pkgName);

    expect(actualResult).to.equal(null);
  });

  test('Check _findPkgUpperTheTree returns pkgPath for pkgPath', () => {
    let upperPath = path.resolve('./test');
    let pkgName = 'TestMaterials';

    actualResult = depsTreeOptimizer._findPkgUpperTheTree(upperPath, pkgName);

    expect(actualResult).to.equal(path.join(upperPath, pkgName));
  });

  test('Check _getDepsFlatten() returns valid object', () => {

    actualResult = depsTreeOptimizer._getDepsFlatten(sinonNpmDependency);

    expect(actualResult).to.be.an('object');
    expect(actualResult).to.have.all.keys(['name@undefined', 'util@0.10']);
  });

  test('Check _depsCopyFlatten() returns []', () => {
    let _sinonNpmDependency = new NpmDependency(sinonName, sinonVersion, true);

    actualResult = depsTreeOptimizer._depsCopyFlatten(_sinonNpmDependency);

    expect(actualResult).to.eql([]);
  });

  //@todo - check compile-prod
  //test('Check _depsCopyFlatten() returns valid array of string', () => {
  //  console.log('sinonNpmDependency: ', sinonNpmDependency)
  //
  //  sinonNpmDependency.removeUndefined();
  //
  //  console.log('after sinonNpmDependency: ', sinonNpmDependency)
  //
  //  actualResult = depsTreeOptimizer._depsCopyFlatten(sinonNpmDependency);
  //
  //  //expect(actualResult).to.be.an('object');
  //  //expect(actualResult).to.have.all.keys(['name@undefined', 'util@0.10']);
  //});


  test(`Check _findPkgDownTree() returns ${inputPath}`, () => {

    actualResult = depsTreeOptimizer._findPkgDownTree(inputPath);

    expect(actualResult).to.equal(inputPath);
  });

  test('Check _findPkgDownTree() throws exception for missing package in the deps tree', () => {
    let pkgPath = path.resolve(__dirname, '../TestMaterials/newpkgPath/');
    let error = null;

    try {
      depsTreeOptimizer._findPkgDownTree(pkgPath);
    } catch (e) {
      error = e;
    }

    expect(error).to.be.an.instanceOf(Error);
    expect(error.message).to.contains('Missing package in the deps tree');
  });

  test('Check _getFinalPkgPath() returns valid path', () => {
    let pkgFullName = 'pkgFullName';
    expectedResult = path.join(depsTreeOptimizer._deepModulesPath, pkgFullName);

    actualResult = depsTreeOptimizer._getFinalPkgPath(pkgFullName);

    expect(actualResult).to.equal(expectedResult);
  });

  test('Check _getRelativeFinalPath() returns valid relative path', () => {
    let depFinalPath = path.resolve('./test/TestMaterials/Property2/Microservice2/Data/Models/');

    expectedResult = 'Property2/Microservice2/Data/Models';

    actualResult = depsTreeOptimizer._getRelativeFinalPath(depFinalPath, inputPath);

    expect(actualResult).to.equal(expectedResult);
  });

  test('Check _getRelativeFinalPath() returns valid relative path with "../.."', () => {
    let depFinalPath = path.resolve('./test/TestMaterials/Property2/Microservice2/Data/Models/');

    expectedResult = '../../../..';

    actualResult = depsTreeOptimizer._getRelativeFinalPath(inputPath, depFinalPath);

    expect(actualResult).to.equal(expectedResult);
  });

  test('Check _readShrinkwrapFile()', () => {
    expectedResult = {
      name: 'application-name',
      version: '0.0.1',
    };

    actualResult = depsTreeOptimizer._readShrinkwrapFile();

    expect(actualResult).to.eql(expectedResult);
  });

  test('Check _injectFinalDep()', () => {
    let _sinonNpmDependency = new NpmDependency(sinonName, sinonVersion, true);
    let depFinalPath = 'depFinalPath';
    let error = null;

    try {
      depsTreeOptimizer._injectFinalDep(_sinonNpmDependency, depFinalPath);
    } catch (e) {
      error = e;
    }

    expect(error).to.be.an.instanceOf(Error);
    expect(error.message).to.eql(`Unable to identify ${_sinonNpmDependency.fullName} usage`);
  });

  test('Check _dumpDependencies()', () => {
    let _sinonNpmDependency = new NpmDependency(sinonName, sinonVersion, true);
    let depFinalPath = 'depFinalPath';
    let error = null;

    try {
      depsTreeOptimizer._injectFinalDep(_sinonNpmDependency, depFinalPath);
    } catch (e) {
      error = e;
    }

    expect(error).to.be.an.instanceOf(Error);
    expect(error.message).to.eql(`Unable to identify ${_sinonNpmDependency.fullName} usage`);
  });

  test('Check _lockDeps() executes with error', () => {
    let spyCallback = sinon.spy();

    actualResult = depsTreeOptimizer._lockDeps(spyCallback);

    expect(actualResult, 'is an instance of DepsTreeOptimizer').to.be.an.instanceOf(DepsTreeOptimizer);
    expect(spyCallback).to.not.have.been.calledWith();
  });

  test('Check _findPkgUpperTheTree returns matchedPath', () => {
    let upperPath = path.resolve('./node_modules');
    let pkgName = 'util';
    let expectedResult = path.join(upperPath, './sinon/node_modules', 'util');

    actualResult = depsTreeOptimizer._findPkgUpperTheTree(upperPath, pkgName);

    expect(actualResult).to.equal(expectedResult);
  });

  //@todo - need to be updated
  //test('Check _findPkgDownTree returns matchedPath', () => {
  //  let pkgName = path.resolve('./node_modules/sinon/node_modules/util');
  //  let initialPkgPath = path.resolve('sinon');
  //  let expectedResult = path.join(initialPkgPath, './sinon/node_modules', 'util');
  //
  //  actualResult = depsTreeOptimizer._findPkgDownTree(pkgName, initialPkgPath);
  //
  //  expect(actualResult).to.equal(expectedResult);
  //});
});
