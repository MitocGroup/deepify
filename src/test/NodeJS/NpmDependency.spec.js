'use strict';

import {expect} from 'chai';
import path from 'path';
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

  test('Check requestedVersion getter/setter', () => {
    let requestedVersion = npmDependency.requestedVersion;
    let testVersion = 'v0.0.1';

    npmDependency.requestedVersion = testVersion;
    expect(npmDependency.requestedVersion).to.be.equal(testVersion);

    testVersion = '0.0.1';
    npmDependency.requestedVersion = testVersion;
    expect(npmDependency.requestedVersion).to.be.equal(testVersion);

    npmDependency.requestedVersion = requestedVersion;
    expect(npmDependency.requestedVersion).to.be.equal(requestedVersion);
  });

  test('Check defaultRootPath getter/setter', () => {
    let defaultRootPath = npmDependency.defaultRootPath;
    let testDefaultRootPath = path.resolve('./test');

    npmDependency.defaultRootPath = testDefaultRootPath;
    expect(npmDependency.defaultRootPath).to.be.equal(testDefaultRootPath);

    npmDependency.defaultRootPath = defaultRootPath;
    expect(npmDependency.defaultRootPath).to.be.equal(defaultRootPath);
  });

  test('Check _matchVersion returns true for !version', () => {
    let version = null;
    let pkgVersion = '1.0.1';

    let actualResult = NpmDependency._matchVersion(version, pkgVersion);
    expect(actualResult).to.be.equal(true);
  });

  test('Check _matchVersion returns true for version !instanceof RegExp', () => {
    let version = '1.0.1';
    let pkgVersion = '1.0.1';

    let actualResult = NpmDependency._matchVersion(version, pkgVersion);
    expect(actualResult).to.be.equal(true);
  });

  test('Check _matchVersion returns false for version !instanceof RegExp', () => {
    let version = '1.0.2';
    let pkgVersion = '1.0.1';

    let actualResult = NpmDependency._matchVersion(version, pkgVersion);
    expect(actualResult).to.be.equal(false);
  });

  test('Check _matchVersion returns false for version !instanceof RegExp', () => {
    let version = '1.0.2';
    let pkgVersion = '1.0.1';

    let actualResult = NpmDependency._matchVersion(version, pkgVersion);
    expect(actualResult).to.be.equal(false);
  });

  test('Check _matchVersion returns false for version instanceof RegExp', () => {
    let version = /v?(\d+\.)?(\d+\.)?\d+/g;
    let pkgVersion = '1.0.1';

    let actualResult = NpmDependency._matchVersion(version, pkgVersion);
    expect(actualResult).to.be.equal(true);
  });
});
