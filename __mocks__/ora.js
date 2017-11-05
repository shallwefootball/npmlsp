class Ora {
  start() {}
  succeed() {}
  stopAndPersist({text}) {
    return text;
  }
  fail() {}
}

module.exports = () => {
  return new Ora();
};
module.exports.Ora = Ora;