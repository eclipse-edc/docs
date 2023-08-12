# EDC Developer Handbook

<!-- TOC -->
* [EDC Developer Handbook](#edc-developer-handbook)
  * [Introduction](#introduction)
  * [Building a distribution](#building-a-distribution)
    * [Seed some data](#seed-some-data)
    * [Perform a data transfer](#perform-a-data-transfer)
  * [The control plane - core concepts](#the-control-plane---core-concepts)
    * [API objects in detail](#api-objects-in-detail)
    * [EDC state machines](#edc-state-machines)
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
<!-- TOC -->

## Introduction

--> states the intended audience, required pre-existing knowledge, required tools, etc.

## Building a distribution
--> link to one of the samples

### Seed some data

--> use postman, or even just curl

### Perform a data transfer
--> actually launches another connector, shows a data exchange -> link to samples

## The control plane - core concepts

### API objects in detail

--> explains Assets, Policies, Contract Definitions, etc. from an external API perspective. mentions JSON-LD and related
specs (ODRL, DCAT)

### EDC state machines

--> gives an overview of the state machines to understand asynchronicity and why some APIs only return IDs

### The extension model

--> how to write your own first extension, explains plug-points points, metamodel annotations, SPIs, etc

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
