'use strict';

import {expect} from 'chai';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {PackageVersionResolver} from '../../lib/NodeJS/PackageVersionResolver';

chai.use(sinonChai);

suite('NodeJS/PackageVersionResolver', () => {
  let name = 'sinon';
  let version = '1.17';
  let nameWithVersion = 'sinon@1.17';
  let packagePath = './node_modules';
  let packageVersionResolver = null;
  let versionPattern = /\d+\.\d+\.\d+/;

  test('Class PackageVersionResolver exists in NodeJS/PackageVersionResolver', () => {
    expect(PackageVersionResolver).to.be.an('function');
  });

  test('Check constructor for !version', () => {
    packageVersionResolver = new PackageVersionResolver(packagePath, nameWithVersion, null);

    expect(packageVersionResolver).to.be.an.instanceOf(PackageVersionResolver);

    expect(packageVersionResolver.packagePath).to.equal(packagePath);
    expect(packageVersionResolver.name).to.equal(name);
    expect(packageVersionResolver.version).to.equal(version);
  });

  test('Check constructor for version', () => {
    packageVersionResolver = new PackageVersionResolver(packagePath, name, version);

    expect(packageVersionResolver).to.be.an.instanceOf(PackageVersionResolver);

    expect(packageVersionResolver.packagePath).to.equal(packagePath);
    expect(packageVersionResolver.name).to.equal(name);
    expect(packageVersionResolver.version).to.equal(version);
  });

  test('Check _command() returns valid string', () => {
    expect(packageVersionResolver._command).to.contain(
      `npm ls --loglevel silent --json ${packageVersionResolver._fullName}`
    );
  });

  test('Check _fullName() returns valid string', () => {
    expect(packageVersionResolver._fullName).to.equal(`${name}@'${version}'`);
  });

  test('Check resolve() executed successfully for !async', () => {
    let spyCallback = sinon.spy();

    let actualResult = packageVersionResolver.resolve(spyCallback, false);

    let spyCallbackArgs = spyCallback.args[0];

    expect(actualResult).to.be.an.instanceOf(PackageVersionResolver);
    expect(spyCallbackArgs[0]).to.equal(null);
    expect(versionPattern.test(spyCallbackArgs[1])).to.equal(true);
  });

  test('Check resolve() executed with error for !async', () => {
    let spyCallback = sinon.spy();
    let packagePath = './../invalidPath';
    let nameWithVersion = 'sinon@1.16';
    let packageVersionResolver = new PackageVersionResolver(packagePath, nameWithVersion, null);

    let actualResult = packageVersionResolver.resolve(spyCallback, false);

    let spyCallbackArgs = spyCallback.args[0];

    expect(actualResult).to.be.an.instanceOf(PackageVersionResolver);
    expect(spyCallbackArgs[1]).to.equal(null);
    expect(spyCallbackArgs[0].toString()).to.include(`failed in '${packagePath}' with exit code`);
  });

  test('Check resolve() from cache', () => {
    let spyCallback = sinon.spy();

    let actualResult = packageVersionResolver.resolve(spyCallback, false);

    let spyCallbackArgs = spyCallback.args[0];

    expect(actualResult).to.be.an.instanceOf(PackageVersionResolver);
    expect(spyCallbackArgs[0]).to.equal(null);
    expect(versionPattern.test(spyCallbackArgs[1])).to.equal(true);
  });

  test('Check resolve() executed successfully for async', (done) => {
    let callback = (error, data) => {

      expect(error).to.equal(null);
      expect(versionPattern.test(data)).to.equal(true);

      //done async
      done();
    };

    let nameWithVersion = 'sinon@1';
    let packageVersionResolver = new PackageVersionResolver(packagePath, nameWithVersion, null);

    let actualResult = packageVersionResolver.resolve(callback);

    expect(actualResult).to.be.an.instanceOf(PackageVersionResolver);
  });
});
