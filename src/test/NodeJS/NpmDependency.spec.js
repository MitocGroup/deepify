'use strict';

import chai from 'chai';
import {NpmDependency} from '../../lib/NodeJS/NpmDependency';

suite('NodeJS/NpmDependency', () => {
  let name = 'mocha';
  let version = '2.3.4';
  let npmDependency = new NpmDependency(name, version);

  test('Class NpmDependency exists in NodeJS/NpmDependency', () => {
    chai.expect(NpmDependency).to.be.an('function');
  });

  test(`Check constructor sets _name = ${name}`, () => {
    chai.expect(npmDependency).to.be.an.instanceOf(NpmDependency);
    chai.expect(npmDependency.name).to.equal(name);
  });

  test(`Check constructor sets _version = ${version}`, () => {
    chai.expect(npmDependency.version).to.equal(version);
  });

  test(`Check constructor sets _requestedVersion = ${version}`, () => {
    chai.expect(npmDependency.requestedVersion).to.equal(version);
  });

  test('Check constructor sets _parent = null', () => {
    chai.expect(npmDependency.parent).to.equal(null);
  });

  test('Check constructor sets _children = []', () => {
    chai.expect(npmDependency.children).to.eql([]);
  });

  test('Check constructor sets isMain = false by default', () => {
    chai.expect(npmDependency.isMain).to.eql(false);
  });

  test('Check constructor sets _defaultRootPath = ""', () => {
    chai.expect(npmDependency.defaultRootPath).to.eql('');
  });

  test(`Check fullName returns ${name}@${version}`, () => {
    chai.expect(npmDependency.fullName).to.eql(`${name}@${version}`);
  });

  test('Check NODE_MODULES_DIR', () => {
    chai.expect(NpmDependency.NODE_MODULES_DIR).to.equal('node_modules');
  });
});
