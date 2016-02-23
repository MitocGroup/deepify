'use strict';

import {expect} from 'chai';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {NpmInstall} from '../../lib/NodeJS/NpmInstall';
import {NpmListDependencies} from '../../lib/NodeJS/NpmListDependencies';
import {NpmDependency} from '../../lib/NodeJS/NpmDependency';

chai.use(sinonChai);

suite('NodeJS/NpmInstall', () => {
  let npmInstall = new NpmInstall();
  let npmListDependencies = new NpmListDependencies('./');

  test('Class NpmInstall exists in NodeJS/NpmInstall', () => {
    expect(NpmInstall).to.be.an('function');
  });

  test('Check DEFAULT_SILENT_STATE getter returns false', () => {
    expect(NpmInstall.DEFAULT_SILENT_STATE).to.equal(false);
  });

  test('Check DEFAULT_CHUNK_SIZE getter returns value above than 0', () => {
    expect(NpmInstall.DEFAULT_CHUNK_SIZE).to.above(0);
  });

  test('Check _mainCmd getter returns valid string', () => {
    expect(npmInstall._mainCmd).to.includes('npm install');
  });

  test('Check constructor sets valid value for _dirs', () => {
    expect(npmInstall).to.be.an.instanceOf(NpmInstall);
    expect(npmInstall.dirs).to.be.eql([]);
  });

  test('Check constructor sets valid value for _extraArgs', () => {
    expect(Array.isArray(npmInstall.extraArgs)).to.be.equal(true);
    expect(npmInstall.extraArgs).to.eql([]);
  });

  test('Check _execArgs getter', () => {
    expect(Array.isArray(npmInstall._execArgs)).to.be.equal(true);
    expect(npmInstall._execArgs[0]).to.includes('npm install');
  });

  test('Check addExtraArg()', () => {
    let length = npmInstall.extraArgs.length;
    let newArg = 'logLevel=debug';

    let actualResult = npmInstall.addExtraArg(newArg);

    expect(actualResult).to.be.an.instanceOf(NpmInstall);
    expect(actualResult.extraArgs.length).to.equal(++length);
    expect(actualResult.extraArgs.pop()).to.equal(newArg);
  });

  test('Check _chunkArray() returns valid array', () => {
    let toChunkArray = ['one', 'two', 'three', 'four'];
    let expectedResult = [['one', 'two', 'three'], ['four']];
    let size = 3;

    let actualResult = NpmInstall._chunkArray(toChunkArray, size);

    expect(actualResult).to.be.an.instanceOf(Array);
    expect(actualResult).to.eql(expectedResult);
  });

  test('Check _newInstance() returns new NpmInstall instance with dirs.length = 3', () => {
    let args = ['mocha', '-g', 'logLevel=debug'];

    let actualResult = npmInstall._newInstance(args);

    expect(actualResult).to.be.an.instanceOf(NpmInstall);
    expect(actualResult.extraArgs).to.eql([]);
    expect(actualResult.dirs).to.eql(args);
  });

  test('Check _newInstance() returns new NpmInstall instance with dirs.length = 3', () => {
    let args = ['mocha'];

    let actualResult = npmInstall._newInstance(args);

    expect(actualResult).to.be.an.instanceOf(NpmInstall);
    expect(actualResult.extraArgs).to.eql([]);
    expect(actualResult.dirs).to.eql(args);
  });

  test('Check run() executes successfully in default mode', () => {
    let args = ['./'];
    let extraArg = 'chai@^3.2.x';
    let spyCallback = sinon.spy();
    let install = npmInstall._newInstance(args);

    install.addExtraArg(extraArg);

    let actualResult = install.run(spyCallback);

    expect(actualResult).to.be.an.instanceOf(NpmInstall);
    expect(npmListDependencies.list(0)).to.be.an.instanceOf(NpmDependency);
  });

  test('Check runChunk() > _runChunkItem() executes successfully in silent mode', () => {
    let args = ['./'];
    let extraArg = 'chai@^2.2.x';
    let spyCallback = sinon.spy();
    let install = npmInstall._newInstance(args);

    install.addExtraArg(extraArg);

    let actualResult = install.runChunk(spyCallback, 3, true);

    expect(actualResult).to.be.an.instanceOf(NpmInstall);
    expect(npmListDependencies.list(0)).to.be.an.instanceOf(NpmDependency);
  });

});
