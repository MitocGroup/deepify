/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

var path = require('path');
var jsonFile = require('jsonfile');

var packageConfig = jsonFile.readFileSync(path.join(__dirname, '../package.json'));

module.exports = {
  version: packageConfig.version,
  description: 'DEEP CLI',
  commandsPath: './commands',
  commands: {
    'helloworld': {
      example: 'deepify helloworld path/to/web_app',
      description: 'Dump the "Hello World" sample web app',
      section: 'Prepare your local environment',
      opts: {
      },
      args: {
        path: {
          description: 'The path to dump the sample web app into',
          required: false,
        },
      },
    },
    'install': {
      example: 'deepify install github://MitocGroup/deep-microservices-todo-app',
      description: 'Install any DEEP microservice or microapplication from DEEP registry or GitHub repository',
      section: 'Prepare your local environment',
      opts: {
        init: {
          alias: 'i',
          description: 'Initialize deep web app',
          required: false,
        },
        registry: {
          alias: 'r',
          description: 'Custom registry url (ex. https://deep.mg)',
          required: false,
        },
        'github-auth': {
          alias: 'a',
          description: 'GitHub credentials pair used for Basic authentication (ex. "user:token" or simply "token")',
          required: false,
        }
      },
      args: {
        dependency: {
          description: 'The dependency you want to fetch (ex. "deep.ng.todo@^0.0.x")',
          required: false,
        },
        dumpPath: {
          description: 'The path to dump dependency into (works with GitHub only!)',
          required: false,
        },
      },
    },
    'server': {
      example: 'deepify server path/to/web_app -o',
      description: 'Run local development server',
      section: 'Develop on your local environment',
      opts: {
        'skip-frontend-build': {
          alias: 'f',
          description: 'Skip picking up _build path from the microservices Frontend',
          required: false,
        },
        'skip-backend-build': {
          alias: 's',
          description: 'Skip building backend (dependencies installation in Lambdas and linking aws-sdk)',
          required: false,
        },
        port: {
          alias: 'p',
          description: 'Port to listen to',
          required: false,
        },
        'db-server': {
          alias: 'l',
          description: 'Local DynamoDB server implementation (ex. LocalDynamo, Dynalite)',
          required: false,
        },
        'open-browser': {
          alias: 'o',
          description: 'Open browser after the server starts',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the Lambda (directory of handler itself)',
          required: false,
        },
      },
    },
    'deploy': {
      example: 'deepify deploy path/to/web_app',
      description: 'Deploy microserice(s) or microapplication(s) as custom web app(s)',
      section: 'Run in the cloud',
      opts: {
        prod: {
          description: 'Prepare web app for production and ensure prod env is used',
          required: false,
        },
        env: {
          alias: 'e',
          description: 'Web app environment to be used (default fetched from deploy config)',
          required: false,
        },
        'cfg-bucket': {
          alias: 'b',
          description: 'AWS S3 system bucket name where the deploy config was persisted (ex. deep.prod.system.db0c09cc)',
          required: false,
        },
        'dry-run': {
          alias: 'd',
          description: 'Work locally, without provisioning or publishing the code and data',
          required: false,
        },
        'dump-local': {
          alias: 'l',
          description: 'Dump built web app locally into the specified directory',
          required: false,
        },
        partial: {
          alias: 'm',
          description: 'Partial deploy (one or several comma separated microservices identifiers)',
          required: false,
        },
        'invalidate-cache': {
          description: 'Invalidate deep dependencies cache',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the web app',
          required: false,
        },
      },
    },
    'undeploy': {
      example: 'deepify undeploy path/to/web_app',
      description: 'Remove custom web app (provisioned resources, code and data)',
      section: 'Run in the cloud',
      opts: {
        'cfg-bucket': {
          alias: 'b',
          description: 'AWS S3 system bucket name where the deploy config was persisted (ex. deep.prod.system.db0c09cc)',
          required: false,
        },
        'resource': {
          alias: 'r',
          description: 'An generated AWS resource name from given deploy (ex. deep.prod.system.db0c09cc)',
          required: false,
        },
        dirty: {
          alias: 'd',
          description: 'Force cleaning up all resources if .cfg.deeploy.json file missing',
          required: false,
        },
        prod: {
          alias: 'p',
          description: 'Do not ask for production environment undeploy confirmation',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the web app',
          required: false,
        },
      },
    },
    'registry': {
      description: 'Manage registry configuration and publish microservice(s) or microapplication(s) to DEEP registry',
      commandsPath: './commands/registry',
      section: 'Prepare your local environment',
      commands: {
        'publish': {
          example: 'deepify registry publish ./sample-microservice',
          description: 'Publish microservice (may require manual approval before getting public)',
          opts: {
            registry: {
              alias: 'r',
              description: 'Custom registry url (ex. https://deep.mg)',
              required: false,
            },
          },
          args: {
            path: {
              description: 'The path to the microservice you want to publish',
              required: false,
            },
          },
        },
        'config': {
          example: 'deepify registry config token --set "some_custom_auth_token"',
          description: 'Read/Set the registry configuration value (read unless called with --set)',
          opts: {
            set: {
              alias: 's',
              description: 'Set the registry parameter to the value given',
              required: false,
            },
            print: {
              alias: 'p',
              description: 'Print available registry parameters',
              required: false,
            },
          },
          args: {
            parameter: {
              description: 'Registry configuration parameter name',
              required: false,
            },
          },
        },
      },
    },
    'compile': {
      description: 'Compile code for local or cloud execution',
      commandsPath: './commands/compile',
      section: 'Develop on your local environment',
      commands: {
        'frontend': {
          example: 'deepify compile frontend path/to/web_app',
          description: 'Build frontend of a web app',
          opts: {
            'output-path': {
              alias: 'o',
              description: 'Path to output built frontend of the web app (default _www)',
              required: false,
            },
          },
          args: {
            path: {
              description: 'The path to the web app',
              required: false,
            },
          },
        },
        'es6': {
          example: 'deepify compile es6 path/to/lambda',
          description: 'Compile ES6 scripts to ES5 using babel (matched by *.es6)',
          opts: {
            'extension': {
              alias: 'x',
              description: 'Extensions to compile',
              required: false,
            },
            'out-dir': {
              alias: 'd',
              description: 'Compile an input directory of modules into an output directory',
              required: false,
            },
            'es5': {
              description: 'Compile using es5 preset, instead of the node4 compatible',
              required: false,
            },
            'source': {
              description: 'Compile from source instead of directory',
              required: false,
            },
          },
          args: {
            path: {
              description: 'The path to the lambda root',
              required: false,
            },
          },
        },
        'prod': {
          example: 'deepify compile prod path/to/web_app',
          description: 'Compile lambdas for production',
          opts: {
            'remove-source': {
              alias: 's',
              description: 'Remove original Lambda source',
              required: false,
            },
            partial: {
              alias: 'm',
              description: 'Partial deploy (one or several comma separated microservices identifiers)',
              required: false,
            },
            'linear': {
              description: 'Compile lambdas linerar',
              required: false,
            },
            'skip-cache': {
              description: 'Skip loading lambda dependencies from cache',
              required: false,
            },
            'invalidate-cache': {
              description: 'Invalidate deep dependencies cache',
              required: false,
            },
          },
          args: {
            path: {
              description: 'The path to the web app',
              required: false,
            },
          },
        },
        'dev': {
          example: 'deepify compile dev path/to/web_app',
          description: 'Initialize backend',
          opts: {
            partial: {
              alias: 'm',
              description: 'Partial init (one or several comma separated microservices identifiers)',
              required: false,
            },
            update: {
              alias: 'u',
              description: 'Use \'npm update\' instead of \'npm install\' when compiling lambdas',
              required: false,
            },
            'skip-install': {
              alias: 's',
              description: 'Skip npm dependencies installation in Lambdas and linking aws-sdk',
              required: false,
            },
          },
          args: {
            path: {
              description: 'The path to the web app',
              required: false,
            },
          }
        },
      },
    },
    'build-frontend': {
      example: 'deepify build-frontend path/to/web_app',
      description: 'Build frontend of a web app',
      actionPath: './commands/compile/frontend',
      section: 'Deprecated',
      opts: {
        'output-path': {
          alias: 'o',
          description: 'Path to output built frontend of the web app (default _www)',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the web app',
          required: false,
        },
      },
    },
    'compile-es6': {
      example: 'deepify compile-es6 path/to/lambda',
      description: 'Compile ES6 scripts to ES5 using babel (matched by *.es6)',
      actionPath: './commands/compile/es6',
      section: 'Deprecated',
      opts: {
        'extension': {
          alias: 'x',
          description: 'Extensions to compile',
          required: false,
        },
        'out-dir': {
          alias: 'd',
          description: 'Compile an input directory of modules into an output directory',
          required: false,
        },
        'es5': {
          description: 'Compile using es5 preset, instead of the node4 compatible',
          required: false,
        },
        'source': {
          description: 'Compile from source instead of directory',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the lambda root',
          required: false,
        },
      },
    },
    'compile-prod': {
      example: 'deepify compile-prod path/to/web_app',
      description: 'Compile lambdas for production',
      actionPath: './commands/compile/prod',
      section: 'Deprecated',
      opts: {
        'remove-source': {
          alias: 's',
          description: 'Remove original Lambda source',
          required: false,
        },
        partial: {
          alias: 'm',
          description: 'Partial deploy (one or several comma separated microservices identifiers)',
          required: false,
        },
        'linear': {
          description: 'Compile lambdas linerar',
          required: false,
        },
        'skip-cache': {
          description: 'Skip loading lambda dependencies from cache',
          required: false,
        },
        'invalidate-cache': {
          description: 'Invalidate deep dependencies cache',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the web app',
          required: false,
        },
      },
    },
    'init-backend': {
      example: 'deepify init-backend path/to/web_app',
      description: 'Initialize backend',
      actionPath: './commands/compile/dev',
      section: 'Deprecated',
      opts: {
        partial: {
          alias: 'm',
          description: 'Partial init (one or several comma separated microservices identifiers)',
          required: false,
        },
        update: {
          alias: 'u',
          description: 'Use \'npm update\' instead of \'npm install\' when compiling lambdas',
          required: false,
        },
        'skip-install': {
          alias: 's',
          description: 'Skip npm dependencies installation in Lambdas and linking aws-sdk',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the web app',
          required: false,
        },
      },
    },
    'lambda': {
      example: 'deepify lambda path/to/the/lambda -e=\'{"Name":"John Doe"}\'',
      description: 'Run AWS Lambda function(s) locally',
      section: 'Develop on your local environment',
      opts: {
        event: {
          alias: 'e',
          description: 'JSON string used as the Lambda payload',
          required: false,
        },
        context: {
          alias: 'c',
          description: 'JSON string used as the Lambda context',
          required: false,
        },
        auth: {
          alias: 'a',
          description: 'Authorize the user in backend',
          required: false,
        },
        'skip-frontend-build': {
          alias: 'f',
          description: 'Skip picking up _build path from the microservices Frontend',
          required: false,
        },
        'db-server': {
          alias: 'l',
          description: 'Local DynamoDB server implementation (ex. LocalDynamo, Dynalite)',
          required: false,
        },
        'plain': {
          alias: 'p',
          description: 'Output JSON stringified result only',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the Lambda (directory of handler itself)',
          required: false,
        },
      },
    },
    'list': {
      example: 'deepify list /path/to/microapp',
      description: 'List cloud resources provisioned for your web app(s)',
      section: 'Run in the cloud',
      opts: {
        resource: {
          alias: 'r',
          description: 'An generated AWS resource name from given deploy (ex. deep.prod.system.db0c09cc)',
          required: false,
        },
        service: {
          alias: 's',
          description: 'Comma separated list of services for which to list resources',
          required: false,
        },
        format: {
          alias: 'f',
          description: 'Output format',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the web app',
          required: false,
        },
      },
    },
    'generate': {
      commandsPath: './commands/generate',
      description: 'Generate microapplication component(s)',
      section: 'Develop on your local environment',
      commands: {
        'microapp': {
          example: 'deepify generate microapp /target/path/',
          description: 'Generate microapp\'s skeleton',
          opts: {
            name: {
              alias: 'n',
              description: 'Microapp name to use',
              required: false,
            },
            engine: {
              alias: 'e',
              description: 'Frontend engine to use',
              required: false,
            },
          },
          args: {
            path: {
              description: 'The path where to generate the microapp',
              required: false,
            },
          },
        },
        'frontend': {
          example: 'deepify generate frontend path/to/app',
          description: 'Generate microapp\'s frontend tier',
          args: {
            path: {
              description: 'The path to the microservice',
              required: false,
            },
          },
        },
        'backend': {
          commandsPath: './commands/generate/backend',
          description: 'Generate microapp\'s backend tier',
          commands: {
            'action': {
              example: 'deepify generate action /path/to/microapp',
              description: 'Generate a microservice resource action',
              opts: {
                microapp: {
                  alias: 'm',
                  description: 'Microapplication identifier to use',
                  required: false,
                },
                resource: {
                  alias: 'r',
                  description: 'Resource name to use',
                  required: false,
                },
              },
              args: {
                path: {
                  description: 'The path to the application',
                  required: false,
                },
              },
            },
            'resource': {
              example: 'deepify generate resource path/to/app',
              description: 'Generate a microservice resource ',
              args: {
                path: {
                  description: 'The path to the app',
                  required: false,
                }
              },
              opts: {
                microapp: {
                  alias: 'm',
                  description: 'Microapplication identifier to use',
                  required: false,
                },
                resource: {
                  alias: 'r',
                  description: 'Resource name to use',
                  required: false,
                },
              },
            },
          },
        },
        'data': {
          commandsPath: './commands/generate/data',
          description: 'Generate microapp\'s data tier',
          commands: {
            'model': {
              example: 'deepify generate model /path/to/microapp',
              description: 'Generate a microservice model',
              opts: {
                name: {
                  alias: 'n',
                  description: 'Default model name to use',
                  required: false,
                },
                microapp: {
                  alias: 'm',
                  description: 'Microapplication identifier to use',
                  required: false,
                },
              },
              args: {
                path: {
                  description: 'The path to the application',
                  required: false,
                },
              },
            },
            'migration': {
              example: 'deepify generate migration path/to/app',
              description: 'Generate a microservice migration',
              opts: {
                microapp: {
                  alias: 'm',
                  description: 'Microapplication identifier to use',
                  required: false,
                },
              },
              args: {
                path: {
                  description: 'The path to the app',
                  required: false,
                },
              },
            },
          }
        },
        'test': {
          commandsPath: './commands/generate/test',
          description: 'Generate microapp\'s tests',
          commands: {
            'backend': {
              example: 'deepify generate test backend /path/to/microapp',
              description: 'Generate microservice backend test(s)',
              args: {
                path: {
                  description: 'The path to the microservice',
                  required: false,
                },
              },
            },
            'frontend': {
              example: 'deepify generate test frontend /path/to/microapp',
              description: 'Generate microservice frontend test(s)',
              args: {
                path: {
                  description: 'The path to the microservice',
                  required: false,
                },
              },
            },
          },
        },
      },
    },
    'ssl': {
      commandsPath: './commands/ssl',
      description: 'Enable or disable SSL certificate(s) on your custom web app(s)',
      section: 'Run in the cloud',
      commands: {
        'enable': {
          example: 'deepify ssl enable path/to/web_app',
          description: 'Enables SSL on a deployed web app',
          opts: {
            domain: {
              alias: 'd',
              description: 'The domain to create the certificate for (overrides the "deeploy.json" value)',
              required: false,
            },
          },
          args: {
            path: {
              description: 'The path to the web app',
              required: false,
            },
          },
        },
        'disable': {
          example: 'deepify ssl disable path/to/web_app',
          description: 'Disable activated SSL on a deployed web app',
          opts: {
          },
          args: {
            path: {
              description: 'The path to the web app',
              required: false,
            },
          },
        },
      },
    }
  },
};
