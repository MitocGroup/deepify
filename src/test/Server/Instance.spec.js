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

  test('Check constructor sets values for valid property', () => {
    propertyInstance = new PropertyInstance('./test/TestMaterials/Property2', 'deeploy.test.json');

    server = new Instance(propertyInstance);

    chai.expect(propertyInstance).to.be.an.instanceOf(PropertyInstance);
    chai.expect(server).to.be.an.instanceOf(Instance);
  });
});
