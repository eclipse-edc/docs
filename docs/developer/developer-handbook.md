# Developer's Handbook

<!-- TOC -->

* [Developer's Handbook](#developers-handbook)
    * [Introduction](#introduction)
        * [Terminology](#terminology)
    * [Building a distribution](#building-a-distribution)
        * [Perform a simple data transfer](#perform-a-simple-data-transfer)
        * [Transfer some more data](#transfer-some-more-data)
    * [Core concepts](#core-concepts)
    * [The control plane](#the-control-plane)
        * [API objects in detail](#api-objects-in-detail)
        * [Control plane state machines](#control-plane-state-machines)
            * [Provisioning](#provisioning)
        * [The extension model](#the-extension-model)
        * [EDC dependency injection](#edc-dependency-injection)
        * [Policy scopes and evaluation](#policy-scopes-and-evaluation)
    * [The data plane](#the-data-plane)
        * [Data plane selectors](#data-plane-selectors)
        * [Writing a DataSink and DataSource extension](#writing-a-datasink-and-datasource-extension)
        * [The Control API](#the-control-api)
    * [Advanced concepts](#advanced-concepts)
        * [Events and callbacks](#events-and-callbacks)
        * [The EDC JUnit framework](#the-edc-junit-framework)
        * [Automatic documentation](#automatic-documentation)
        * [Customize the build](#customize-the-build)
    * [Further references and specifications](#further-references-and-specifications)

<!-- TOC -->

## Introduction

This document is intended for developers, who aim at using the Eclipse Dataspace Components in their software project at
the library level. The Eclipse Dataspace Components projects is not a ready-to-use application, but rather a
comprehensive
collection of libraries and modules, that are published as Maven artefacts, and that developers can use and extend.

Therefore, if you are a solution architect looking for a high-level description and how to integrate EDC, or a developer
wanting to contribute to the project itself, this guide is not for you. More suitable resources can be found [here]()
and [here]() respectively.

However, if you are a developer who is familiar with Java (17+) and the Gradle build system in general, and concepts
like extensibility, dependency injection and modularity, then this guide is for you.

Furthermore, this guide assumes a basic understanding of the following topics:

- [JSON-LD](https://json-ld.org)
- HTTP/REST
- relational databases (PostgreSQL) and transaction management
- git and git workflows

At a minimum, the following tools are required:

- Java 17+
- Gradle 8+
- a POSIX compliant shell (bash, zsh,...)
- a text editor
- CLI tools like `curl` and `git`

This guide will use CLI tools as common denominator, but in many cases graphical alternatives exist (e.g. Postman,
Insomnia), and most developers will likely use IDEs like IntelliJ or VSCode. Please understand that while we are aware
of them and recommend their use, we simply cannot cover and explain every possible combination of OS, tool and tool
version.

### Terminology

- runtime: a Java process executing code written in the EDC programming model (e.g. a control plane)
- a distribution: a specific assortment of modules, compiled into a runnable form, e.g. a JAR file, a Docker image etc.
- a launcher: a runnable Java module, that pulls in other modules to form a distribution. sometimes used synonymously
  with distribution.
- connector: a control plane runtime and 1...N data plane runtimes. Sometimes used interchangeably with _distribution_.

## Building a distribution

In the EDC terminology, a "distribution" is an executable fat jar file, that consists of a compilation of specific EDC
modules. It is sometimes sloppily referred to as "runtime", which is not _quite_ correct, but it does loosely compare to
the notion of a Linux distribution.

Typically, distributions consist of a [control plane](#the-control-plane) and one or
more [data planes](#the-data-plane). The earlier takes care of data manipulation, contract negotiation and transfer
setup, and is geared toward reliability, whereas the job of the latter is to actually shovel bits from A to B.

The EDC project provides a comprehensive collection of [samples](https://github.com/eclipse-edc/Samples), including one
that demonstrates
the [assembly of a very simplistic distribution](https://github.com/eclipse-edc/Samples/blob/main/basic/basic-01-basic-connector/README.md).

This simplest of distributions doesn't do much yet, it cannot even be configured properly, but it serves as starting
point for more complex distributions and launchers.

Subsequent chapters of this document will assume a full understanding of the concepts and terms presented in
the [basic samples](https://github.com/eclipse-edc/Samples/blob/main/basic), so please make sure you go through them
carefully.

### Perform a simple data transfer

Now that you've built and run your first distribution, it is time to actually do something with it. So far, our
connector wasn't able to do much, so we'll have to add a few capabilities to it. In EDC, we call these capabilities
[_extensions_](#the-extension-model), and they are dynamically loaded at startup to extend the functionality of a
runtime. For example, adding you favorite authentication backend can be done through extensions.

At this point, we also need to introduce the notion of a "consumer" and a "provider" connector. As the saying goes, it
takes two to tango, so in this section we will run two connectors - a consumer and a provider. To that end, we need to
extend our distribution and add the following components:

- an API so we can communicate with it
- an authentication subsystem to secure the API
- protocol plugins so it can communicate with other connectors

Please note that although both runtimes technically could be launched off of the _same distribution_ the same way you
could install the same Linux distro on multiple computers, for demonstration purposes this sample defines two identical
distributions, but located in different directories and pre-loaded with different config values.

Please work through
the [complete sample](https://github.com/eclipse-edc/Samples/tree/main/transfer/transfer-01-file-transfer), look
at the enclosed source code and try to modify some values and see how they affect the data transfer.

> Be advised that some of the concepts presented there are only suitable in a sample/demo environment and are not
> suitable for a production environment, such as seeding data through code, using hardcoded API tokens or storing files
> on the local file system.

### Transfer some more data

Great, you've just gone through a pre-canned data transfer of assets, that were already created for you. That's not very
interesting, is it? Also, copying a local file from the provider to the consumer is not a very realistic scenario.

Therefor in this chapter, we will use a slightly extended setup, where the data that the provider offers, is coming out
of some "private backend" service, that is purportedly inaccessible to the consumer. The consumer then is given access
to it through a proxy, and can obtain the data. We call this a "consumer-pull" transfer.

Please be advised that the sample will use some concepts and terms we haven't discussed yet, such
as [policies](#policy-scopes-and-evaluation) and [data plane registration](#data-plane-selectors). Bear with us, we will
explain them later. For now, please just make sure you follow
the [http-pull sample guide](https://github.com/eclipse-edc/Samples/tree/main/transfer/transfer-06-consumer-pull-http/README.md).

We encourage you to play around with this sample a bit, try to add a new asset and see if you can work out what else you
need in order to be able to transfer it to the consumer.

## Core concepts

When EDC was originally created, there were a few fundamental architectural principles around which we designed and
implemented all dataspace components. These include:

- **asynchronicity**: all mutations of internal data structures happen in an asynchronous fashion. While the REST
  requests
  to trigger the mutations may still be synchronous, the actual state changes happen in an asynchronous and persistent
  way. For example starting a contract negotiation through the API will only return the negotiation's ID, and the
  control plane will cyclically advance the negotiation's state.
- **single-thread processing**: the control plane is designed around a set of
  sequential [state machines](#control-plane-state-machines), that employ pessimistic locking to guard against race
  conditions and other problems.
- **idempotency**: requests, that don't trigger a mutation, are idempotent. The same is true when [provisioning external
  resources](#provisioning).
- **error-tolerance**: the design goal of the control plane was to favor correctness and reliability over (low) latency.
  That means, even if a communication partner may not be reachable due to a transient error, it is designed to cope with
  that error and attempt to overcome it.

Other, less technical guidelines include simplicity and self-contained-ness. We are extremely careful when adding
third-party libraries or technologies to maintain a simple, fast and un-opinionated platform. 

## The control plane

### API objects in detail

--> explains Assets, Policies, Contract Definitions, etc. from an external API perspective. mentions JSON-LD and related
specs (ODRL, DCAT)

### Control plane state machines

--> gives an overview of the contract negotiation and transfer process state machines

#### Provisioning

### The extension model

--> how to write your own first extension, explains plug-points points, metamodel annotations, SPIs, etc

- Authentication/Authorization of the Management API
- policies and evaluation functions
- persistence implementations
- provisioners
- transaction management (?)

### EDC dependency injection

--> explains how a custom extension can inject and provide objects

### Policy scopes and evaluation

## The data plane

### Data plane selectors

--> explains how dataplane selection works and how devs can register a dataplane with the selector

### Writing a DataSink and DataSource extension

--> link to samples?

### The Control API

--> explains the usage of the control api, in case people want to write their own data plane

## Advanced concepts

### Events and callbacks

--> shows how to hook into

### The EDC JUnit framework

--> explains how devs can leverage the In-Mem runtime feature, the dependency-injection extension, all the different
tags, the postgres extension, etc.

### Automatic documentation

--> explains what automatic documentation is, how to leverage it, how to download the EDC autodoc manifests and how to
merge them with the downstream docs

### Customize the build

--> shows how to configure and influence the build

## Further references and specifications

- DSP specification
- OpenAPI documentation
