'use strict';

import chai from 'chai';
import {NpmListDependencies} from '../../lib/NodeJS/NpmListDependencies';
import {NpmDependency} from '../../lib/NodeJS/NpmDependency';
import {NpmDepsListException} from '../../lib/NodeJS/Exception/NpmDepsListException';

suite('NodeJS/NpmListDependencies', function() {
  let npmListDependencies = null

  test('Class NpmListDependencies exists in NodeJS/NpmListDependencies', function() {
    chai.expect(typeof NpmListDependencies).to.equal('function');
  });

  test('Check constructor sets _path', function() {
    let currentDirectory = __dirname;
    npmListDependencies = new NpmListDependencies(currentDirectory);
    chai.expect(npmListDependencies).to.be.an.instanceOf(NpmListDependencies);
    chai.expect(npmListDependencies.path).to.equal(currentDirectory);
  });

  test('Check list(0)', function() {
    let actualResult = npmListDependencies.list(0);

    chai.expect(actualResult).to.be.an.instanceOf(NpmDependency);
  });

  test('Check list() throws NpmDepsListException', function() {
    let error = null;

    npmListDependencies = new NpmListDependencies('invalidPath');

    try {
      npmListDependencies.list(0);
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.an.instanceOf(NpmDepsListException);
  });
});
