'use strict';

import chai from 'chai';
import {ForksManager} from '../../lib/Lambda/ForksManager';
import ChildProcess from 'child_process';
import path from 'path';

suite('Lambda/ForksManager', () =>  {
  let forkPath = path.join(__dirname + './../TestMaterials/PathToForked/child');

  test('Class ForksManager exists in Lambda/ForksManager', () =>  {
    chai.expect(typeof ForksManager).to.equal('function');
  });

  test('Check STORAGE_KEY static getter', () =>  {
    chai.expect(ForksManager.STORAGE_KEY).to.equal('_deep_fm_forks_');
  });

  test('Check SIGKILL_KEY static getter', () =>  {
    chai.expect(ForksManager.SIGKILL_KEY).to.equal('_deep_fm_sigkill_');
  });

  test('Check _isManaged static getter return false', () =>  {
    chai.expect(ForksManager._isManaged, '_isManaged returns false').to.equal(false);
  });

  test('Check _wasMainProcessKilled static getter return false', () =>  {
    chai.expect(ForksManager._wasMainProcessKilled, '_wasMainProcessKilled returns false').to.equal(false);
  });

  test('Check _isForksStackEmpty static getter return true', () =>  {
    chai.expect(ForksManager._isForksStackEmpty, '_isForksStackEmpty returns false').to.equal(true);
  });

  test('Check manage() for !ForksManager._isManaged', () =>  {
    let fork = ChildProcess.fork(forkPath);

    let actualResult = ForksManager.manage(fork);

    chai.expect(actualResult, 'returns undefined').to.equal(undefined);
    chai.expect(ForksManager._isManaged, '_isManaged returns false').to.equal(false);
    chai.expect(ForksManager._wasMainProcessKilled, '_wasMainProcessKilled returns false').to.equal(false);
    chai.expect(ForksManager._isForksStackEmpty, '_isForksStackEmpty returns false').to.equal(true);
  });

  test('Check registerListener() for !ForksManager._isManaged', () =>  {
    ForksManager.registerListener();

    chai.expect(ForksManager._isManaged, '_isManaged returns true').to.equal(true);
    chai.expect(ForksManager._isForksStackEmpty, '_isForksStackEmpty returns true').to.equal(true);
    chai.expect(ForksManager._wasMainProcessKilled, '_wasMainProcessKilled returns false').to.equal(false);
  });

  test('Check manage() > _addForkToStack() ', () =>  {
    let fork = ChildProcess.fork(forkPath);

    ForksManager.manage(fork);

    chai.expect(ForksManager._isManaged, '_isManaged returns true').to.equal(true);
    chai.expect(ForksManager._isForksStackEmpty, '_isForksStackEmpty returns false').to.equal(false);
    chai.expect(ForksManager._wasMainProcessKilled, '_wasMainProcessKilled returns false').to.equal(false);
  });

  test('Check registerListener() for ForksManager._isManaged', () =>  {
    let actualResult = ForksManager.registerListener();

    chai.expect(actualResult, 'returns undefined').to.equal(undefined);
    chai.expect(ForksManager._isManaged, '_isManaged returns true').to.equal(true);
    chai.expect(ForksManager._isForksStackEmpty, '_isForksStackEmpty returns false').to.equal(false);
    chai.expect(ForksManager._wasMainProcessKilled, '_wasMainProcessKilled returns false').to.equal(false);
  });
});
