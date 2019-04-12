CI & CD in Melody
====

[Melody](https://github.com/trivago/melody) uses github [actions](https://developer.github.com/actions/) for continuous integration
and continuous delivery.

### Table of Contents
- [Introduction](#toc-intro)
- [Workflows](#toc-workflow)
   * [Pull request](#toc-pr)
   * [Pull request closed](#toc-pr-closed)
   * [Master branch only](#toc-master-branch-only)
   * [Non-Master branch](#toc-non-master-branch)
   * [Release](#toc-release)
   * [Node 6](#toc-node-versions)
   * [Node 10](#toc-node-versions)
   * [Node 11](#toc-node-versions)
- [Actions](#toc-actions)
   * [CLI](#toc-cli)
   * [Verdaccio action as E2E toolkit](#toc-verdaccio-e2e)
- [References](#toc-references)
   * [Github action documentation](#toc-github-action)


## <a id="toc-intro"></a>Introduction
---
GitHub Actions allows to implement custom logic without having to create an app to perform the task and can remove the requirements of external CI platforms.

## <a id="toc-workflow"></a>Workflows
---
Workflows are a composite of many different GitHub Actions, or tasks. The following sections explain
some of the workflows we use in Melody.

Workflows are located in `main.workflow` under `.github` directory on root level of this repository.

#### <a id="toc-pr"></a>Pull request
This workflow only triggered by the pull request, using following events:

- opened
- reopened
- synchronies

Also, On every event, we runs the **build**, **lint**, **unit tests**, **e2e** and publish the **canary dist-tag** on npm registry. This tag can be used for testing purposes. 

#### <a id="toc-pr-closed"></a>Pull request closed
This workflow removes the **Canary dist-tag** which we publish in the [Pull request](#toc-pr) workflow. As the pull request can be merged or closed, the dist-tag will no longer in use. The successful merge in any other branch will publish the **prerelease dist-tag** or **canary dist-tag**.

#### <a id="toc-master-branch-only"></a>Master branch only
This workflow performs all the tasks mentioned in (Pull request workflow)[#toc-pr], but in the end it publishes **prerelease dist-tag** to npm registry.

#### <a id="toc-non-master-branch"></a>Non-Master branch
This workflow performs runs basic tasks like build, lint and test. It does not publish any tag to npm registry. 

Note: This workflow also runs whenever any new git tag is pushed.

#### <a id="toc-release"></a>Release
This workflow is used for release and **publishes latest dist-tag** on npm registry. It runs when any new release is created on github website. 

#### To make a release:
- Make sure you are on master and have `push` access.
- Make a commit in `vX.X.X' format. eg. ```git commit -m "v2.1.0"```

[Read more about creating release on github.](https://help.github.com/en/articles/creating-releases)

Note: ___This workflow only initiated by authorized persons.___

#### <a id="toc-node-versions"></a>Node 6, 10 & 11
These workflows check the compatibility by running unit tests in different node environments.

## <a id="toc-actions"></a>Actions
---

Actions are located in [actions](/actions) directory in the project root level.

#### <a id="toc-cli"></a>CLI
CLI action exposes the debian environment with node:latest version. Find more [here](cli/README.md)

#### <a id="toc-verdaccio-e2e"></a>Verdaccio action as E2E toolkit
[Verdaccio](https://verdaccio.org) is a lightweight private npm proxy registry built in Node.js and use as E2E toolkit. We push every package to verdaccio before pushing it to npm registry.

Find more about [Verdaccio](https://verdaccio.org) and [Verdaccio action](verdaccio/README.md).

## <a id="toc-references"></a>References
---  

#### <a id="toc-github-action"></a>Github actions
Find out more in the [official documentation](https://developer.github.com/actions/) of github actions.