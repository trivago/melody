#!/usr/bin/env node
const { readJson, writeJson } = require('fs-extra');
const semver = require('semver');
const inquirer = require('inquirer');
const { join, resolve, dirname, basename } = require('path');
const globfs = require('glob-fs')();
const chalk = require('chalk');

const CWD = process.cwd();
const PACKAGE_JSON = 'package.json';
const LERNA_CONFIG_PATH = join(CWD, 'lerna.json');
const JSON_SPACING = 2;
const UPDATE_LEVEL = 'major';

// Updates peer dependencies to the next major version for melody packages. (e.g. ^1.0.0  => ^2.0.0)
// It runs over the "package.json" files that matches the glob provided with the "lerna.json".
// For every package of ours, it will update the peerDependencies. It will only update melody packages in other melody packages.
const updatePeers = async () => {
    const lernaJson = await readJson(LERNA_CONFIG_PATH);

    const repoVersion = lernaJson.version;
    const newVersion = `^${semver.inc(repoVersion, UPDATE_LEVEL)}`;
    const { pkgJsonPaths, pkgNames } = getPkgFullPaths(lernaJson);

    const message = `This will update your melody peer dependencies to ${newVersion} . Is this OK ?\n\n${pkgNames.join(
        '\n'
    )}`;

    inquirer
        .prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message,
                default: false,
            },
        ])
        .then(({ confirm }) => {
            if (confirm) {
                console.log(chalk.blue('Updating packages: '));
                pkgJsonPaths.forEach(path =>
                    updatePeerDependencies(path, pkgNames, newVersion)
                );
            } else {
                console.log(chalk.red('Update cancelled.'));
            }
        });
};

updatePeers();

// Read "packages" from lerna.json and return full paths of "package.json" files.
function getPkgFullPaths(lernaJson) {
    const globDirs = lernaJson.packages.map(globPattern =>
        globfs.readdirSync(globPattern)
    );
    const pkgJsonPaths = []
        .concat(...globDirs)
        .map(relative => resolve(CWD, relative))
        .map(dirPath => join(dirPath, PACKAGE_JSON));

    return {
        pkgNames: pkgJsonPaths.map(path => basename(dirname(path))),
        pkgJsonPaths,
    };
}

// Update pkgJson for a single package
async function updatePeerDependencies(jsonPath, pkgNames, newVersion) {
    const pkgJson = await readJson(jsonPath);
    const peerDeps = pkgJson.peerDependencies;
    const newPeerDeps = { ...pkgJson.peerDependencies };
    let isUpdated = false;

    if (!peerDeps || !Object.keys(peerDeps).length) {
        console.log(
            pkgJson.name,
            chalk.keyword('orange')('~ No peer dependencies. Skipping.')
        );
        return;
    }

    Object.keys(pkgJson.peerDependencies).forEach(dep => {
        if (pkgNames.indexOf(dep) > -1) {
            newPeerDeps[dep] = newVersion;
            isUpdated = true;
        }
    });

    pkgJson.peerDependencies = newPeerDeps;

    try {
        await writeJson(jsonPath, pkgJson, { spaces: JSON_SPACING });

        console.log(
            pkgJson.name,
            isUpdated
                ? chalk.green('✓ Updated peer dependencies')
                : chalk.keyword('orange')('- No update found.')
        );
    } catch (err) {
        console.error(err);
    }
}
