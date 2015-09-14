#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(dumpPath) {
  var path = require('path');
  var fse = require('fs-extra');
  var exec = require('child_process').exec;
  var tmp = require('tmp');
  var repoUrl = 'https://github.com/MitocGroup/deep-microservices-helloworld.git';

  if (dumpPath.indexOf('/') !== 0) {
    dumpPath = path.join(process.cwd(), dumpPath);
  }

  var tmpFolder = tmp.dirSync().name;

  console.log('Cloning the "Hello World" sample property into ' + tmpFolder);

  exec('cd ' + tmpFolder + ' && git clone --depth=1 ' + repoUrl + ' .', function(error, stdout, stderr) {
    if (error) {
      console.error('Error cloning ' + repoUrl + ' repository into ' + tmpFolder + ': ' + stderr);
      fse.removeSync(tmpFolder);
      return;
    }

    console.log('Copy cloned "Hello World" source into ' + dumpPath);

    fse.copySync(path.join(tmpFolder, 'src'), dumpPath, {clobber: true});
    fse.removeSync(tmpFolder);

    console.log('Installing Babel globally');

    exec('npm install -g babel', function(error, stdout, stderr) {
      if (error) {
        console.error('Error installing Babel globally: ' + stderr);
        return;
      }

      console.log('Running "npm install" on SayHello Lambda');

      var lambdaPath = path.join(dumpPath, 'HelloWorld/Backend/src/SayHello');

      exec('cd ' + lambdaPath + ' && npm install', function(error, stdout, stderr) {
        if (error) {
          console.error('Error installing SayHello Lambda dependencies: ' + stderr);
          return;
        }

        console.log('Sample property was successfully dumped.');
      }.bind(this));
    }.bind(this));
  }.bind(this));
};
