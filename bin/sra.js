const { exec, execSync } = require('child_process');
const { promisify } = require('util');
const chalk = require('chalk');
const commander = require('commander');
const fs = require('fs-extra');
const Ora = require('ora');
const path = require('path');
const validateProjectName = require('validate-npm-package-name');

const execAsync = promisify(exec);
const packageJson = require('../package.json');

const currentNodeVersion = process.versions.node;
const semver = currentNodeVersion.split('.');
const major = semver[0];
const { log, error } = console;

let projectName;
/**
 * Constants to replace in package.json
 */
const scripts = {
  start: 'cross-env NODE_ENV=development webpack-dev-server -d',
  build: 'cross-env NODE_ENV=production webpack -p',
  test: 'jest',
};

const jest = {
  moduleFileExtensions: [
    'js',
    'jsx',
  ],
  moduleDirectories: [
    'node_modules',
  ],
  setupFiles: [
    '<rootDir>/src/__tests__/setup.js',
  ],
  moduleNameMapper: {
    '\\\\.(css|styl|less|sass|scss)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\\\.js$': 'babel-jest',
    '^.+\\\\.jsx$': 'babel-jest',
    '\\\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/tests/__mock__/fileTransformer.js',
  },
};

/**
 * Node version validation
 */
if (major < 10) {
  error(
    `You are running Node ${
      currentNodeVersion
    }.\n`
      + 'Self React App requires Node 10 or higher. \n'
      + 'Please update your version of Node.',
  );
  process.exit(1);
}

/**
 * Initialization of CLI interpretation with commander
 */
const program = new commander.Command(packageJson.name)
  .version(packageJson.version)
  .arguments('<project directory>')
  .usage(`${chalk.green('<project-directory>')} [options]`)
  .action((name) => {
    projectName = name;
  })
  .allowUnknownOption()
  .on('--help', () => {
    log(`    Only ${chalk.green('<project-directory>')} is required.`);
    log();
  })
  .parse(process.argv);

/**
 * Prints any error thrown by validate-npm-package-name
 * https://github.com/npm/validate-npm-package-name
 */
function printValidationResults(results) {
  if (typeof results !== 'undefined') {
    results.forEach((err) => {
      error(chalk.red(`  *  ${err}`));
    });
  }
}

/**
 * This method simply checks if the appName is a valid one,
 * or even if it's empty!
 * No shirt, no shoes, no name, no service!
 *
 * @param {String} appName
 */
const checkAppName = (appName) => {
  if (typeof appName === 'undefined') {
    error('Please specify the project directory:');
    log(
      `  ${chalk.cyan(program.name())} ${chalk.green('<project-directory>')}`,
    );
    log();
    log('For example:');
    log(`  ${chalk.cyan(program.name())} ${chalk.green('my-react-app')}`);
    log();
    log(
      `Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`,
    );
    process.exit(1);
  }

  const validationResult = validateProjectName(appName);
  if (!validationResult.validForNewPackages) {
    error(
      `Could not create a project called ${chalk.red(
        `"${appName}"`,
      )} because of npm naming restrictions:`,
    );
    printValidationResults(validationResult.errors);
    printValidationResults(validationResult.warnings);
    process.exit(1);
  }

  const dependencies = ['react', 'react-dom', 'react-scripts'].sort();
  if (dependencies.indexOf(appName) >= 0) {
    error(
      chalk.red(
        `We cannot create a project called ${chalk.green(
          appName,
        )} because a dependency with the same name exists.\n`
          + 'Due to the way npm works, the following names are not allowed:\n\n',
      )
        + chalk.cyan(dependencies.map(depName => `  ${depName}`).join('\n'))
        + chalk.red('\n\nPlease choose a different project name.'),
    );
    process.exit(1);
  }
};

/**
 * Simply enters directory and executes npm init
 * @param {String} appName
 * @param {Object} spinner
 */
const createValidPackageJson = async (appName, spinner) => {
  await execAsync(`cd ${appName} && npm init -y`);
  spinner.succeed('npm init ran successfully');
};

const addPackagesAndConfigToPackageJson = async (root, spinner) => {
  const packageLocation = `${root}/package.json`;
  const packageJSON = await fs.readJSON(packageLocation);
  const newPackageJSON = { ...packageJSON, scripts, jest };
  await fs.writeJSON(packageLocation, newPackageJSON, { spaces: 2 });
  spinner.succeed('npm package initialized');
  return Promise.resolve();
};

/**
 * This function calls the functions to create the app scaffold
 * @param {String} root - Project root path
 * @param {String} appName - Project name
 * @param {String} originalDirectory - Directory where this script was executed
 */
const executeCreation = async (root, appName, originalDirectory) => {
  const spinner = new Ora({
    text: 'Initializing project with npm init',
    spinner: 'boxBounce2',
  });
  try {
    spinner.start();
    await createValidPackageJson(appName, spinner);
    await addPackagesAndConfigToPackageJson(root, spinner);
  } catch (err) {
    spinner.fail(`Welp something broke 😓 ${err}`);
    execSync(`rm -rf ${appName}`);
    process.exit(1);
  }
};

/**
 * Initializes creation of application structure
 *
 * @param {String} name
 */
const createApp = (name) => {
  // Project root directory
  const root = path.resolve(name);
  const originalDirectory = process.cwd();

  checkAppName(name);
  fs.ensureDirSync(name);

  log(`Creating a new React app in ${chalk.green(root)}.`);
  log();
  executeCreation(root, name, originalDirectory);
};


createApp(projectName);
