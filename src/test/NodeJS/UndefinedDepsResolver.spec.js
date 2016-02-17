'use strict';

import {expect} from 'chai';
import {UndefinedDepsResolver} from '../../lib/NodeJS/UndefinedDepsResolver';
import {NpmDependency} from '../../lib/NodeJS/NpmDependency';

suite('NodeJS/UndefinedDepsResolver', () => {
  let name, version, mainDep, undefinedDepsResolver;
  let sinonName, sinonVersion, sinonNpmDependency;
  let utilName, utilVersion, utilNpmDependency;
  let undefNpmDependencyName, undefinedNpmDependencyVersion1, undefinedNpmDependencyVersion2;
  let actualResult;

  suiteSetup('', () => {
    name = 'mocha';
    version = '2.3.4';
    mainDep = new NpmDependency(name, version, true);
    undefinedDepsResolver = new UndefinedDepsResolver(mainDep);

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

  test('Class UndefinedDepsResolver exists in NodeJS/UndefinedDepsResolver', () => {
    expect(UndefinedDepsResolver).to.be.an('function');
  });

  test('Check UndefinedDepsResolver constructor throws Error for !mainDep.isMain', () => {
    let error = null;
    let mainDep = new NpmDependency(name, version, false);

    try {
      undefinedDepsResolver = new UndefinedDepsResolver(mainDep);
    } catch (e) {
      error = e;
    }

    expect(error, 'error is an instance of Error').to.be.an.instanceOf(Error);
    expect(error.message).to.equal(`Npm dependency ${mainDep.fullName} is not the deps tree root`);
  });

  test('Check UndefinedDepsResolver constructor throws Error for !mainDep.isMain',
    () => {
      let error = null;
      let mainDep = new NpmDependency(name, null, true);

      try {
        undefinedDepsResolver = new UndefinedDepsResolver(mainDep);
      } catch (e) {
        error = e;
      }

      expect(error, 'error is an instance of Error').to.be.an.instanceOf(Error);
      expect(error.message).to.equal(`Npm main dependency version have to be defined in ${mainDep.fullName}`);
    }
  );

  test('Check constructor sets _mainDep', () => {
    expect(undefinedDepsResolver).to.be.an.instanceOf(UndefinedDepsResolver);
    expect(undefinedDepsResolver.mainDep).to.equal(mainDep);
  });

  test('Check constructor sets _undefinedStack', () => {
    expect(undefinedDepsResolver._undefinedStack).to.eql([]);
  });

  test('Check constructor sets _cloneShadow', () => {
    expect(undefinedDepsResolver._cloneShadow).to.eql({});
  });

  test('Check constructor sets _resolvedStack', () => {
    expect(undefinedDepsResolver._resolvedStack).to.eql({});
  });

  test('Check _tryResolveUndefined()', () => {
    actualResult = undefinedDepsResolver._tryResolveUndefined(sinonNpmDependency);

    expect(actualResult).to.be.an.instanceOf(UndefinedDepsResolver);
    expect(actualResult._undefinedStack.length).to.be.equal(2);
  });

  test('Check _cloneChildrenStack()', () => {
    let parentDep = new NpmDependency('parentDep', '0.1');

    undefinedDepsResolver._cloneChildrenStack(sinonNpmDependency, parentDep);

    expect(
      undefinedDepsResolver._cloneShadow[undefinedNpmDependencyVersion1.fullName]
    ).to.be.an('array');
  });

  test('Check _tryResolveUndefined() throws Error', () => {
    let undefinedNpmDependencyVersion = new NpmDependency('without parent');
    let error = null;

    sinonNpmDependency.addChild(undefinedNpmDependencyVersion);

    try {
      undefinedDepsResolver._tryResolveUndefined(sinonNpmDependency);
    } catch (e) {
      error = e;
    }

    expect(error).to.be.an.instanceOf(Error);
    expect(error.message).to.be.equal('Missing parent on a non deps tree root');
  });
});
