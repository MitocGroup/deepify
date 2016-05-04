/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/29/16.
 */

'use strict';

module.exports = function(mainPath) {
  let path = require('path');
  let inquirer = require('inquirer');
  let FS = require('fs');
  let ModelGenerator = require('../../lib.compiled/Generator/ModelGenerator').ModelGenerator;
  let Property = require('deep-package-manager').Property_Instance;

  mainPath = this.normalizeInputPath(mainPath);
  let property = new Property(mainPath);
  let name = this.opts.locate('name').value;

  console.log(`
Welcome to Deepify Model generator

This command helps you generate the model.
`);

  inquirer.prompt([
    {
      type: 'list',
      name: 'msIdentifier',
      message: 'Select the microservice: ',
      choices: property.microservices.map(m => m.identifier),
    },
    {
      type: 'input',
      name: 'name',
      message: 'Enter the model name: ',
      validate: alphanumericalNotEmpty,
      default: name
    }
  ]).then((schema) => {
    schema.microservice = property.microservice(schema.msIdentifier);
    schema.fields = [];

    let prompModelField = () => {
      inquirer.prompt([{
        type: 'input',
        name: 'name',
        message: 'Enter field name: ',
        validate: alphanumericalNotEmpty
      }, {
        type: 'list',
        name: 'type',
        message: 'Select field type: ',
        choices: ModelGenerator.TYPES
      }, {
        type: 'confirm',
        name: 'continue',
        message: 'Do you want to add another field?'
      }]).then((result) => {
        schema.fields.push({
          name: result.name,
          type: result.type
        });

        result.continue ?
          prompModelField() :
          generateModel(schema);
      })
    };

    console.log('\nYou have to add at least 1 field to your model\n');

    prompModelField();
  });
  
  let generateModel = (modelSchema) => {
    let modelGenerator = new ModelGenerator();

    modelGenerator.generate(mainPath, modelSchema, (error, path) => {
      if (error) {
        console.error(`An error has occurred while generating the microapp: ${error}`);
        this.exit(1);
      }

      if (path) {
        console.log(`'${modelSchema.name}' model has been successfully generated is ${path} .`);
      }
    });
  };

  function alphanumericalNotEmpty(value) {
    if (!/^[a-zA-Z0-9_\-]{2,}$/.test(value)) {
      return 'Stirng should contain only [a-zA-Z0-9_-]';
    }

    return true;
  }
};
