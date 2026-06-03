module.exports = {
  '*.{ts,js,json,md,yml,yaml}': ['prettier --write'],
  '*.ts': ['eslint --fix'],
  '*': ['cspell --no-progress --no-must-find-files'],
};
