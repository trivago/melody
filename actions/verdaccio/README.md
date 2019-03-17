# Publish a NPM package in a local registry with Verdaccio

Test the integrity of a package publishing in [Verdaccio](https://verdaccio.org/).

```
action "Publish Verdaccio" {
  uses = "verdaccio/github-actions/publish@master"
  args = ["publish"]
}
```


Reference: https://github.com/verdaccio/github-actions/blob/master/publish