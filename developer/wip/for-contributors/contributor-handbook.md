# Contributor Documentation

## 0. Intended audience

This document is aimed at software developers who have already ingested the [adopter documentation](../for-adopters/)
and want to contribute code to the Eclipse Dataspace Components project.

Its purpose is to explain in greater detail the core concepts of EDC. After reading through it, readers should have a
good understanding of EDCs inner workings, implementation details and some of the advanced concepts.

So if you are a solution architect looking for a high-level description on how to integrate EDC, or a software engineer
who wants to use EDC in their project, then this guide is not for you. More suitable resources can be
found [here](https://eclipse-edc.github.io/docs/#/README)
and [here](../for-adopters/) respectively.

## 1. Getting started

### 1.1 Prerequisites

This document presumes a good understanding and proficiency in the following technical areas:

- JSON and [JSON-LD](https://json-ld.org)
- HTTP/REST
- relational databases (PostgreSQL) and transaction management
- git and git workflows

Further, the following tools are required:

- Java Development Kit 17+
- Gradle 8+
- a POSIX compliant shell (bash, zsh,...)
- a text editor
- CLI tools like `curl` and `git`

This guide will use CLI tools as common denominator, but in many cases graphical alternatives exist (e.g. Postman,
Insomnia, some database client, etc.), and most developers will likely use IDEs like IntelliJ or VSCode. We are of
course aware of them and
absolutely recommend their use, but we simply cannot cover and explain every possible combination of OS, tool
and tool version.

> Note that Windows is not a supported OS at the moment. If Windows is a must, we recommend using WSL2 or a setting up a
> Linux VM.

### 1.2 Terminology

- runtime: a Java process executing code written in the EDC programming model (e.g. a control plane)
- distribution: a specific combination of modules, compiled into a runnable form, e.g. a fat JAR file, a Docker image
  etc.
- launcher: a runnable Java module, that pulls in other modules to form a distribution. "Launcher" and "distribution"
  are sometimes used synonymously
- connector: a control plane runtime and 1...N data plane runtimes. Sometimes used interchangeably with "distribution".

### 1.3 Architectural and coding principles

When EDC was originally created, there were a few fundamental architectural principles around which we designed and
implemented all dataspace components. These include:

- **asynchrony**: all external mutations of internal data structures happen in an asynchronous fashion. While the REST
  requests to trigger the mutations may still be synchronous, the actual state changes happen in an asynchronous and
  persistent way. For example starting a contract negotiation through the API will only return the negotiation's ID, and
  the control plane will cyclically advance the negotiation's state.
- **single-thread processing**: the control plane is designed around a set of
  sequential [state machines](#221-state-machines), that employ pessimistic locking to guard against race conditions and
  other problems.
- **idempotency**: requests, that do not trigger a mutation, are idempotent. The same is true when provisioning external
  resources.
- **error-tolerance**: the design goal of the control plane was to favor correctness and reliability over (low) latency.
  That means, even if a communication partner may not be reachable due to a transient error, it is designed to cope with
  that error and attempt to overcome it.

Prospective contributors to the Eclipse Dataspace Components are well-advised to follow these principles
and build their applications around them.

There are other, less technical principles of EDC such as simplicity and self-contained-ness. We are extremely careful
when adding third-party libraries or technologies to maintain a simple, fast and un-opinionated platform.

Take a look at our [coding principles](../../contributing/coding-principles.md) and
our [styleguide](../../contributing/styleguide.md).

## 2. The control plane

### 2.1 Entities

explain all "entities" in detail
query specs, criterion
default in-mem stores, predicate converters, CriterionOperatorRegistry, ReflectionBasedQueryResolver

### 2.2 Programming Primitives

#### 2.2.1 State machines

used for async, processors, database-level locks, stateful entities

#### 2.2.2 Transformers

#### 2.2.3 Token generation + decorators

#### 2.2.4 Token validation + rules

### 2.3 Serialization via JSON-LD

why its needed, why we sometimes use Jackson SerDes

### 2.4 Extension model

details about metamodel annotations, (api authentication) registries, configuration best practices

### 2.5 Dependency injection deep dive

details regarding `@Provides`, `@Provider`, `@Requires`, `@Inject`
defaults of default providers (e.g. resolution on demand)
dependency graph lifecycle
best practices

### 2.6 Service layers

- api controllers: transformers, validators
- (aggregate) services: transaction management
- stores:
- Events and callbacks

### 2.7 Protocol extensions (DSP)

### 2.8 (Postgre-)SQL persistence

translation mapping, querying, JSON field mappers, etc.

### 2.9 Data plane signaling

## 3. The data plane

### 3.1 Data plane self-registration

### 3.2 Public API authentication

### 3.3 Writing a custom data plane extension (sink/source)

### 3.4 Writing a custom data plane (using only DPS)

## 4. Development best practices

### 4.1 Writing Unit-, Component-, Integration-, Api-, EndToEnd-Tests\

test pyramid...

### Other best practices

-> link to best practices doc

## 5. Further concepts

### 4.3 Autodoc

### 4.4 Adapting the Gradle build
