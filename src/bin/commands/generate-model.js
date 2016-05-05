/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/29/16.
 */

'use strict';

module.exports = function(mainPath) {
  let inquirer = require('inquirer');
  let ModelGenerator = require('../../lib.compiled/Generator/ModelGenerator').ModelGenerator;
  let Property = require('deep-package-manager').Property_Instance;
  let Exec = require('../../lib.compiled/Helpers/Exec').Exec;
  let Bin = require('../../lib.compiled/NodeJS/Bin').Bin;
  let OS = require('os');
  let alphanumericalNotEmpty = require('./helper/inquirer-validators').alphanumericalNotEmpty;

  mainPath = this.normalizeInputPath(mainPath);
  let property = new Property(mainPath);
  let name = this.opts.locate('name').value;
  let microservice = this.opts.locate('microapp').value;
  let modelSchema = {fields: []};

  let promptModelSchema = (cb) => {
    let questionList = [];
    let microservices = property.microservices.map(m => m.identifier);

    if (microservice && microservices.indexOf(microservice) !== -1) {
      modelSchema.microservice = property.microservice(microservice);
    } else {
      questionList.push({
        type: 'list',
        name: 'microservice',
        message: 'Select the microservice: ',
        choices: microservices,
      });
    }

    if (name && alphanumericalNotEmpty(name) === true) {
      modelSchema.name = name;
    } else {
      questionList.push({
        type: 'input',
        name: 'name',
        message: 'Enter the model name: ',
        validate: alphanumericalNotEmpty,
        default: name
      });
    }

    if (questionList.length > 0) {
      inquirer.prompt(questionList).then((schema) => {
        if (schema.microservice) {
          schema.microservice = property.microservice(schema.microservice);
        }

        Object.assign(modelSchema, schema);
        cb();
      });
    } else {
      cb();
    }
  };

  let promptModelFields = (cb) => {
    inquirer.prompt([{
      type: 'input',
      name: 'name',
      message: 'Enter field name: ',
      validate: alphanumericalNotEmpty,
    }, {
      type: 'list',
      name: 'type',
      message: 'Select field type: ',
      choices: ModelGenerator.TYPES,
    }, {
      type: 'confirm',
      name: 'continue',
      message: 'Do you want to add another field?',
    }]).then((result) => {
      modelSchema.fields.push({
        name: result.name,
        type: result.type
      });

      if (result.continue) {
        promptModelFields(cb);
      } else {
        cb();
      }
    })
  };

  let prepareLambdas = (cb) => {
    inquirer.prompt([{
      type: 'confirm',
      name: 'yes',
      message: `Do you want to generate a ${modelSchema.name} lambda action? `,
    }]).then((response) => {
      if (response.yes) {
        doGenerateLambda(cb);
        return;
      }

      cb();
    })
  };

  let doGenerateLambda = (cb) => {
    let cmd = new Exec(
      Bin.node,
      this.scriptPath,
      'generate:lambda',
      mainPath,
      `-m=${modelSchema.microservice.identifier}`,
      `-r=${modelSchema.name}`
    );

    cmd.run((result) => {
      if (result.failed) {
        console.error(`deepify generate:lambda failed with: ${result.error}`);
        this.exit(1);
      }

      inquirer.prompt([{
        type: 'confirm',
        name: 'yes',
        message: `Do you want to generate another ${modelSchema.name} lambda action? `,
      }]).then((response) => {
        if (response.yes) {
          doGenerateLambda(cb);
          return;
        }

        if (cb) {
          cb();
        }
      })
    }, true);
  };

  promptModelSchema(() => {
    console.log(`${OS.EOL}You have to add at least 1 field to your model${OS.EOL}`);

    promptModelFields(() => {
      new ModelGenerator()
        .generate(mainPath, modelSchema, (error, path) => {
          if (error) {
            console.error(`Error while generating the model: ${error}`);
            return;
          }

          if (path) {
            console.log(`'${modelSchema.name}' model has been successfully generated in ${path}.`);
            
            prepareLambdas();
          }
        });
    });
  });
};
