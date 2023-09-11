# EDC Documentation

This repository contains project-wide documentation.

- [How to contribute](CONTRIBUTING.md)
    - [Get referenced as "friend"](contributing/adoption.md)
    - [How to create a PR](contributing/pr_etiquette.md)
- [Developer documentation](developer/)
    - [Coding principles](developer/contributing/coding-principles.md)
    - [Styleguide](developer/contributing/styleguide.md)
    - [Handbook](developer/handbook.md)
    - [Templates](developer/templates/)
- [Project-wide decision records](developer/decision-records/README.md)
- [Committer guidelines](COMMITTERS.md)
- [List of adoptions](KNOWN_FRIENDS.md)

## GitHub Pages

The documentation files of all EDC repositories are provided with [GitHub Pages](https://docs.github.com/en/pages).

The pages are deployed from the `/docs` subdirectory to <https://eclipse-edc.github.io/docs>.

### Local Deployment

If you want to add content or change configurations, please refer to the [official Docsify documentation](https://docsify.js.org/).

For a local deployment, install [Node.js](https://nodejs.org/), check out this repository, and run Docsify:
```commandline
$ git clone https://github.com/eclipse-edc/docs.git
$ cd docs
$ npm i docsify-cli -g
$ docsify serve docs
```

## Contributing

See [how to contribute](CONTRIBUTING.md).
