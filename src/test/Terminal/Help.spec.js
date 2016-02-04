'use strict';

import chai from 'chai';
import {Help} from '../../lib/Terminal/Help';
import {Program} from '../../lib/Terminal/Program';

suite('Terminal/Help', () => {

  let program = null;
  let help = null;

  test('Class Help exists in Terminal/Help', () => {
    chai.expect(Help).to.be.an('function');
  });

  test('Check constructor sets correctly values by default', () => {
    program = new Program();
    help = new Help(program)

    chai.expect(help, 'is an instance of Help').to.be.an.instanceOf(Help);
    chai.expect(help.program, 'is an instance of Program').to.be.an.instanceOf(Program);
    chai.expect(help.program).to.be.eql(program);
  });
});
