module.exports.exec = (commmand, cb) => {
  const res = '{"name": "npmlsp", "description": "The command line interface for listing dependencies information from \'package.json\'", "homepage": "https://github.com/shallwefootball/npmlsp"}'
  return cb(null, res, null);
};