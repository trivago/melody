# Contributing to melody

Thank you for contributing to `melody`!

This project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md) By participating you agree to comply with its terms.

#### Table Of Contents

[How Can I Contribute?](#how-can-i-contribute)

-   [Improve Documentation](#improve-documentation)
-   [Reporting Bugs](#reporting-bugs)
-   [Writing Code](#writing-code)
-   [Pull Requests](#pull-requests)
-   [### Publishing your branch as a package](#publishing-branch-as-package)

## How can I contribute?

### Improve documentation

Most simple way to contribute is improving our documentation. Fixing typos, fixing errors, explaining something better,
more examples etc. If your work would be a big change, open an issue first. For smaller changes feel free to open a PR
directly.

Use common sense to decide if you need an issue or not. Generally if you change more than a few paragraphs, multiple
files etc, it is better to open an issue and explain your change.

### Reporting Bugs

If you encounter any issues with `melody` don't hesitate to report it. While reporting your bug make sure you
follow the guidelines below. It helps maintainers to understand and reproduce the problem.

-   **Use a clear and descriptive title** for the issue to identify the problem.
-   **Provide configuration you used** which is critical for reproducing problem in most cases.
-   **Provide system details you used** to identify if the problem is system specific. I.e: operating system, node version, webpack version you used etc.
-   **Describe the exact steps which reproduce the problem** in as many details as possible.
-   **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior.
-   **Explain which behavior you expected to see instead and why.**

> **Note:** If you find a **Closed** issue that seems like it is the same thing that you're experiencing, open a new issue and include a link to the original issue in the body of your new one.

### Writing code

Find an issue you want to work on, or if you have your own idea create an issue. You might find an issue assigned. Double-check
if somebody else is working on the same issue.

#### Local development

It usually is a good idea to create a dummy repository to run your changes.

While writing code make sure you follow these guidelines:

-   Use 4 space indentation.
-   Always use strict equality checks `===` instead of `==`.
-   Make sure your code runs on node 6.
-   Make sure you run `prettier` and `ESLint`.
-   Write tests and run them. Check coverage before submitting.
-   Write documentation for your code.

### Pull Requests

-   Non-trivial changes are often best discussed in an issue first, to prevent you from doing unnecessary work.
-   For ambitious tasks, you should try to get your work in front of the community for feedback as soon as possible. Open a pull request as soon as you have done the minimum needed to demonstrate your idea. At this early stage, don't worry about making things perfect, or 100% complete. Add a [WIP] prefix to the title, and describe what you still need to do. This lets reviewers know not to nit-pick small details or point out improvements you already know you need to make.
-   New features should be accompanied with tests and documentation.
-   Don't include unrelated changes.
-   Make the pull request from a [topic branch](https://github.com/dchelimsky/rspec/wiki/Topic-Branches), not master.
-   Use a clear and descriptive title for the pull request and commits.
-   Write a convincing description of why we should land your pull request. It's your job to convince us. Answer "why" it's needed and provide use-cases.
-   You might be asked to do changes to your pull request. There's never a need to open another pull request. [Just update the existing one.](https://github.com/RichardLitt/knowledge/blob/master/github/amending-a-commit-guide.md)
-   Be patient, we might not find time to check on your pull requests immediately. It will be checked eventually.

### Publishing your branch as a package

This can be handy if you would like to test your changes with some application that uses Melody, before merging your changes to Melody master. On your local machine, on the branch containing your changes, run the following command (you have to be logged in to NPM and have publish rights for Melody):

```
yarn lerna publish --no-git-tag-version --no-push --no-git-reset --exact --force-publish="*" --canary --yes --dist-tag $(git rev-parse --abbrev-ref HEAD) --preid $(git rev-parse --short HEAD) --registry https://registry.npmjs.org
```

This should give you a list of published packages, like so:

```
Successfully published:
 - melody-code-frame@1.5.1-ed89a02.5+ed89a02
 - melody-compiler@1.5.1-ed89a02.5+ed89a02
 - melody-component@1.5.1-ed89a02.5+ed89a02
 - melody-devtools@1.5.1-ed89a02.5+ed89a02
 - ...
```

Then, in your application's `package.json`, change all Melody dependencies to the version you get in the above message. You can omit anything starting from the `+`, so this would be `1.5.1-ed89a02.5` in this example:

```javascript
    "dependencies": {
        ...
        "melody-component": "1.5.1-ed89a02.5",
        "melody-devtools": "1.5.1-ed89a02.5",
        "melody-hoc": "1.5.1-ed89a02.5",
        "melody-idom": "1.5.1-ed89a02.5",
        ...
    }
```

Finally, run `yarn` or `npm install`, depending on your project's package manager.

Your project now uses the changes from your Melody branch.
