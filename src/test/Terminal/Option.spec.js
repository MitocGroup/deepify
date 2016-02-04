'use strict';

import chai from 'chai';
import {Option} from '../../lib/Terminal/Option';

suite('Terminal/Option', () => {
  let option = null;
  let name = 'server'

  test('Class Option exists in Terminal/Option', () => {
    chai.expect(Option).to.be.an('function');
  });

  test('Check constructor sets correctly values by default', () => {
    option = new Option(name);

    chai.expect(option, 'is an instance of Option').to.be.an.instanceOf(Option);
    chai.expect(option.name).to.be.equal(name);
    chai.expect(option.description).to.be.equal(null);
    chai.expect(option.alias).to.be.equal(null);
    chai.expect(option.required).to.be.equal(false);
    chai.expect(option.hidden).to.be.equal(false);
  });
});
