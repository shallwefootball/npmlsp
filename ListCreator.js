const {resolve} = require('path');
const {EOL, homedir} = require('os');

const {Observable} = require('rxjs');
const {exec} = require('child_process');
const {readJson, writeJson, ensureDir, pathExists} = require('fs-extra');
const map = require('lodash/map');
const difference = require('lodash/difference');
const intersection = require('lodash/intersection');
const ora = require('ora');
const meow = require('meow');
const updateNotifier = require('update-notifier');
const chalk = require('chalk');

const exec$ = Observable.bindNodeCallback(exec);
const readJson$ = Observable.bindNodeCallback(readJson);
const writeJson$ = Observable.bindNodeCallback(writeJson);
const ensureDir$ = Observable.bindNodeCallback(ensureDir);
const pathExists$ = Observable.bindNodeCallback(pathExists);

updateNotifier({pkg: require('./package.json')}).notify();
const HOME = homedir();
const PATH_CONFIG = resolve(HOME, '.config/npmlsp');
const PATH_SKIP = resolve(PATH_CONFIG, 'skip.json');

const exists$ = Observable
  .concat(ensureDir$(PATH_CONFIG), pathExists$(PATH_SKIP))
  .last();
const writeConfig$ = Observable
  .concat(writeJson$(PATH_SKIP, []), Observable.of([]))
  .last();
const readConfig$ = readJson$(PATH_SKIP);
const helpText = `
  Usage
    $ npmlsp
`;

class ListCreator {
  constructor() {
    this.spinner = ora();
    this.cli = meow(helpText);
    this.packs$ = readJson$(resolve(process.cwd(), 'package.json'));
    this.skips$ = exists$.mergeMap(exists => {
      return exists ? readConfig$ : writeConfig$;
    });
    this.packs = 0;
    this.skipped = 0;
    this.filteredPacks = 0;
  }

  filterPackages() {
    this.spinner.start('Reading \'package.json\'...');
    this.$ = Observable.zip(
      this.packs$, this.skips$,
      ({dependencies = {}, devDependencies = {}}, skips) => {
        const deps = Object.assign(dependencies, devDependencies);
        for (const key in deps) {
          /@/.test(key) && delete deps[key];
        };
        const packs = map(deps, (val, key) => key);
        const filteredPacks = difference(packs, skips);
        this.packs = packs.length;
        this.filteredPacks = filteredPacks.length;
        this.skipped = intersection(packs, skips).length;
        return filteredPacks;
      })
      .mergeMap(pack => pack);
    return this;
  }

  runNpm() {
    this.spinner.text = 'Requesting dependency information...';
    this.$ = this.$.mergeMap(packageName => {
      return exec$(`npm view ${packageName} name description homepage --json`)
        .map(std => {
          const stdout = std[0];
          return JSON.parse(stdout);
        });
    });
    return this;
  }

  out() {
    this.$ = this.$
      .map(({name, description, homepage}) => {
        return [
          `[ ${name} ]`,
          ` ${chalk.gray(description)}`,
          ` ${homepage || 'None homepage'}`
        ].join(EOL) + EOL;
      });
    return this;
  }

  subscribe(next, errHandler, done) {
    this.$ = this.$.subscribe(text => {
      this.spinner.stopAndPersist({text});
      next();
    }, err => {
      this.spinner.fail(err.stack);
      errHandler(err);
    }, () => {
      const {spinner, filteredPacks, skipped, packs} = this;
      spinner.succeed(
        chalk.yellow(`skipped ${skipped} `) +
        chalk.green(`filtered ${filteredPacks} `) +
        `total ${packs}`
      );
      done();
    });
    return this;
  }
}

exports.ListCreator = ListCreator;
