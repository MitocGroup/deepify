'use strict';

import {expect} from 'chai';
import path from 'path';
import {LambdasExtractor} from '../../lib/Helpers/LambdasExtractor';
import {Property_Instance as PropertyInstance} from 'deep-package-manager';
import {Instance as ServerInstance} from '../../lib/Server/Instance';

suite('Helpers/LambdasExtractor', () => {
  let propertyInstance = null;
  let lambdasExtractor = null;
  let serverInstance = null;
  let lambdaPaths = [
    'test/TestMaterials/Property2/Microservice/Backend/src/TestResource/Test',
    'test/TestMaterials/Property2/Microservice2/Backend/src/TestResource/Test',
  ];

  //for cross platform
  for (var i = 0; i < lambdaPaths.length; i++) {
    lambdaPaths[i] = path.resolve(lambdaPaths[i]);
  }

  test('Class LambdasExtractor exists in Helpers/LambdasExtractor', () => {
    expect(LambdasExtractor).to.be.an('function');
  });

  test('Check constructor sets property()', () => {
    propertyInstance = new PropertyInstance('./test/TestMaterials/Property2', 'deeploy.test.json');

    lambdasExtractor = new LambdasExtractor(propertyInstance);

    expect(propertyInstance).to.be.an.instanceOf(PropertyInstance);
    expect(lambdasExtractor).to.be.an.instanceOf(LambdasExtractor);
    expect(lambdasExtractor.property).to.equal(propertyInstance);
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

    expect(actualResult).to.be.eql([]);
  });

  test('Check extract()', () => {
    let actualResult = lambdasExtractor.extract();

    for (var i = 0; i < actualResult.length; i++) {
      expect(lambdaPaths[i]).to.include(actualResult[i]);
    }
  });

  test('Check extractWorking()', () => {
    let actualResult = lambdasExtractor.extractWorking();

    for (var i = 0; i < actualResult.length; i++) {
      expect(lambdaPaths[i]).to.include(actualResult[i]);
    }
  });

  test('Check NPM_PACKAGE_FILTER', () => {
    let lambdaPath = path.resolve('./test/TestMaterials/Property2/Microservice/Backend/src/TestResource/Test');
    let actualResult = LambdasExtractor.NPM_PACKAGE_FILTER;

    expect(actualResult).to.be.an('function');
    expect(actualResult(lambdaPath)).to.be.equal(true);
  });

  test('Check createFromServer()', () => {
    serverInstance = new ServerInstance(propertyInstance);

    let actualResult = LambdasExtractor.createFromServer(serverInstance);

    expect(
      actualResult, 'is an instance of LambdasExtractor'
    ).to.be.an.instanceOf(LambdasExtractor);
    expect(actualResult.property).to.equal(propertyInstance);
  });
});
