'use strict';

import chai from 'chai';
import {NpmDependency} from '../../lib/NodeJS/NpmDependency';

suite('NodeJS/NpmDependency', function() {
  let name = 'mocha';
  let version = '2.3.4';
  let npmDependency = new NpmDependency(name, version);

  test('Class NpmDependency exists in NodeJS/NpmDependency', function() {
    chai.expect(typeof NpmDependency).to.equal('function');
  });

  test(`Check constructor sets _name = ${name}`, function() {
    chai.expect(npmDependency).to.be.an.instanceOf(NpmDependency);
    chai.expect(npmDependency.name).to.equal(name);
  });

  test(`Check constructor sets _version = ${version}`, function() {
    chai.expect(npmDependency.version).to.equal(version);
  });

  test(`Check constructor sets _requestedVersion = ${version}`, function() {
    chai.expect(npmDependency.requestedVersion).to.equal(version);
  });

  test('Check constructor sets _parent = null', function() {
    chai.expect(npmDependency.parent).to.equal(null);
  });

  test('Check constructor sets _children = []', function() {
    chai.expect(npmDependency.children).to.eql([]);
  });

  test('Check constructor sets isMain = false by default', function() {
    chai.expect(npmDependency.isMain).to.eql(false);
  });

  test('Check constructor sets _defaultRootPath = ""', function() {
    chai.expect(npmDependency.defaultRootPath).to.eql('');
  });

  test(`Check fullName returns ${name}@${version}`, function() {
    chai.expect(npmDependency.fullName).to.eql(`${name}@${version}`);
  });

  test('Check NODE_MODULES_DIR', function() {
    chai.expect(NpmDependency.NODE_MODULES_DIR).to.equal('node_modules');
  });
});
