// THIS TEST WAS GENERATED AUTOMATICALLY ON Fri Mar 11 2016 11:45:32 GMT+0200 (EET)

'use strict';

import chai from 'chai';
import {AbstractRequestListener} from '../../../lib/Server/Listener/AbstractRequestListener';
import {Instance} from '../../../lib/Server/Instance';
import {Property_Instance as PropertyInstance} from 'deep-package-manager';


// @todo: Add more advanced tests
suite('Server/Listener/AbstractRequestListener', function() {
  let propertyInstance = new PropertyInstance('./test/TestMaterials/Property2', 'deeploy.test.json');
  let server = new Instance(propertyInstance);
  let abstractRequest = new AbstractRequestListener(server);

  test('Class AbstractRequestListener exists in Server/Listener/AbstractRequestListener', () => {
    chai.expect(AbstractRequestListener).to.be.an('function');
  });

  test('Check LAMBDA_URI static getter', () => {
    chai.expect(AbstractRequestListener.LAMBDA_URI).to.equal('/_/lambda');
  });

  test('Check LAMBDA_ASYNC_URI static getter', () => {
    chai.expect(AbstractRequestListener.LAMBDA_ASYNC_URI).to.equal('/_/lambda-async');
  });

  test('Check _resolveMicroservice', () => {
    let uri = 'microservice2/p/a/t/h';

    let actualResult = abstractRequest._resolveMicroservice(uri);

    chai.expect(actualResult).to.contains('Microservice2');
  });
});
