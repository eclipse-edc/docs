# Developer's Handbook

## Table of contents

<!-- TOC -->
* [Developer's Handbook](#developers-handbook)
  * [Table of contents](#table-of-contents)
  * [Introduction](#introduction)
  * [Terminology](#terminology)
  * [Overview of the Eclipse Dataspace Components](#overview-of-the-eclipse-dataspace-components)
    * [Runtime Metamodel](#runtime-metamodel)
    * [GradlePlugins](#gradleplugins)
    * [Federated Catalog](#federated-catalog)
    * [RegistrationService](#registrationservice)
    * [IdentityHub](#identityhub)
    * [Technology repositories](#technology-repositories)
    * [Minimal Viable Dataspace](#minimal-viable-dataspace)
    * [DataDashboard](#datadashboard)
    * [TrustFrameworkAdoption](#trustframeworkadoption)
  * [The extension model](#the-extension-model)
    * [Dependency Injection à la EDC](#dependency-injection-à-la-edc)
  * [The EDC object model](#the-edc-object-model)
    * [`Assets` and `DataAddresses`](#assets-and-dataaddresses)
    * [Contracts](#contracts)
    * [Policies](#policies)
  * [The Control Plane](#the-control-plane)
    * [Contract negotiation](#contract-negotiation)
    * [Data transfers](#data-transfers)
    * [Policy scopes and evaluation](#policy-scopes-and-evaluation)
    * [Events and Callbacks](#events-and-callbacks)
  * [The Data Plane](#the-data-plane)
    * [Selecting a data plane for a transfer](#selecting-a-data-plane-for-a-transfer)
    * [Extending the data plane framework](#extending-the-data-plane-framework)
      * [Write your own `DataSink` and `DataSource`](#write-your-own-datasink-and-datasource)
      * [The Control API](#the-control-api)
  * [The Management API](#the-management-api)
  * [Testing](#testing)
  * [Automatic documentation](#automatic-documentation)
  * [Our collaboration model](#our-collaboration-model)
<!-- TOC -->

## Introduction

This documentation serves as the starting point for everyone who wants to use Eclipse Dataspace Components in their own
project. A fundamental knowledge of Java, Gradle, and object-oriented programming, HTTP/REST, as well as using a (POSIX)
shell is assumed. Further, readers should have basic knowledge of [JSON-LD](https://json-ld.org/), because all
client-facing APIs and protocol endpoints "talk" JSON-LD.

The Eclipse Dataspace Components project delivers a toolbox of various components, the sum of which make up a platform,
onto which users can build their own dataspace.

EDC aims at using established standards where possible to ensure a high level of adoption, acceptance and
recognizability.

## Terminology

## Overview of the Eclipse Dataspace Components

### Runtime Metamodel

### GradlePlugins

### Federated Catalog

### RegistrationService

### IdentityHub

### Technology repositories

### Minimal Viable Dataspace

### DataDashboard

### TrustFrameworkAdoption

## The extension model

--> explains extensions, service loader

### Dependency Injection à la EDC

--> Provider, Inject, Provides, Requires

## The EDC object model

### `Assets` and `DataAddresses`

--> modelling recommendations

### Contracts

### Policies

--> explains policies, links to policy generator tool

## The Control Plane

### Contract negotiation

### Data transfers

### Policy scopes and evaluation

### Events and Callbacks

## The Data Plane

### Selecting a data plane for a transfer

--> shows the dataplane selector

### Extending the data plane framework

#### Write your own `DataSink` and `DataSource`
#### The Control API

## The Management API


## Testing

--> explains various test extensions we have
--> shows the multi-runtime-in-JVM-launcher

## Automatic documentation

--> explains various annotations and `autodoc`

## Our collaboration model
--> Decision Records
--> Style guide, PR etiquette, Contributions
--> becoming a contributor and a committer