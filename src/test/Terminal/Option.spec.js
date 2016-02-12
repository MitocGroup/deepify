'use strict';

import {expect} from 'chai';
import {Option} from '../../lib/Terminal/Option';

suite('Terminal/Option', () => {
  let option = null;
  let name = 'server'

  test('Class Option exists in Terminal/Option', () => {
    expect(Option).to.be.an('function');
  });

  test('Check constructor sets correctly values by default', () => {
    option = new Option(name);

    expect(option, 'is an instance of Option').to.be.an.instanceOf(Option);
    expect(option.name).to.be.equal(name);
    expect(option.description).to.be.equal(null);
    expect(option.alias).to.be.equal(null);
    expect(option.required).to.be.equal(false);
    expect(option.hidden).to.be.equal(false);
  });
});
