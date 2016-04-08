'use strict';

import chai from 'chai';
import {LambdasExtractor} from '../../lib/Helpers/LambdasExtractor';
import {Property_Instance as PropertyInstance} from 'deep-package-manager';

suite('Helpers/LambdasExtractor', () => {
  let propertyInstance = null;
  let lambdasExtractor = null;

  test('Class LambdasExtractor exists in Helpers/LambdasExtractor', () => {
    chai.expect(LambdasExtractor).to.be.an('function');
  });

  test('Check _extract()', () => {
    propertyInstance = new PropertyInstance('./test/TestMaterials/Property2', 'deeploy.test.json');

    lambdasExtractor = new LambdasExtractor(propertyInstance);

    chai.expect(propertyInstance).to.be.an.instanceOf(PropertyInstance);
    chai.expect(lambdasExtractor).to.be.an.instanceOf(LambdasExtractor);
    chai.expect(lambdasExtractor.property).to.equal(propertyInstance);
  });
});
