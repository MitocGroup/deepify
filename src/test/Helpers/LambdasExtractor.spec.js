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

  test('Check _extract()', () => {
    let microservices = {
      'hello.world.example': {
        isRoot: false,
        parameters: {},
        resources: {
          sample: {
            'say-hello': {
              type: 'lambda',
              methods: [
                'POST',
              ],
              forceUserIdentity: true,
              region: 'us-west-2',
              source: {
                api: 'https://1zf47jpvxd.execute-api.us-west-2.amazonaws.com/dev/hello-world-example/sample/say-hello',
                original: 'arn:aws:lambda:us-west-2:389615756922:function:DeepDevSampleSayHello64232f3705a',
              },
            },
          },
        },
      },
    };

    let actualResult = LambdasExtractor._extract(microservices);

    chai.expect(actualResult).to.be.eql([]);
  });
});
