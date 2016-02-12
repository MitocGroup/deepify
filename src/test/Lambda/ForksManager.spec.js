'use strict';

import {expect} from 'chai';
import {ForksManager} from '../../lib/Lambda/ForksManager';
import ChildProcess from 'child_process';
import path from 'path';

suite('Lambda/ForksManager', function () {
  let forkPath = path.join(__dirname + './../TestMaterials/PathToForked/child');

  test('Class ForksManager exists in Lambda/ForksManager', function () {
    expect(typeof ForksManager).to.equal('function');
  });

  test('Check STORAGE_KEY static getter', function () {
    expect(ForksManager.STORAGE_KEY).to.equal('_deep_fm_forks_');
  });

  test('Check SIGKILL_KEY static getter', function () {
    expect(ForksManager.SIGKILL_KEY).to.equal('_deep_fm_sigkill_');
  });

  test('Check _isManaged static getter return false', function () {
    expect(ForksManager._isManaged, '_isManaged returns false').to.equal(false);
  });

  test('Check _wasMainProcessKilled static getter return false', function () {
    expect(ForksManager._wasMainProcessKilled, '_wasMainProcessKilled returns false').to.equal(false);
  });

  test('Check _isForksStackEmpty static getter return true', function () {
    expect(ForksManager._isForksStackEmpty, '_isForksStackEmpty returns false').to.equal(true);
  });

  test('Check manage() for !ForksManager._isManaged', function () {
    let fork = ChildProcess.fork(forkPath);

    let actualResult = ForksManager.manage(fork);

    expect(actualResult, 'returns undefined').to.equal(undefined);
    expect(ForksManager._isManaged, '_isManaged returns false').to.equal(false);
    expect(ForksManager._wasMainProcessKilled, '_wasMainProcessKilled returns false').to.equal(false);
    expect(ForksManager._isForksStackEmpty, '_isForksStackEmpty returns false').to.equal(true);
  });

  test('Check registerListener() for !ForksManager._isManaged', function () {
    ForksManager.registerListener();

    expect(ForksManager._isManaged, '_isManaged returns true').to.equal(true);
    expect(ForksManager._isForksStackEmpty, '_isForksStackEmpty returns true').to.equal(true);
    expect(ForksManager._wasMainProcessKilled, '_wasMainProcessKilled returns false').to.equal(false);
  });

  test('Check manage() > _addForkToStack() ', function() {
    let fork = ChildProcess.fork(forkPath);

    ForksManager.manage(fork);

    expect(ForksManager._isManaged, '_isManaged returns true').to.equal(true);
    expect(ForksManager._isForksStackEmpty, '_isForksStackEmpty returns false').to.equal(false);
    expect(ForksManager._wasMainProcessKilled, '_wasMainProcessKilled returns false').to.equal(false);
  });

  test('Check registerListener() for ForksManager._isManaged', function () {
    let actualResult = ForksManager.registerListener();

    expect(actualResult, 'returns undefined').to.equal(undefined);
    expect(ForksManager._isManaged, '_isManaged returns true').to.equal(true);
    expect(ForksManager._isForksStackEmpty, '_isForksStackEmpty returns false').to.equal(false);
    expect(ForksManager._wasMainProcessKilled, '_wasMainProcessKilled returns false').to.equal(false);
  });
});
