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

  console.log(`
Welcome to Deepify Model generator

This command helps you generate the model.
`);

  mainPath = this.normalizeInputPath(mainPath);
  let property = new Property(mainPath);

  inquirer.prompt([
    {
      type: 'list',
      name: 'msIdentifier',
      message: 'Select the microservice: ',
      choices: property.microservices.map(m => m.identifier),
    },
    {
      type: 'input',
      name: 'modelName',
      message: 'Enter the model name: ',
      validate: alphanumerical
    }
  ]).then((schema) => {
    schema.microservice = property.microservice(schema.msIdentifier);
    schema.fields = [];

    let prompModelField = () => {
      inquirer.prompt([{
        type: 'input',
        name: 'name',
        message: 'Enter field name: ',
        validate: alphanumerical
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

    console.log('\nYou have to add at least 1 fields to your model\n');
    prompModelField();
  });
  
  let generateModel = (modelSchema) => {
    let modelGenerator = new ModelGenerator();

    console.log('starting');
    
    modelGenerator.generate(mainPath, modelSchema, (error) => {
      if (error) {
        console.error(`An error has occurred while generating the microapp: ${error}`);
        this.exit(1);
      }

      console.log(`'${schema.name}' model has been successfully generated.`)
    });
  };
  

  function alphanumerical(value) {
    if (!/^[a-zA-Z0-9_\-]{2,}$/.test(value)) {
      return '[a-zA-Z0-9_-] are allowed only ';
    }

    return true;
  };
};