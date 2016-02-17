'use strict';

import {expect} from 'chai';
import path from 'path';
import {NpmDependency} from '../../lib/NodeJS/NpmDependency';

suite('NodeJS/NpmDependency', () => {
  let name = 'deepify';
  let version = '1.6.14';
  let npmDependency = new NpmDependency(name, version);

  let sinonName = 'sinon';
  let sinonVersion = '1.17';
  let sinonNpmDependency = new NpmDependency(sinonName, sinonVersion, true);

  let utilName = 'util';
  let utilVersion = '0.10';
  let utilNpmDependency = new NpmDependency(utilName, utilVersion);

  let undefNpmDependencyName = 'name';
  let undefinedNpmDependencyVersion1 = new NpmDependency(undefNpmDependencyName);
  let undefinedNpmDependencyVersion2 = new NpmDependency(undefNpmDependencyName);

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
    expect(npmDependency.requestedVersion).to.equal(testVersion);

    testVersion = '0.0.1';
    npmDependency.requestedVersion = testVersion;
    expect(npmDependency.requestedVersion).to.equal(testVersion);

    npmDependency.requestedVersion = requestedVersion;
    expect(npmDependency.requestedVersion).to.equal(requestedVersion);
  });

  test('Check defaultRootPath getter/setter', () => {
    let defaultRootPath = npmDependency.defaultRootPath;
    let testDefaultRootPath = path.resolve('./test');

    npmDependency.defaultRootPath = testDefaultRootPath;
    expect(npmDependency.defaultRootPath).to.equal(testDefaultRootPath);

    npmDependency.defaultRootPath = defaultRootPath;
    expect(npmDependency.defaultRootPath).to.equal(defaultRootPath);
  });

  test('Check _matchVersion() returns true for !version', () => {
    let version = null;
    let pkgVersion = '1.0.1';

    let actualResult = NpmDependency._matchVersion(version, pkgVersion);
    expect(actualResult).to.equal(true);
  });

  test('Check _matchVersion() returns true for version !instanceof RegExp', () => {
    let version = '1.0.1';
    let pkgVersion = '1.0.1';

    let actualResult = NpmDependency._matchVersion(version, pkgVersion);
    expect(actualResult).to.equal(true);
  });

  test('Check _matchVersion() returns false for version !instanceof RegExp', () => {
    let version = '1.0.2';
    let pkgVersion = '1.0.1';

    let actualResult = NpmDependency._matchVersion(version, pkgVersion);
    expect(actualResult).to.equal(false);
  });

  test('Check _matchVersion() returns false for version !instanceof RegExp', () => {
    let version = '1.0.2';
    let pkgVersion = '1.0.1';

    let actualResult = NpmDependency._matchVersion(version, pkgVersion);
    expect(actualResult).to.equal(false);
  });

  test('Check _matchVersion() returns false for version instanceof RegExp', () => {
    let version = /v?(\d+\.)?(\d+\.)?\d+/g;
    let pkgVersion = '1.0.1';

    let actualResult = NpmDependency._matchVersion(version, pkgVersion);

    expect(actualResult).to.equal(true);
  });

  test('Check _resolveFullDepName() for dependency name with version', () => {
    let dependencyName = 'deep-framework@1.7.0';
    let expectedResult = {
      name: 'deep-framework',
      version: '1.7.0',
    };

    let actualResult = NpmDependency._resolveFullDepName(dependencyName);

    expect(actualResult).to.eql(expectedResult);
  });

  test('Check _resolveFullDepName() for dependency name w/o version', () => {
    let dependencyName = 'deep-framework';
    let expectedResult = {
      name: 'deep-framework',
      version: null,
    };

    let actualResult = NpmDependency._resolveFullDepName(dependencyName);

    expect(actualResult).to.eql(expectedResult);
  });

  test('Check hasChildren returns false', () => {
    expect(sinonNpmDependency.hasChildren).to.equal(false);
  });

  test('Check addChild()', () => {
    let actualResult = sinonNpmDependency.addChild(utilNpmDependency);

    //add explicitly parent for util
    utilNpmDependency.parent = sinonNpmDependency;

    expect(actualResult).to.be.an.instanceOf(NpmDependency);
    expect(sinonNpmDependency.hasChildren).to.equal(true);
    expect(actualResult.children[actualResult.children.length - 1]).to.be.an.instanceOf(NpmDependency);
    expect(actualResult.children[actualResult.children.length - 1]).to.eql(utilNpmDependency);
  });

  test('Check addChild() dependency w/o version', () => {
    sinonNpmDependency.addChild(undefinedNpmDependencyVersion1);
    utilNpmDependency.addChild(undefinedNpmDependencyVersion2);

    //add explicitly parent for util
    undefinedNpmDependencyVersion1.parent = sinonNpmDependency;
    undefinedNpmDependencyVersion2.parent = utilNpmDependency;

    expect(sinonNpmDependency.children.length).to.equal(2);
    expect(utilNpmDependency.children.length).to.equal(1);
  });

  test('Check _getParentsDepth returns 0', () => {
    expect(npmDependency._getParentsDepth()).to.equal(0);
  });

  test('Check _getParentsDepth returns 1', () => {
    expect(undefinedNpmDependencyVersion1._getParentsDepth()).to.equal(1);
  });

  test('Check _getParentsDepth returns 2', () => {
    expect(undefinedNpmDependencyVersion2._getParentsDepth()).to.equal(2);
  });

  test('Check removeUndefined', () => {
    let actualResult = sinonNpmDependency.removeUndefined();

    expect(actualResult).to.be.an.instanceOf(NpmDependency);
    expect(actualResult.children.length).to.equal(1);
    expect(actualResult.children[actualResult.children.length - 1]).to.eql(utilNpmDependency);
    expect(actualResult.children[actualResult.children.length - 1].hasChildren).to.equal(false);
  });

  test('Check getModulesPath()', () => {
    let rootPath = './test/TestMaterials/';
    let expectedResult = path.join(rootPath, NpmDependency.NODE_MODULES_DIR);

    let actualResult = npmDependency.getModulesPath(rootPath);

    expect(actualResult).to.equal(expectedResult);
  });

  test(`Check find() returns valid dependency for dependecyName "${utilName}"`, () => {
    let actualResult = sinonNpmDependency.find(utilName , utilVersion);

    expect(actualResult).to.equal(utilNpmDependency);
  });

  test(`Check find() returns null for dependecyName "${undefNpmDependencyName}"`, () => {
    let actualResult = sinonNpmDependency.find(undefNpmDependencyName);

    expect(actualResult).to.equal(null);
  });

  test(`Check find() returns valid dependency for dependecyName "${undefNpmDependencyName}"`, () => {
    utilNpmDependency.addChild(undefinedNpmDependencyVersion2);

    let actualResult = sinonNpmDependency.find(undefNpmDependencyName);

    expect(actualResult).to.equal(undefinedNpmDependencyVersion2);

    utilNpmDependency.removeUndefined();
  });

  test(`Check findAll() returns null for dependecyName "${undefNpmDependencyName}"`, () => {
    let actualResult = sinonNpmDependency.findAll(undefNpmDependencyName);

    expect(actualResult).to.eql([]);
  });

  test(`Check findAll() returns array of dependencies for dependecyName "${undefNpmDependencyName}"`, () => {
    sinonNpmDependency.addChild(undefinedNpmDependencyVersion1);
    utilNpmDependency.addChild(undefinedNpmDependencyVersion2);

    let actualResult = sinonNpmDependency.findAll(undefNpmDependencyName);

    expect(actualResult).to.includes(undefinedNpmDependencyVersion1);
    expect(actualResult).to.includes(undefinedNpmDependencyVersion2);
  });

  test(`Check toString() with default noHeader = false for "${sinonName}"`, () => {

    let actualResult = sinonNpmDependency.toString();

    expect(actualResult).to.contains(sinonNpmDependency.fullName);
    expect(actualResult).to.contains(utilNpmDependency.fullName);
    expect(actualResult).to.contains(undefinedNpmDependencyVersion1.fullName);
    expect(actualResult).to.contains(undefinedNpmDependencyVersion2.fullName);

    sinonNpmDependency.removeUndefined();
  });

  test('Check getPackagePath for skipMain', () => {
    let rootPath = path.resolve(
      './test/TestMaterials/Property2/Microservice/Backend/src/TestResource/Test'
    );

    let actualResult = sinonNpmDependency.getPackagePath(rootPath);

    expect(actualResult).to.contains(path.join(rootPath, 'package.json'));
  });

  test('Check getPackagePath for !skipMain', () => {
    let rootPath = path.resolve(
      './test/TestMaterials/Property2/Microservice/Backend/src/TestResource/Test'
    );

    let actualResult = sinonNpmDependency.getPackagePath(rootPath, false);

    expect(actualResult).to.contains(path.join(rootPath, `./${sinonName}/package.json`));
  });

  test('Check getPackagePath for !skipMain && has parent', () => {
    let rootPath = path.resolve(
      './test/TestMaterials/Property2/Microservice/Backend/src/TestResource/Test'
    );

    let actualResult = utilNpmDependency.getPackagePath(rootPath, false);

    expect(actualResult).to.contains(
      path.join(rootPath, `./${NpmDependency.NODE_MODULES_DIR}/${utilName}/package.json`)
    );
  });

  test('Check matchInVector() returns null', () => {
    let depsVector = [
      npmDependency,
      undefinedNpmDependencyVersion1,
      undefinedNpmDependencyVersion2,
      sinonNpmDependency,
      utilNpmDependency,
    ];

    let actualResult = NpmDependency.matchInVector(depsVector, 'non-existed name', utilVersion);

    expect(actualResult).to.equal(null);
  });

  test('Check matchInVector() returns valid dependency', () => {
    let depsVector = [
      npmDependency, undefinedNpmDependencyVersion1, undefinedNpmDependencyVersion2,
      sinonNpmDependency, utilNpmDependency,
    ];

    let actualResult = NpmDependency.matchInVector(depsVector, utilName, utilVersion);

    expect(actualResult).to.eql(utilNpmDependency);
  });

  test('Check createFromRawObject() returns valid instance of NpmDependency', () => {
    let rawDepsObject = {
      name: 'depFromObject',
      version: '1.0.1',
      requestedVersion: '1.0.0',
      dependencies: {
        depName: {
          name: 'childObjectDep',
          version: '2.0.0',
        },
      },
    };

    let actualResult = NpmDependency.createFromRawObject(rawDepsObject);

    expect(actualResult).to.be.an.instanceOf(NpmDependency);
    expect(actualResult.hasChildren).to.equal(true);
  });
});
