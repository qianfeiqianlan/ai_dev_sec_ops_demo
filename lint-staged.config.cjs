module.exports = {
  '*.{ts,js,json,md,yml,yaml}': ['prettier --write'],
  '*.ts': () => 'pnpm run lint:fix',
  '*': ['cspell --no-progress --no-must-find-files'],
};
