'use strict';

import chai from 'chai';
import {NpmInstallLibs} from '../../lib/NodeJS/NpmInstallLibs';
import {NpmInstall} from '../../lib/NodeJS/NpmInstall';

suite('NodeJS/NpmInstallLibs', function() {
  let libs = 'mocha isparta';
  let libsArray = ['codacy-coverage', 'istanbul'];
  let npmInstallLibs = null;

  test('Class NpmInstallLibs exists in NodeJS/NpmInstallLibs', function() {
    chai.expect(typeof NpmInstallLibs).to.equal('function');
  });

  test('Check constructor sets _libsPlain = null, global = false', function() {
    npmInstallLibs = new NpmInstallLibs();
    chai.expect(npmInstallLibs).to.be.an.instanceOf(NpmInstallLibs);
    chai.expect(npmInstallLibs.libsPlain).to.equal(null);
    chai.expect(npmInstallLibs.global).to.equal(false);
  });

  test('Check _libsPlain setter', function() {
    npmInstallLibs.libs = libsArray;
    chai.expect(npmInstallLibs.libsPlain).to.equal(libsArray.join(' '));

    npmInstallLibs.libs = libs;
    chai.expect(npmInstallLibs.libsPlain).to.equal(libs);
  });

  test('Check global setter', function() {
    npmInstallLibs.global = false;
    chai.expect(npmInstallLibs.global).to.equal(false);

    npmInstallLibs.global = true;
    chai.expect(npmInstallLibs.global).to.equal(true);
    chai.expect(npmInstallLibs.dirs).to.eql([process.cwd()]);
  });

  test('Check _newInstance() returns new NpmInstall instance with dirs.length = 3', function() {
    let args = ['mocha', '-g', 'logLevel=debug'];

    let actualResult = npmInstallLibs._newInstance(args);

    chai.expect(actualResult).to.be.an.instanceOf(NpmInstall);
    chai.expect(actualResult.libsPlain).to.equal(libs);
  });

  test('Check _mainCmd getter returns valid string', function() {
    chai.expect(npmInstallLibs._mainCmd).to.includes(`npm install ${libs}`);
  });
});
