'use strict';

import {expect} from 'chai';
import path from 'path';
import {ValidationSchemasSync} from '../../lib/Helpers/ValidationSchemasSync';
import {Property_Instance as PropertyInstance} from 'deep-package-manager';
import {Instance as ServerInstance} from '../../lib/Server/Instance';

suite('Helpers/ValidationSchemasSync', function() {
  let validationSchemasSync = null;
  let propertyInstance = null;
  let serverInstance = null;

  test('Class ValidationSchemasSync exists in Helpers/ValidationSchemasSync', () => {
    expect(ValidationSchemasSync).to.be.an('function');
  });

  test('Check constructor sets property', () => {
    propertyInstance = new PropertyInstance('./test/TestMaterials/Property2', 'deeploy.test.json');

    validationSchemasSync = new ValidationSchemasSync(propertyInstance);

    expect(
      validationSchemasSync, 'is an instance of ValidationSchemasSync'
    ).to.be.an.instanceOf(ValidationSchemasSync);
    expect(validationSchemasSync.property).to.equal(propertyInstance);
  });

  test('Check NPM_PACKAGE_FILTER', () => {
    let lambdaPath = path.resolve('./test/TestMaterials/Property2/Microservice/Backend/src/TestResource/Test');
    let actualResult = ValidationSchemasSync.NPM_PACKAGE_FILTER;

    expect(actualResult).to.be.an('function');
    expect(actualResult(lambdaPath)).to.be.equal(true);
  });

  //@todo - add smart asserts
  test('Check sync()', () => {
    let actualResult = validationSchemasSync.sync();

    expect(actualResult).to.be.an('function');
  });

  //@todo - add smart asserts
  test('Check syncWorking()', () => {
    let actualResult = validationSchemasSync.syncWorking();

    expect(actualResult).to.be.an('function');
  });

  test('Check createFromServer()', () => {
    serverInstance = new ServerInstance(propertyInstance);

    let actualResult = ValidationSchemasSync.createFromServer(serverInstance);

    expect(
      actualResult, 'is an instance of ValidationSchemasSync'
    ).to.be.an.instanceOf(ValidationSchemasSync);
    expect(actualResult.property).to.equal(propertyInstance);
  });
});
