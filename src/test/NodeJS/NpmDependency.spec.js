'use strict';

import {expect} from 'chai';
import {NpmDependency} from '../../lib/NodeJS/NpmDependency';

suite('NodeJS/NpmDependency', () => {
  let name = 'mocha';
  let version = '2.3.4';
  let npmDependency = new NpmDependency(name, version);

  test('Class NpmDependency exists in NodeJS/NpmDependency', () => {
    expect(NpmDependency).to.be.an('function');
  });

  test(`Check constructor sets _name = ${name}`, () => {
    expect(npmDependency).to.be.an.instanceOf(NpmDependency);
    expect(npmDependency.name).to.equal(name);
  });

  test(`Check constructor sets _version = ${version}`, () => {
    expect(npmDependency.version).to.equal(version);
  });

  test(`Check constructor sets _requestedVersion = ${version}`, () => {
    expect(npmDependency.requestedVersion).to.equal(version);
  });

  test('Check constructor sets _parent = null', () => {
    expect(npmDependency.parent).to.equal(null);
  });

  test('Check constructor sets _children = []', () => {
    expect(npmDependency.children).to.eql([]);
  });

  test('Check constructor sets isMain = false by default', () => {
    expect(npmDependency.isMain).to.eql(false);
  });

  test('Check constructor sets _defaultRootPath = ""', () => {
    expect(npmDependency.defaultRootPath).to.eql('');
  });

  test(`Check fullName returns ${name}@${version}`, () => {
    expect(npmDependency.fullName).to.eql(`${name}@${version}`);
  });

  test('Check NODE_MODULES_DIR', () => {
    expect(NpmDependency.NODE_MODULES_DIR).to.equal('node_modules');
  });
});
