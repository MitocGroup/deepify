// THIS TEST WAS GENERATED AUTOMATICALLY ON Fri Mar 11 2016 14:47:06 GMT+0200 (EET)

'use strict';

import chai from 'chai';
import {LambdaListener} from '../../../lib/Server/Listener/LambdaListener';

// @todo: Add more advanced tests
suite('Server/Listener/LambdaListener', function() {
  test('Class LambdaListener exists in Server/Listener/LambdaListener', () => {
    chai.expect(LambdaListener).to.be.an('function');
  });

  test('Check LAMBDA_URI static getter', () => {
    chai.expect(AbstractRequestListener.LAMBDA_URI).to.equal('/_/lambda');
  });

  test('Check LAMBDA_ASYNC_URI static getter', () => {
    chai.expect(AbstractRequestListener.LAMBDA_ASYNC_URI).to.equal('/_/lambda-async');
  });
});
