'use strict';

import chai from 'chai';
import {Instance} from '../../lib/Server/Instance';
import {PropertyObjectRequiredException} from '../../lib/Server/Exception/PropertyObjectRequiredException';
import {Property_Instance as PropertyInstance} from 'deep-package-manager';

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

  test('Check localId getter postincrements _localId', () => {
    let localId = server._localId;
    let expectedResult = localId + 1;

    let actualResult = server.localId;

    chai.expect(actualResult).to.be.equal(localId);
    chai.expect(server._localId).to.be.equal(expectedResult);
  });
});
