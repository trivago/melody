## Melody Manual Release

This guide can be used when melody automated release pipeline fails.

### Melody Stable

-   Make sure you have updated the new release version in [CHANGELOG](./CHANGELOG.md).
-   Commit your changes. There should be no uncommitted changes in the repository.
-   Bump the current melody version. eg. You can use the following
    command to bump current melody version to 1.8.0

```shell script
   yarn lerna version 1.8.0 --no-push --yes --force-publish="*"
```

-   Make sure you have _publish_ rights to npm.
-   Publish newly created version to npmjs

```shell script
     yarn lerna publish from-git --force-publish="*" --registry https://registry.npmjs.org
```

-   Pushing newly created git tag to github.

```shell script
git push origin v1.8.0
```

-   Create a new [github release](https://github.com/trivago/melody/releases/new) on github and update it from the changelog.

### Melody Canary

Previously, we were publishing melody canary versions on every commit. We had removed this in
our migration to github actions. If you may want to publish a canary tag. You can use the following command.

```shell script
yarn lerna publish --no-git-tag-version --no-push --no-git-reset --exact --force-publish="*" --canary --yes --dist-tag $(git rev-parse --abbrev-ref HEAD) --preid $(git rev-parse --short HEAD) --registry https://registry.npmjs.org
```

The above command will publish a canary tag to npmjs as a canary release with current version and commit id. You can find your
branch name as dist-tag on npmjs.
