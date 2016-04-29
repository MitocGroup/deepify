/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/29/16.
 */

'use strict';

module.exports = function(mainPath) {
  let path = require('path');
  let inquirer = require('inquirer');
  let FS = require('fs');
  let MicroserviceGenerator = require('../../lib.compiled/Generator/MicroserviceGenerator').MicroserviceGenerator;
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
      choices: MicroserviceGenerator.ALLOWED_ENGINES,
      validate: (name) => {
        if (!/^[a-zA-Z0-9_\-]{3,}$/.test(name)) {
          return 'Moodel name should contain only [a-zA-Z0-9_-]';
        }

        return true;
      }
    }
  ]).then((schema) => {
    console.log(schema);
  })
};