'use strict';

import {expect} from 'chai';
import {UndefinedDepsResolver} from '../../lib/NodeJS/UndefinedDepsResolver';
import {NpmDependency} from '../../lib/NodeJS/NpmDependency';

suite('NodeJS/UndefinedDepsResolver', () => {
  let name = 'mocha';
  let version = '2.3.4';
  let mainDep = new NpmDependency(name, version, true);
  let undefinedDepsResolver = new UndefinedDepsResolver(mainDep);

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
});
