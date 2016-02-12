'use strict';

import {expect} from 'chai';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import path from 'path';
import {Instance} from '../../lib/Server/Instance';
import {PropertyObjectRequiredException} from '../../lib/Server/Exception/PropertyObjectRequiredException';
import {Property_Instance as PropertyInstance} from 'deep-package-manager';
import {Property_Frontend as Frontend} from 'deep-package-manager';

chai.use(sinonChai);

suite('Server/Instance', () => {
  let server = null;
  let propertyInstance = null;

  test('Class Instance exists in Server/Instance', () => {
    expect(Instance).to.be.an('function');
  });

  test('Check constructor throws exception for invalid property', () => {
    let error = null;

    try {
      server = new Instance({});
    } catch(e) {
      error = e;
    }

    expect(error).to.be.an.instanceOf(PropertyObjectRequiredException);
  });

  test('Check constructor sets correctly properties for valid property', () => {
    propertyInstance = new PropertyInstance('./test/TestMaterials/Property2', 'deeploy.test.json');

    server = new Instance(propertyInstance);

    expect(server).to.be.an.instanceOf(Instance);
    expect(server.property).to.be.an.instanceOf(PropertyInstance);
    expect(server.property).to.be.equal(propertyInstance);
    expect(server.logger).to.be.an('function');
    expect(server.nativeServer).to.be.equal(null);
    expect(server.fs).to.be.equal(null);
    expect(server.host).to.be.equal(null);
    expect(server._localId).to.be.equal(0);
  });

  test('Check logger getter/setter', () => {
    let logger = server.logger;
    let newLogger = (...args) => {
      console.debug(...args);
    };

    server.logger = newLogger;
    expect(server.logger).to.be.equal(newLogger);

    server.logger = logger;
    expect(server.logger).to.be.equal(logger);
  });

  test('Check profiling getter/setter', () => {
    let profiling = server.profiling;

    server.profiling = true;
    expect(server.profiling).to.be.equal(true);

    server.profiling = false;
    expect(server.profiling).to.be.equal(false);

    server.profiling = profiling;
    expect(server.profiling).to.be.equal(profiling);
  });

  test('Check localId getter postincrements _localId', () => {
    let localId = server._localId;
    let expectedResult = localId + 1;

    let actualResult = server.localId;

    expect(actualResult).to.be.equal(localId);
    expect(server._localId).to.be.equal(expectedResult);
  });

  test('Check _setup()', () => {
    server._setup();

    expect(server._rootMicroservice).to.have.all.keys('frontend', 'identifier', 'lambdas', 'path');
    expect(server._defaultFrontendConfig).to.be.an('object');
  });

  test('Check buildPath > _populateBuildConfig()', () => {
    let error = null;

    try {
      server.buildPath = path.join(__dirname, '../TestMaterials');
    } catch (e) {
      error = e;
    }

    console.log('error buildPath: ', error);
  });

  test('Check running returns false', () => {
    expect(server.running).to.equal(false);
  });

  test('Check stop() when !running', () => {
    let spyCallback = sinon.spy();

    let actualResult = server.stop(spyCallback);

    expect(actualResult, 'is an instance of Server').to.be.an.instanceOf(Instance);
    expect(spyCallback).to.have.been.calledWithExactly();
  });

  test('Check LAMBDA_URI static getter', () => {
    expect(Instance.LAMBDA_URI).to.equal('/_/lambda');
  });

  test('Check LAMBDA_ASYNC_URI static getter', () => {
    expect(Instance.LAMBDA_ASYNC_URI).to.equal('/_/lambda-async');
  });

  test('Check _kernelMock getter', () => {
    let actualResult = server._kernelMock;

    expect(actualResult).to.be.an('object');
    expect(actualResult).to.have.all.keys('config', 'microservice');
  });

  test('Check _resolveMicroservice', () => {
    let uri = 'microservice2/p/a/t/h';

    let actualResult = server._resolveMicroservice(uri);

    expect(actualResult).to.contains('Microservice2');
  });

  //@todo - need to rework
  test('Check listen()', () => {
    let actualResult = server.listen();
  });

  //@todo - need to rework
  //test('Check _runLambda()', () => {
  //  let response = {};
  //  let lambdaConfig = {};
  //  let payload = {};
  //  let asyncMode = false;
  //
  //  let actualResult = server._runLambda(response, lambdaConfig, payload, asyncMode);
  //});
});
