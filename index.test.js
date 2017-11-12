const {Observable} = require('rxjs');
const {ListCreator} = require('./ListCreator');
const {Ora} = require('ora');

jest.mock('child_process');

describe('ListCreator constructor', () => {
  it('init spinner(ora)', () => {
    const lister = new ListCreator();
    expect(lister.spinner).toBeInstanceOf(Ora)
  });
});

describe('ListCreator', () => {
  let lister;
  const NPMLSP = 'npmlsp';
  beforeEach(() => {
    lister = new ListCreator();
  });
  it('filterPackages', done => {
    lister.packs$ = Observable.of({
      dependencies: {
        '@types/rx': '4.2.3',
        [NPMLSP]: '0.1.2'
      }
    });
    lister.filterPackages().$.subscribe(name => {
      expect(name).toBe(NPMLSP);
    }, null, done);
  });
  it('runNpm', done => {
    lister.$ = Observable.of(NPMLSP);
    lister.runNpm().$.subscribe(res => {
      expect(res.name).toBe(NPMLSP);
    }, null, done);
  });
  it('out', done => {
    const response = {
      name: 'npmlsp',
      description: 'The command line interface for listing dependencies information from package.json',
      homepage: 'https://github.com/shallwefootball/npmlsp'
    };
    lister.$ = Observable.of(response);
    lister.out().$.subscribe(output => {
      expect(output).toMatchSnapshot();
    }, null, done)
  });
  it('subscribe', done => {
    const good = 'good!';
    lister.spinner.stopAndPersist = jest.fn();
    lister.$ = Observable.of(good);
    lister.subscribe(() => {
      expect(lister.spinner.stopAndPersist).toBeCalledWith({text: good});
    }, null, done);
  });
  it('subscribe error', done => {
    const bad = 'bad..';
    const error = new Error(bad);
    lister.spinner.fail = jest.fn();
    lister.$ = Observable.throw(error);
    lister.subscribe(null, err => {
      expect(lister.spinner.fail).toBeCalledWith(error.stack);
      expect(err.message).toBe(bad);
      done();
    });
  })
});