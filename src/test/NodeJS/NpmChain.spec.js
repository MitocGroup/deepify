'use strict';

import chai from 'chai';
import {NpmChain} from '../../lib/NodeJS/NpmChain';
import {NpmInstall} from '../../lib/NodeJS/NpmInstall';
import {NpmLink} from '../../lib/NodeJS/NpmLink';
import {NpmUpdate} from '../../lib/NodeJS/NpmUpdate';

suite('NodeJS/NpmChain', function() {
  let npmLink = null;
  let npmUpdate = new NpmUpdate();
  let npmChain = null;

  test('Class NpmChain exists in NodeJS/NpmChain', function() {
    chai.expect(typeof NpmChain).to.equal('function');
  });

  test('Check constructor sets _commands', function() {
    let libs = 'mocha isparta';
    npmLink = new NpmLink();
    npmLink.libs = libs;

    npmChain = new NpmChain(npmLink);
    chai.expect(npmChain).to.be.an.instanceOf(NpmChain);
    chai.expect(npmChain.commands[0]).to.be.an.instanceOf(NpmInstall);
    chai.expect(npmChain.commands).to.be.eql([npmLink]);
  });

  //@todo - use other chai assert
  test('Check add() adds command', function() {
    npmChain.add(npmUpdate);
    chai.expect(npmChain).to.be.an.instanceOf(NpmChain);
    chai.expect(npmChain.commands[npmChain.commands.length-1]).to.be.an.instanceOf(NpmInstall);
    chai.expect(npmChain.commands).to.be.eql([npmLink, npmUpdate]);
  });
});
