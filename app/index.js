'use strict';

var chalk  = require('chalk');
var merge  = require('lodash').merge;
var npm    = new require('npm-api')();
var path   = require('path');
var yeoman = require('yeoman-generator');

var SpireGenerator;
module.exports = SpireGenerator = yeoman.Base.extend({
  constructor: function() {
    yeoman.generators.Base.apply(this, arguments);
    this.option('force');
  },

  init: function() {
    this.prompts = [];
    this.configPath = this.destinationPath('config.json');
    try {
      this.config = require(this.configPath);
    } catch (error) {
      this.config = {};
    }
  },

  versionCheck: function () {
    if (this.options.force) { return; }

    var repo = npm.repo('generator-spire');
    repo.package('latest')
    .then((data) => {
      var latestVersion = data.version;
      var localVersion = require('../package.json').version
      if (localVersion < latestVersion) {
        this.log(chalk.red(
          `\nThe version of Spire you have installed (${localVersion}) is ` +
          `behind the latest version (${latestVersion}).\nPlease update ` +
          `your version of Spire!\n\nTo generate a project with your ` +
          `currently installed version, run\n    yo spire --force`
        ));
       this.env.error('Old version, exiting.');
      }
    })
  },

  askFor: function () {
    var self = this;
    this.log(chalk.magenta('You\'re using the fantastic Spire generator.'));

    return this.prompt([{
      name: 'generate',
      type: 'list',
      message: 'What kind of app would you like to generate?',
      choices: [
        'react',
        // 'static',
      ],
    }])
    .then((generateAnswers) => {
      if (generateAnswers.generate === 'react') {
        return this.prompt([{
          name: 'flux',
          type: 'list',
          message: 'Which Flux implementation would you like to generate?',
          choices: ['alt', 'redux'],
        }]).then((fluxAnswers) => {
          return Promise.resolve(merge(generateAnswers, fluxAnswers));
        });
      }
      return Promise.resolve(generateAnswers);
    })
    .then((previousAnswers) => {
      return this.prompt([{
        name: 'nwjs',
        type: 'confirm',
        message: 'Is this an nw.js project?',
        default: false
      }, {
        name: 'projectName',
        type: 'input',
        message: 'What is the name of your project? (no spaces, or symbols)',
        default: process.cwd().split(path.sep).pop()
      }, {
        name: 'projectDesc',
        type: 'input',
        message: 'Enter a brief project description'
      }, {
        name: 'deployGh',
        type: 'confirm',
        message: 'Will this application be deployed to gh-pages?',
        default: false
      }])
      .then(function(answers) {
        return Promise.resolve(merge(previousAnswers, answers));
      });
    })
    .then((answers) => {
      var answer, question;
      for (question in answers) {
        answer = answers[question];
        self.config[question] = answer;
      }
    });
  },

  projectfiles: function() {
    var createEslintrcFile = (framework) => {
      if (framework === 'redux') {
        var contents = merge(
          this.fs.readJSON(this.templatePath('_eslintrc')),
          this.fs.readJSON(this.templatePath('_react/_redux/_eslintrc'))
        );
        this.fs.writeJSON(this.destinationPath('.eslintrc'), contents);
      } else {
        this.fs.copyTpl(this.templatePath('_eslintrc'), this.destinationPath('.eslintrc'), this.config);
      }
    }

    this.config[this.config.generate] = true;

    this.config.angular = false;  // temporary for the removal of angular
    this.config.nodeVersion = '5.6';
    var reactPath = this.config.react ? path.join('_react', `_${this.config.flux}`) : '';

    createEslintrcFile(this.config.flux);
    this.config.babelRc = this.fs.read(this.templatePath(path.join(reactPath, 'babelrc')));
    this.fs.copy(this.templatePath(path.join(reactPath, 'babelrc')), this.destinationPath('.babelrc'));
    this.fs.copy(this.templatePath(path.join(reactPath, 'server.js')), this.destinationPath('server.js'));
    this.fs.copyTpl(this.templatePath('_bower.json'), this.destinationPath('bower.json'), this.config);
    this.fs.copyTpl(this.templatePath('_README.md'), this.destinationPath('README.md'), this.config);
    this.fs.copyTpl(this.templatePath('_sasslint.js'), this.destinationPath('.sasslint.js'), this.config);
    this.fs.copyTpl(this.templatePath('_webpack.config.js'), this.destinationPath('webpack.config.js'), this.config);
    this.fs.copyTpl(this.templatePath('_circle.yml'), this.destinationPath('circle.yml'), this.config);
    this.fs.copy(this.templatePath('nvmrc'), this.destinationPath('.nvmrc'));
    this.fs.copy(this.templatePath('gitignore'), this.destinationPath('.gitignore'));
    this.fs.copy(this.templatePath('Gulpfile.js'), this.destinationPath('Gulpfile.js'));
    this.fs.copy(this.templatePath('Procfile'), this.destinationPath('Procfile'));
    this.fs.copy(this.templatePath('mocks'), this.destinationPath('mocks'));
  },

  gulpfiles: function() {
    this.fs.copyTpl(this.templatePath('Gulpfile.js'), this.destinationPath('Gulpfile.js'), this.config);
    this.fs.copy(this.templatePath('gulp'), this.destinationPath('gulp'));
  },

  packageFiles: function () {
    var pkgDestPath = this.destinationPath('package.json');

    var processPackage = (file) => {
      var contents = this.fs.readJSON(this.templatePath(`${file}`));
      this.fs.extendJSON(pkgDestPath, contents);
    };

    processPackage('_package.json');

    // if (this.config.angular) {
    //   processPackage('package.angular.json');

    //   this.fs.copy(this.templatePath('_angular/src/app'), this.destinationPath('src/app'));
    //   this.fs.copyTpl(this.templatePath('_angular_src/_src_app_components_data_data.js'), this.destinationPath('src/app/components/data/data.js'), this.config);
    //   this.fs.copyTpl(this.templatePath('_angular_src/_src_app_components_navbar_navbar.js'), this.destinationPath('src/app/components/navbar/navbar.js'), this.config);
    //   this.fs.copyTpl(this.templatePath('_angular_src/_src_app_index.js'), this.destinationPath('src/app/index.js'), this.config);
    //   this.fs.copyTpl(this.templatePath('_angular_src/_src_app_main_main.js'), this.destinationPath('src/app/main/main.js'), this.config);
    //   this.fs.copyTpl(this.templatePath('_angular_src/_src_app_main_things_things.js'), this.destinationPath('src/app/main/things/things.js'), this.config);
    // }

    if (this.config.react) {
      var reactPath = path.join('_react', `_${this.config.flux}`);

      processPackage('_package.react.json');
      processPackage(path.join(reactPath, '_package.json'));
    }

    this.fs.copyTpl(pkgDestPath, pkgDestPath, this.config);
  },

  srcfiles: function() {
    this.fs.copyTpl(this.templatePath('_src_app_index.html'), this.destinationPath('src/app/index.html'), this.config);
    this.fs.copy(this.templatePath('src'), this.destinationPath('src'));
    this.fs.copy(this.templatePath(`_react/__tests__`), this.destinationPath('__tests__'));

    if (this.config.react) {
      var reactPath = path.join('_react', `_${this.config.flux}`);

      this.fs.copy(this.templatePath(path.join(reactPath, 'src/app')), this.destinationPath('src/app'));
      this.fs.copy(this.templatePath(path.join(reactPath, 'src/lib')), this.destinationPath('src/lib'));

      if (this.config.flux === 'redux') {
        this.fs.copy(this.templatePath(path.join(reactPath, 'src/config')), this.destinationPath('src/config'));
      }
    }

    if (this.config.deployGh) {
      processPackage('package.deploy-gh.json');

      this.fs.copyTpl(this.templatePath('_gulp_tasks_deploy-gh.js'), this.destinationPath('gulp/tasks/deploy-gh.js'));
    }
  },

  end: function() {
    this.log(chalk.green('\n# Awesome. Everything generated just fine!' +
                         '\n# Now open the README.md in this project folder, to get started.'));
  }

});
