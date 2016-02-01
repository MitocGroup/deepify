'use strict';

import chai from 'chai';
import {PackageVersionResolver} from '../../lib/NodeJS/PackageVersionResolver';

suite('NodeJS/PackageVersionResolver', function() {
  let name = 'mocha';
  let version = '2.3.4';
  let nameWithVersion = 'mocha@2.3.4';
  let packagePath = './packagePath';
  let packageVersionResolver = null;


  test('Class PackageVersionResolver exists in NodeJS/PackageVersionResolver', function() {
    chai.expect(typeof PackageVersionResolver).to.equal('function');
  });

  test('Check constructor for !version', function() {
    packageVersionResolver = new PackageVersionResolver(packagePath, nameWithVersion, null);

    chai.expect(packageVersionResolver).to.be.an.instanceOf(PackageVersionResolver);

    chai.expect(packageVersionResolver.packagePath).to.equal(packagePath);
    chai.expect(packageVersionResolver.name).to.equal(name);
    chai.expect(packageVersionResolver.version).to.equal(version);
  });

  test('Check constructor for version', function() {
    packageVersionResolver = new PackageVersionResolver(packagePath, name, version);

    chai.expect(packageVersionResolver).to.be.an.instanceOf(PackageVersionResolver);

    chai.expect(packageVersionResolver.packagePath).to.equal(packagePath);
    chai.expect(packageVersionResolver.name).to.equal(name);
    chai.expect(packageVersionResolver.version).to.equal(version);
  });

  test('Check _command() returns valid string', function() {
    chai.expect(packageVersionResolver._command).to.contain(
      `npm ls --loglevel silent --json ${packageVersionResolver._fullName}`
    );
  });

  test('Check _fullName() returns valid string', function() {
    chai.expect(packageVersionResolver._fullName).to.equal(`${name}@'${version}'`);
  });
});
