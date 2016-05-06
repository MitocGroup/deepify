/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/29/16.
 */

'use strict';

module.exports = function(mainPath) {
  let inquirer = require('inquirer');
  let MicroserviceGenerator = require('../../lib.compiled/Generator/MicroserviceGenerator').MicroserviceGenerator;
  let Exec = require('../../lib.compiled/Helpers/Exec').Exec;
  let Bin = require('../../lib.compiled/NodeJS/Bin').Bin;
  let OS = require('os');
  let alphanumericalNotEmpty = require('./helper/inquirer-validators').alphanumericalNotEmpty;

  mainPath = this.normalizeInputPath(mainPath);
  let name = this.opts.locate('name').value;
  let engine = this.opts.locate('engine').value;
  let appSchema = {};

  let promptAppSchema = (cb) => {
    let questionList = [];

    if (name) {
      let validationResult = alphanumericalNotEmpty(name);
      if (validationResult !== true) {
        console.error(validationResult);
        this.exit(1);
      }

      appSchema.name = name;
    } else {
      questionList.push({
        type: 'input',
        name: 'name',
        message: 'Enter the microapp name (e.g. DeepTestMicroservice): ',
        validate: alphanumericalNotEmpty,
      });
    }

    if (engine) {
      if (MicroserviceGenerator.ALLOWED_ENGINES.indexOf(engine) === -1) {
        console.error(
          `'${engine}' frontend engine is not supported yet. ` +
          `Available engines: ${MicroserviceGenerator.ALLOWED_ENGINES.join(',')}`
        );
        
        this.exit(1);
      }
      
      appSchema.engines = [engine];
    } else {
      questionList.push({
        type: 'checkbox',
        name: 'engines',
        message: 'Select the frontend engines you\'d like to use: ',
        choices: MicroserviceGenerator.ALLOWED_ENGINES.map(e => ({name: e, checked: e === 'angular'})),
      });
    }

    if (questionList.length > 0) {
      inquirer.prompt(questionList).then((schema) => {
        Object.assign(appSchema, schema);

        cb();
      });
    } else {
      cb();
    }
  };

  let prepareModels = (cb) => {
    inquirer.prompt([{
      type: 'confirm',
      name: 'yes',
      message: 'Do you want to generate a model? ',
    }]).then((response) => {
      if (response.yes) {
        doGenerateModel(cb);
        return;
      }

      cb();
    })
  };

  let doGenerateModel = (cb) => {
    let cmd = new Exec(
      Bin.node,
      this.scriptPath,
      'generate:model',
      mainPath,
      `-m=${MicroserviceGenerator.identifier(appSchema.name)}`
    );

    cmd.run((result) => {
      if (result.failed) {
        console.error(`deepify generate:model failed with: ${result.error}`);
        this.exit(1);
      }

      inquirer.prompt([{
        type: 'confirm',
        name: 'yes',
        message: 'Do you want to generate another model? ',
      }]).then((response) => {
        if (response.yes) {
          doGenerateModel(cb);
          return;
        }

        if (cb) {
          cb();
        }
      })
    }, true);
  };

  promptAppSchema(() => {
   new MicroserviceGenerator()
      .generate(mainPath, appSchema, (error, path) => {
        if (error) {
          console.error(`An error has occurred while generating the microapp: ${error}`);
          this.exit(1);
        }

        console.log(`'${appSchema.name}' microapp has been successfully generated in ${path}${OS.EOL}`);
        prepareModels();
      });
  });
};
