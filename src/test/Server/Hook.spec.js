'use strict';

import {expect} from 'chai';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {Hook} from '../../lib/Server/Hook';
import {Instance} from '../../lib/Server/Instance';
import {Property_Instance as PropertyInstance} from 'deep-package-manager';

chai.use(sinonChai);

suite('Server/Hook', () => {
  let hook = null;
  let server = null;
  let propertyInstance = null;

  test('Class Hook exists in Server/Hook', () => {
    expect(Hook).to.be.an('function');
  });

  test('Check constructor sets correctly server', () => {
    propertyInstance = new PropertyInstance('./test/TestMaterials/Property2', 'deeploy.test.json');

    server = new Instance(propertyInstance);

    hook = new Hook(server);

    expect(hook, 'is an instance of Hook').to.be.an.instanceOf(Hook);
    expect(hook.server, 'server is an instance of Server').to.be.an.instanceOf(Instance);
    expect(hook.server).to.be.equal(server);
  });

  test('Check BEFORE static getter', () => {
    expect(Hook.BEFORE).to.be.equal('before');
  });

  test('Check AFTER static getter', () => {
    expect(Hook.AFTER).to.be.equal('after');
  });

  test('Check FILE_NAME static getter', () => {
    expect(Hook.FILE_NAME).to.be.equal('hook.server.js');
  });

  test('Check _createContext', () => {
    expect(hook._createContext('after').isAfter()).to.be.equal(true);
    expect(hook._createContext('after').isBefore()).to.be.equal(false);
    expect(hook._createContext('before').isAfter()).to.be.equal(false);
    expect(hook._createContext('before').isBefore()).to.be.equal(true);
  });

  test('Check _run for no hook files', () => {
    //arrange
    let spyCallback = sinon.spy();
    let type = 'before';

    //act
    let actualResult = hook._run(propertyInstance.microservices[0], type, spyCallback);

    //assert
    expect(spyCallback).to.have.been.calledWithExactly();
    expect(actualResult, 'is an instance of Hook').to.be.an.instanceOf(Hook);
  });

  //@todo - need to clarify why cb is not executed
  test('Check run()', () => {
    let spyCallback = sinon.spy();
    let type = 'before';

    let actualResult = hook.run(type, spyCallback);

    expect(actualResult, 'is an instance of Hook').to.be.an.instanceOf(Hook);
  });

  test('Check runBefore()', () => {
    let spyCallback = sinon.spy();

    let actualResult = hook.runBefore(spyCallback);

    expect(actualResult, 'is an instance of Hook').to.be.an.instanceOf(Hook);
  });

  test('Check runAfter()', () => {
    let spyCallback = sinon.spy();

    let actualResult = hook.runAfter(spyCallback);

    expect(actualResult, 'is an instance of Hook').to.be.an.instanceOf(Hook);
  });
});
