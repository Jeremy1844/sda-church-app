const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const distPath = path.join(repoRoot, 'dist');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function run(command, args) {
  const result = childProcess.spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with status ${result.status}`);
  }
}

function deploy({ buildOnly = false } = {}) {
  run(npmCommand, ['run', 'version:check']);
  fs.rmSync(distPath, { recursive: true, force: true });
  run(npxCommand, ['expo', 'export', '--platform', 'web', '--clear']);

  if (!buildOnly) run(npxCommand, ['gh-pages', '-d', 'dist', '--dotfiles']);
}

if (require.main === module) {
  try {
    deploy({ buildOnly: process.argv.includes('--build-only') });
    console.log(
      process.argv.includes('--build-only')
        ? 'Production web build completed successfully.'
        : 'Deployment completed successfully.',
    );
  } catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
  }
}

module.exports = { deploy };
