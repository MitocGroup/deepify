'use strict';

import {expect} from 'chai';
import {NpmInstallLibs} from '../../lib/NodeJS/NpmInstallLibs';
import {NpmInstall} from '../../lib/NodeJS/NpmInstall';

suite('NodeJS/NpmInstallLibs', () => {
  let libs = 'mocha isparta';
  let libsArray = ['codacy-coverage', 'istanbul'];
  let npmInstallLibs = null;

  test('Class NpmInstallLibs exists in NodeJS/NpmInstallLibs', () => {
    expect(NpmInstallLibs).to.be.an('function');
  });

  test('Check constructor sets _libsPlain = null, global = false', () => {
    npmInstallLibs = new NpmInstallLibs();
    expect(npmInstallLibs).to.be.an.instanceOf(NpmInstallLibs);
    expect(npmInstallLibs.libsPlain).to.equal(null);
    expect(npmInstallLibs.global).to.equal(false);
  });

  test('Check _libsPlain setter', () => {
    npmInstallLibs.libs = libsArray;
    expect(npmInstallLibs.libsPlain).to.equal(libsArray.join(' '));

    npmInstallLibs.libs = libs;
    expect(npmInstallLibs.libsPlain).to.equal(libs);
  });

  test('Check global setter', () => {
    npmInstallLibs.global = false;
    expect(npmInstallLibs.global).to.equal(false);

    npmInstallLibs.global = true;
    expect(npmInstallLibs.global).to.equal(true);
    expect(npmInstallLibs.dirs).to.eql([process.cwd()]);
  });

  test('Check _newInstance() returns new NpmInstall instance with dirs.length = 3', () => {
    let args = ['mocha', '-g', 'logLevel=debug'];

    let actualResult = npmInstallLibs._newInstance(args);

    expect(actualResult).to.be.an.instanceOf(NpmInstall);
    expect(actualResult.libsPlain).to.equal(libs);
  });

  test('Check _mainCmd getter returns valid string', () => {
    expect(npmInstallLibs._mainCmd).to.includes(`npm install ${libs}`);
  });
});
