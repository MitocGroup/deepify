/**
 * Created by vcernomschi on 2/2/16.
 */

import {expect} from 'chai';
import ChildProcess from 'child_process';

let exec = ChildProcess.exec;

exec('ls -l', {
  cwd: __dirname,
}, (error, stdout) => {
  if (error) {
    expect.fail(true, true, 'Error while running "ls -l"');
  } else {
    let result = stdout ? stdout.toString().trim() : null;
  }
});