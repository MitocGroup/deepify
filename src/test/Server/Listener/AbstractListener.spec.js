// THIS TEST WAS GENERATED AUTOMATICALLY ON Fri Mar 11 2016 14:47:06 GMT+0200 (EET)

'use strict';

import chai from 'chai';
import {AbstractListener} from '../../../lib/Server/Listener/AbstractListener';
import {Instance} from '../../../lib/Server/Instance';
import {Property_Instance as PropertyInstance} from 'deep-package-manager'

// @todo: Add more advanced tests
suite('Server/Listener/AbstractListener', function() {
  let propertyInstance = new PropertyInstance('./test/TestMaterials/Property2', 'deeploy.test.json');
  let server = new Instance(propertyInstance);
  let abstractRequest = new AbstractRequestListener(server);

  test('Class AbstractListener exists in Server/Listener/AbstractListener', () => {
    chai.expect(AbstractListener).to.be.an('function');
  });

  test('Check _resolveMicroservice', () => {
    let uri = 'microservice2/p/a/t/h';

    let actualResult = abstractRequest._resolveMicroservice(uri);

    chai.expect(actualResult).to.contains('Microservice2');
  });
});
