#!/usr/bin/env node

/**
 * Removes the dist-tags from the registry.
 * eg. npm dist-tag rm <package-name> <tag-name> 
 */
const fs = require('fs');

const [
    /*node*/,
    /*file*/,
    directory,
    distTag,
    registry
] = process.argv;

console.log(process.argv);

fs.readdir(directory, function(err, items) {
    if (err) {
        process.exit(1);
        console.error('Error: unable to read package directory');
    }

    items.forEach(function(packageName) {
        const { exec } = require('child_process');
        exec(
            `npm dist-tag rm ${packageName} ${distTag} --registry ${registry}`,
            (error, stdout, stderr) => {
                if (error) {
                    console.error(`${packageName}: dist tag ${distTag} not present`);
                }
                if (stderr) {
                    console.error(`stderr: ${stderr}`);
                }
                console.log(stdout);
            }
        );
    });
});
