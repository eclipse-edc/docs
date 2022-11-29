# EDC Documentation

This repository contains the documentation framework for providing the documentation files of all EDC
repositories as a [GitHub page](https://docs.github.com/en/pages).

The pages are deployed from the `/docs` sub-directory to <https://eclipse-edc.github.io/docs>.

## Local Deployment

If you want to add content or change configurations, please refer to the [official Docsify documentation](https://docsify.js.org/).

For a local deployment, install [Node.js](https://nodejs.org/), check out this repository, and run Docsify:
```commandline
$ git clone https://github.com/eclipse-edc/docs.git
$ cd docs
$ npm i docsify-cli -g
$ docsify serve docs
```

## Contributing

See [how to contribute](docs/submodule/Connector/CONTRIBUTING.md).
