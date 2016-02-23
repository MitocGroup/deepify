'use strict';

import {expect} from 'chai';
import {Prompt} from '../../lib/Terminal/Prompt';
import {Helpers_Terminal_Prompt as MainPrompt} from 'deep-package-manager';

suite('Terminal/Prompt', function() {
  let prompt = new Prompt();

  test('Class Prompt exists in Terminal/Prompt', function() {
    expect(typeof Prompt).to.equal('function');
  });

  test('Check constructor sets correctly values by default', () => {
    prompt = new Prompt();

    expect(prompt, 'is an instance of Prompt').to.be.an.instanceOf(Prompt);
    expect(prompt, 'is an instance of MainPrompt').to.be.an.instanceOf(MainPrompt);
  });
});
