/**
 * Created by vcernomschi on 2/2/16.
 */

import chai from 'chai';
import ChildProcess from 'child_process';

let exec = ChildProcess.exec;

exec('ls -l', {
  cwd: __dirname,
}, (error, stdout) => {
  if (error) {
    chai.assert.fail(true, true, 'Error while running "ls -l"');
  } else {
    let result = stdout ? stdout.toString().trim() : null;
  }
});