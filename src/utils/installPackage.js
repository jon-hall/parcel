const dbg = require('debug')('parcel:installPackage');
const spawn = require('cross-spawn');
const config = require('./config');
const path = require('path');
const promisify = require('./promisify');
const resolve = promisify(require('resolve'));

async function install(dir, modules, installPeers = true) {
  let location = await config.resolve(dir, ['yarn.lock', 'package.json']);

  return new Promise((resolve, reject) => {
    let install;
    let options = {
      cwd: location ? path.dirname(location) : dir
    };

    if (location && path.basename(location) === 'yarn.lock') {
      dbg('yarn', ['add', ...modules, '--dev'], options);
      install = spawn('yarn', ['add', ...modules, '--dev'], options);
    } else {
      dbg('npm', ['install', ...modules, '--save-dev'], options);
      install = spawn('npm', ['install', ...modules, '--save-dev'], options);
    }

    install.stdout.pipe(process.stdout);
    install.stderr.pipe(process.stderr);

    install.on('close', async code => {
      if (code !== 0) {
        return reject(new Error(`Failed to install ${modules.join(', ')}.`));
      }

      if (!installPeers) {
        return resolve();
      }

      try {
        await Promise.all(modules.map(m => installPeerDependencies(dir, m)));
      } catch (err) {
        return reject(
          new Error(
            `Failed to install peerDependencies for ${modules.join(', ')}.`
          )
        );
      }

      resolve();
    });
  });
}

async function installPeerDependencies(dir, name) {
  let basedir = path.dirname(dir);

  const [resolved] = await resolve(name, {basedir});
  const pkg = await config.load(resolved, ['package.json']);
  const peers = pkg.peerDependencies || {};

  const modules = [];
  for (const peer in peers) {
    modules.push(`${peer}@${peers[peer]}`);
  }

  if (modules.length) {
    await install(dir, modules, false);
  }
}

module.exports = install;

module.exports.sync = function(dir, name) {
  let location = config.resolveSync(dir, ['yarn.lock', 'package.json']);

  let install;
  let options = {
    cwd: location ? path.dirname(location) : dir,
    stdio: 'inherit'
  };

  if (location && path.basename(location) === 'yarn.lock') {
    dbg('yarn', ['add', name, '--dev'], options);
    install = spawn.sync('yarn', ['add', name, '--dev'], options);
  } else {
    dbg('npm', ['install', name, '--save-dev'], options);
    install = spawn.sync('npm', ['install', name, '--save-dev'], options);
  }
  return install;
};
