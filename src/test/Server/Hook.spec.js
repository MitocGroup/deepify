'use strict';

import chai from 'chai';
import {Hook} from '../../lib/Server/Hook';
import {Instance} from '../../lib/Server/Instance';
import {Property_Instance as PropertyInstance} from 'deep-package-manager';

suite('Server/Hook', () => {
  let hook = null;
  let server = null;
  let propertyInstance = null;

  test('Class Hook exists in Server/Hook', () => {
    chai.expect(Hook).to.be.an('function');
  });

  test('Check constructor sets correctly server', () => {
    propertyInstance = new PropertyInstance('./test/TestMaterials/Property2', 'deeploy.test.json');

    server = new Instance(propertyInstance);

    hook = new Hook(server);

    chai.expect(hook, 'is an instance of Hook').to.be.an.instanceOf(Hook);
    chai.expect(hook.server, 'server is an instance of Server').to.be.an.instanceOf(Instance);
    chai.expect(hook.server).to.be.equal(server);
  });

  test('Check BEFORE static getter', () => {
    chai.expect(Hook.BEFORE).to.be.equal('before');
  });

  test('Check AFTER static getter', () => {
    chai.expect(Hook.AFTER).to.be.equal('after');
  });

  test('Check FILE_NAME static getter', () => {
    chai.expect(Hook.FILE_NAME).to.be.equal('hook.server.js');
  });
});
