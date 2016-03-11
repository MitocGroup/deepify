'use strict';

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
    chai.expect(Instance).to.be.an('function');
  });

  test('Check constructor throws exception for invalid property', () => {
    let error = null;

    try {
      server = new Instance({});
    } catch(e) {
      error = e;
    }

    chai.expect(error).to.be.an.instanceOf(PropertyObjectRequiredException);
  });

  test('Check constructor sets correctly properties for valid property', () => {
    propertyInstance = new PropertyInstance('./test/TestMaterials/Property2', 'deeploy.test.json');

    server = new Instance(propertyInstance);

    chai.expect(server).to.be.an.instanceOf(Instance);
    chai.expect(server.property).to.be.an.instanceOf(PropertyInstance);
    chai.expect(server.property).to.be.equal(propertyInstance);
    chai.expect(server.logger).to.be.an('function');
    chai.expect(server.nativeServer).to.be.equal(null);
    chai.expect(server.fs).to.be.equal(null);
    chai.expect(server.host).to.be.equal(null);
    chai.expect(server._localId).to.be.equal(0);
  });

  test('Check logger getter/setter', () => {
    let logger = server.logger;
    let newLogger = (...args) => {
      console.debug(...args);
    };

    server.logger = newLogger;
    chai.expect(server.logger).to.be.equal(newLogger);

    server.logger = logger;
    chai.expect(server.logger).to.be.equal(logger);
  });

  test('Check profiling getter/setter', () => {
    let profiling = server.profiling;

    server.profiling = true;
    chai.expect(server.profiling).to.be.equal(true);

    server.profiling = false;
    chai.expect(server.profiling).to.be.equal(false);

    server.profiling = profiling;
    chai.expect(server.profiling).to.be.equal(profiling);
  });

  test('Check localId getter postincrements _localId', () => {
    let localId = server._localId;
    let expectedResult = localId + 1;

    let actualResult = server.localId;

    chai.expect(actualResult).to.be.equal(localId);
    chai.expect(server._localId).to.be.equal(expectedResult);
  });

  test('Check _setup()', () => {
    server._setup();

    chai.expect(server._rootMicroservice).to.have.all.keys('frontend', 'identifier', 'lambdas', 'path');
    chai.expect(server._defaultFrontendConfig).to.be.an('object');
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
    chai.expect(server.running).to.equal(false);
  });

  test('Check stop() when !running', () => {
    let spyCallback = sinon.spy();

    let actualResult = server.stop(spyCallback);

    chai.expect(actualResult, 'is an instance of Server').to.be.an.instanceOf(Instance);
    chai.expect(spyCallback).to.have.been.calledWithExactly();
  });



  test('Check _kernelMock getter', () => {
    let actualResult = server._kernelMock;

    chai.expect(actualResult).to.be.an('object');
    chai.expect(actualResult).to.have.all.keys('config', 'microservice');
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
