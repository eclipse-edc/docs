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
      * [Assets](#assets)
      * [Policies](#policies)
        * [Policy scopes](#policy-scopes)
        * [Policy evaluation functions](#policy-evaluation-functions)
        * [Example: binding an evaluation function](#example-binding-an-evaluation-function)
        * [Advanced policy concepts](#advanced-policy-concepts)
      * [Contract definitions](#contract-definitions)
      * [Contract negotiations](#contract-negotiations)
      * [Contract agreements](#contract-agreements)
      * [Transfer processes](#transfer-processes)
      * [Catalog](#catalog)
      * [Expressing queries with a `Criterion`](#expressing-queries-with-a-criterion)
        * [Canonical form](#canonical-form)
        * [Supported operators](#supported-operators)
        * [Namespaced properties](#namespaced-properties)
      * [A word on JSON-LD contexts](#a-word-on-json-ld-contexts)
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
collection of libraries and modules, that are published as Maven artifacts, and that developers can use and extend.

Therefore, if you are a solution architect looking for a high-level description on how to integrate EDC, or a developer
wanting to contribute to the project itself, this guide is not for you. More suitable resources can be
found [here](../docs/documentation/)
and [here](../docs/documentation/CONTRIBUTING.md) respectively.

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
- distribution: a specific assortment of modules, compiled into a runnable form, e.g. a JAR file, a Docker image etc.
- launcher: a runnable Java module, that pulls in other modules to form a distribution, sometimes used synonymously
  with distribution.
- connector: a control plane runtime and 1...N data plane runtimes. Sometimes used interchangeably with _distribution_.

## Building a distribution

In the EDC terminology, a "distribution" is an executable fat jar file, that consists of a compilation of specific EDC
modules. It is sometimes sloppily referred to as "runtime", which is not _quite_ correct, but it does loosely compare to
the notion of a Linux distribution.

Typically, distributions consist of a [control plane](#the-control-plane) and one or
more [data planes](#the-data-plane). The former takes care of data manipulation, contract negotiation and transfer
setup, and is geared toward reliability, whereas the job of the latter is to actually shovel bits from A to B.

The EDC project provides a comprehensive collection of [samples](../docs/samples/), including one
that demonstrates
the [assembly of a very simplistic distribution](../docs/samples/basic/basic-01-basic-connector/).

This simplest of distributions doesn't do much yet, it cannot even be configured properly, but it serves as starting
point for more complex distributions and launchers.

Subsequent chapters of this document will assume a full understanding of the concepts and terms presented in
the [basic samples](../docs/samples/basic/), so please make sure you go through them
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
the [complete sample](../docs/samples/transfer/transfer-01-file-transfer/), look
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
the [http-pull sample guide](../docs/samples/transfer/transfer-06-consumer-pull-http/README.md).

We encourage you to play around with this sample a bit, try to add a new asset and see if you can work out what else you
need in order to be able to transfer it to the consumer.

## Core concepts

When EDC was originally created, there were a few fundamental architectural principles around which we designed and
implemented all dataspace components. These include:

- **asynchrony**: all mutations of internal data structures happen in an asynchronous fashion. While the REST
  requests to trigger the mutations may still be synchronous, the actual state changes happen in an asynchronous and
  persistent way. For example starting a contract negotiation through the API will only return the negotiation's ID, and
  the control plane will cyclically advance the negotiation's state.
- **single-thread processing**: the control plane is designed around a set of
  sequential [state machines](#control-plane-state-machines), that employ pessimistic locking to guard against race
  conditions and other problems.
- **idempotency**: requests, that do not trigger a mutation, are idempotent. The same is true
  when [provisioning external
  resources](#provisioning).
- **error-tolerance**: the design goal of the control plane was to favor correctness and reliability over (low) latency.
  That means, even if a communication partner may not be reachable due to a transient error, it is designed to cope with
  that error and attempt to overcome it.

Developers who aim to use the Eclipse Dataspace Components in their projects are well-advised to follow these principles
and build their applications around them. For example, when developing an app that monitors the progress of a contract
negotiation or a transfer process, it is better to listen to [events](#events-and-callbacks) rather than polling a
service or an API.

There are other, less technical principles of EDC such as simplicity and self-contained-ness. We are extremely careful
when adding third-party libraries or technologies to maintain a simple, fast and un-opinionated platform.

## The control plane

Simply put, the control plane is the brains of a connector, whereas the data plane would be the muscle. Its tasks
include handling protocol and API requests, managing various internal asynchronous processes, validating policies,
performing participant authentication and delegating the data transfer to a data plane. Its job is to handle (almost)
all business logic. For that, it is designed to favor _reliability_ over _low latency_. It does **not** directly
transfer data from source to destination.

### API objects in detail

We've seen in [previous sections](#transfer-some-more-data) that the primary way to interact with a running connector
instance is the Management API. It follows conventional REST semantics and allows manipulation of certain objects within
the control plane. For example, it allows to specify, which data offerings are presented to the dataspace, and under
what conditions.

> For this chapter we assume basic knowledge of [JSON-LD](http://json-ld.org), and we also recommend reading the
> specifications for [ODRL](https://www.w3.org/TR/odrl-model/) and [DCAT](https://www.w3.org/TR/vocab-dcat-2/).

#### Assets

Assets are containers for metadata, they do **not** contain the actual bits and bytes. Say you want to offer a file to
the dataspace, that is physically located in an S3 bucket, then the corresponding `Asset` would contain metadata about
it, such as the content type, file size, etc. In addition, it could contain _private_ properties, for when you want to
store properties on the asset, which you _do not want to_ expose to the dataspace.

The `Asset` also contains a `DataAddress`, which can be understood as a "pointer into the physical world". In the S3
example, that `DataAddress` might contain the bucket name and the region. Notice that the _schema_ of the `DataAddress`
will depend on where the data is physically located, for instance a `HttpDataAddress` has different properties.

A very simplistic `Asset` could look like this:

```json
{
  "@context": {
    "edc": "https://w3id.org/edc/v0.0.1/ns/"
  },
  "@id": "79d9c360-476b-47e8-8925-0ffbeba5aec2",
  "properties": {
    "somePublicProp": "a very interesting value"
  },
  "privateProperties": {
    "secretKey": "this is very secret, never tell it to the dataspace!"
  },
  "dataAddress": {
    "type": "HttpData",
    "baseUrl": "http://localhost:8080/test"
  }
}
```

There are a couple of noteworthy things here. First, while there isn't a _strict requirement_ for the `@id` to be a
UUID, we highly recommend it.

By design, the `Asset` is extensible, so users can store any metadata they want in it. For example, the `properties`
object could contain a simple string value, or it could be a complex object, following some custom schema. Be aware,
that unless specified otherwise, all properties are put under the `edc` namespace by default. There are some
"well-known" properties in the `edc:` namespace: `id`, `description`, `version`, `name`, `contenttype`.

Here is an example of how an Asset with a custom property following a custom namespace would look like:

```json
{
  "@context": {
    "edc": "https://w3id.org/edc/v0.0.1/ns/",
    "ex": "http://w3id.org/example/v0.0.1/ns/"
  },
  "@id": "79d9c360-476b-47e8-8925-0ffbeba5aec2",
  "properties": {
    "somePublicProp": "a very interesting value",
    "ex:foo": {
      "name": "Darth Vader",
      "webpage": "https://death.star"
    }
  }
  //...
}
```

assuming the context object found at http://w3id.org/example/v0.0.1/ns/ contains a type definition of the `foo` object.
As a reminder: the JSON-LD context could look like this:

```json
{
  "@context": {
    "name": "http://schema.org/name",
    "webpage": {
      "@id": "http://schema.org/url",
      "@type": "@id"
    }
  }
}
```

Note that upon ingress through the management API, all JSON-LD objects
get [expanded](https://www.w3.org/TR/json-ld11/#expanded-document-form), because the control plane only operates on
expanded JSON-LD objects. Since the `Asset` is an extensible type, this is necessary to avoid potential name clashes of
properties.

This is important to keep in mind, because when querying for assets using the `POST /assets/request` endpoint, the query
that is submitted in the request body must target the _expanded_ property. For example, a query targeting
the `somePublicProp` field from the example above would look like this:

```json
{
  "https://w3id.org/edc/v0.0.1/ns/filterExpression": [
    {
      "https://w3id.org/edc/v0.0.1/ns/operandLeft": [
        {
          "@value": "https://w3id.org/edc/v0.0.1/ns/somePublicProp"
        }
      ],
      "https://w3id.org/edc/v0.0.1/ns/operator": [
        {
          "@value": "="
        }
      ],
      "https://w3id.org/edc/v0.0.1/ns/operandRight": [
        {
          "@value": "a very interesting value"
        }
      ]
    }
  ]
}
```

More information about JSON-LD Contexts and type definitions can be
found [here](https://www.w3.org/TR/json-ld11/#the-context).

#### Policies

Policies are the EDC way of expressing that certain conditions may, must or must not be satisfied in certain situations.
In that sense, policies are used to express what requirements a subject (e.g. a communication partner) must satisfy in
order to be able to perform an action. For example, one such requirement - or more specifically: a _duty_ could be that
a communication partner who wants to negotiate a contract, must have headquarters in the European Union.

Policies are [ODRL](https://www.w3.org/TR/odrl-model/) serialized as JSON-LD. Thus, our previous example would look like
this:

```json
{
  "@context": {
    "edc": "https://w3id.org/edc/v0.0.1/ns/"
  },
  "@type": "PolicyDefinition",
  "policy": {
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Set",
    "duty": [
      {
        "target": "http://example.com/asset:12345",
        "action": "use",
        "constraint": {
          "leftOperand": "headquarter_location",
          "operator": "eq",
          "rightOperand": "EU"
        }
      }
    ]
  }
}
```

The `duty` object expresses the semantics of the constraint. It is a specialization of `rule`, which expresses either a
MUST (`duty`), MAY (`permission`) or MUST NOT (`prohibition`) relation. The `action` expresses the type of action for
which the rule is intended. Acceptable values for `action` are defined [here](https://www.w3.org/TR/odrl-model/#action),
but in EDC you'll exclusively encounter `"use"`.

The `constraint` object expresses logical relationship of a key (`leftOperand`), the
value (`righOperand`) and the `operator`. Multiple constraints can be linked logically,
see [advanced policy concepts](#advanced-policy-concepts).
The `leftOperand` and `rightOperand` are completely arbitrary, only
the `operator` is limited to the following possible
values: `eq`, `neq`, `gt`, `geq`, `lt`, `leq`, `in`, `hasPart`, `isA`, `isAllOf`, `isAnyOf`, `isNoneOf`.

Please note that not all operators are always allowed, for example `headquarter_location lt EU` is nonsensical and
should result in an evaluation error, whereas `headquarter_location isAnOf [EU, US]` would be valid. Whether
an `operator` is valid is solely defined by the [policy evaluation function](#policy-evaluation-functions), supplying an
invalid operator should raise an exception.

> NB: internally we always use the [expanded JSON-LD form](https://www.w3.org/TR/json-ld11/#expanded-document-form) for
> all processing.

##### Policy scopes

In casual terms, a policy scope is the "context", in which a policy is to be evaluated. There are certain pre-defied
points in the code, injecting/adding additional scopes is not possible. Currently, the following scopes exist:

- `contract.negotiation`: evaluated upon initial contract offer. Ensures that the consumer fulfills
  the [contract policy](#contract-policy).
- `transfer.process`: evaluated before starting a transfer process to ensure that the policy of
  the [contract agreement](#contract-agreements) is fulfilled. One example would be contract expiry.
- `catalog`: evaluated when the [catalog](#catalog) for a particular [participant agent](#participant-agents) is
  generated. Decides whether the participant has the asset in their catalog.
- `request.contract.negotiation`: evaluated on every request during contract negotiation between two control plane
  runtimes. Not relevant for end users.
- `request.transfer.process`: evaluated on every request during transfer establishment between two control plane
  runtimes. Not relevant for end users.
- `request.catalog`: evaluated upon an incoming catalog request. Not relevant for end users.
- `provision.manifest.verify`: evaluated during the precondition check for resource provisioning. Only relevant in
  advanced use cases.

A policy scope is a string that is used for two purposes:

1. binding a scope to a rule type: implement filtering based on the `action` or the `leftOperand` of a policy. This
   determines for every rule inside a policy whether it should be evaluated in the given scope.
2. binding a [policy evaluation function](#policy-evaluation-functions) to a scope: if a policy is determined to be "in
   scope" by the previous step, the policy engine invokes the evaluation function that was bound to the scope to
   evaluate if the policy is fulfilled.

Another way to understand policy scopes is for them to be the link between a rule and an evaluation function, and the
points in the code where it needs to be evaluated.

##### Policy evaluation functions

If policies are a formalized declaration of requirements, policy evaluation functions are the means to evaluate those
requirements. They are pieces of Java code executed at runtime. A policy on its own only _expresses_ the requirement,
but in order to enforce it, we need to run policy evaluation functions.

Upon evaluation, they receive the operator, the `rightOperand` (or _rightValue_), the rule, and the `PolicyContext`. A
simple evaluation function that asserts the headquarters policy mentioned in the example above could look similar to
this:

```java
public class HeadquarterFunction implements AtomicConstraintFunction<Duty> {
    public boolean evaluate(Operator operator, Object rightValue, Permission rule, PolicyContext context) {
        if (!(rightValue instanceof String)) {
            context.reportProblem("Right-value expected to be String but was " + rightValue.getClass());
            return false;
        }
        if (operator != Operator.EQ) {
            context.reportProblem("Invalid operator, only EQ is allowed!");
            return false;
        }

        var participant = context.getContextData(ParticipantAgent.class);
        var participantLocation = extractLocationClaim(participant); // EU, US, etc.
        return participantLocation != null && rightValue.equalsIgnoreCase(participantLocation);
    }
}
```

This particular evaluation function only accepts `eq` as operator, and only accepts scalars as `rightValue`.

The `ParticipantAgent` is a representation of the communication counterparty that contains a set of verified claims. In
the example, `extractLocationClaim()` would look for a claim that contains the location of the agent and return it as
string.

Other policies may require other context data than the participant's location, for example an exact timestamp, or may
even need a lookup in some third party system such as a customer database.

The same policy can be evaluated by different evaluation functions, if they are meaningful in different
contexts ([scopes](#policy-scopes)).

##### Example: binding an evaluation function

As we've learned, for a policy to be evaluated at certain [points](#policy-scopes), we need to create a policy (duh!),
bind the policy to a scope, create a [policy evaluation function](#policy-evaluation-functions), and we need to bind the
function to the same scope.
The standard way of registering and binding policies is done in an [extension](#the-extension-model). For example, here
we configure our `HeadquarterFunction` so that it evaluates our `headquarter_location` function whenever someone tries
to negotiate a contract:

```java
public class HeadquarterPolicyExtension implements ServiceExtension {

    @Inject
    private RuleBindingRegistry ruleBindingRegistry;

    @Inject
    private PolicyEngine policyEngine;

    private static final String HEADQUARTER_POLICY_KEY = "headquarter_location";

    @Override
    public void initialize() {
        // bind the policy to the scope
        ruleBindingRegistry.bind(HEADQUARTER_POLICY_KEY, NEGOTIATION_SCOPE);
        // create the function object
        var function = new HeadquarterFunction();
        // bind the function to the scope
        policyEngine.registerFunction(NEGOTIATION_SCOPE, Duty.class, HEADQUARTER_POLICY_KEY, function);
    }
}
```

Let's accept for now, that `@Inject` is how [EDC achieves dependency injection](#edc-dependency-injection).
This example assumes, a policy object exists in the system, that has a `leftOperand = headquarter_function`. For details
on how to create policies, please check out
the [OpenAPI documentation](https://app.swaggerhub.com/apis/eclipse-edc-bot/management-api/0.2.1#/Policy%20Definition/createPolicyDefinition).

##### Advanced policy concepts

Policies are in essence containers for rules (duties, permissions and prohibitions), and rules in turn are compose of
one or multiple constraints each. The following example extends the previous one by adding another duty rule: the
claimant must either have headquarters in the EU, or be in business for >= 10 years. Please also note that the
following example uses the [compacted form](https://www.w3.org/TR/json-ld11/#compacted-document-form) because all EDC
Management APIs return the compacted form.

```json
{
  "@id": "test-policy",
  "@type": "edc:PolicyDefinition",
  "edc:createdAt": 1692858228518,
  "edc:policy": {
    "@id": "8c2ff88a-74bf-41dd-9b35-9587a3b95adf",
    "@type": "odrl:Set",
    "odrl:permission": [],
    "odrl:prohibition": [],
    "odrl:obligation": {
      "odrl:action": {
        "odrl:type": "USE"
      },
      "odrl:constraint": {
        "odrl:or": [
          {
            "odrl:leftOperand": "headquarter_location",
            "odrl:operator": {
              "@id": "odrl:eq"
            },
            "odrl:rightOperand": "EU"
          },
          {
            "odrl:leftOperand": "years_in_business",
            "odrl:operator": {
              "@id": "odrl:gteq"
            },
            "odrl:rightOperand": "10"
          }
        ]
      }
    }
  },
  "@context": {
    "dct": "https://purl.org/dc/terms/",
    "edc": "https://w3id.org/edc/v0.0.1/ns/",
    "dcat": "https://www.w3.org/ns/dcat/",
    "odrl": "http://www.w3.org/ns/odrl/2/",
    "dspace": "https://w3id.org/dspace/v0.8/"
  }
}
```

Similarly, the `odrl:or` could have been replaced with an `odrl:and` or `odrl:xone` (exclusive-or).

#### Contract definitions

Contract definitions are how [assets](#assets) and [policies](#policies) are linked together. It is our way of
expressing which policies are in effect for an asset. So when we want to offer an asset (or several assets), we use a
contract definition to express under what conditions we do that. Those conditions are comprised by a _contract policy_
and the _access policy_, see below for details. Those policies are referenced by ID, that means they must be created
prior to the contract definition.

It is important to note that contract definitions are an _internal object_, i.e. they **never** leave the realm of the
provider, and they are **never** sent directly to the consumer.

- **access policy**: determines whether a particular consumer is offered an asset or not. For example, we may want to
  restrict certain assets such that only consumers of a particular geography may see them. Consumers outside that
  geography wouldn't even get them in their [catalog](#catalog).
- **contract policy**: determines the conditions for initiating a contract negotiation for a particular asset. That does
  not automatically guarantee the establishment of a contract, it merely expresses the _eligibility_ to start the
  negotiation.

Contract definitions also contain an `assetSelector`, which - in broad terms - is a query expression that defines all
the
assets that are included in the definition, not unlike an SQL SELECT statement. With that it is possible to configure
the same set of conditions (= access policy and contract policy) for a multitude of assets.

Please note that creating an `assetSelector` may require knowledge about the shape of an Asset and can get complex
fairly quickly, so be sure to read the chapter about [querying](#expressing-queries-with-a-criterion).

Here is an example of a contract definition, that defines an access policy and a contract policy for all assets, that
have the `foo=bar` property.

```json
{
  "@context": {
    "edc": "https://w3id.org/edc/v0.0.1/ns/"
  },
  "@type": "https://w3id.org/edc/v0.0.1/ns/ContractDefinition",
  "@id": "test-id",
  "accessPolicyId": "access-policy-1234",
  "contractPolicyId": "contract-policy-5678",
  "assetsSelector": [
    {
      "@type": "https://w3id.org/edc/v0.0.1/ns/Criterion",
      "operandLeft": "foo",
      "operator": "=",
      "operandRight": "bar"
    }
  ]
}
```

_NB: for the sake of brevity and clarity the compacted form of JSON-LD was used here._

The sample expresses that every asset, that contains a property `"foo" : "bar"` be made available under the access
policy `access-policy-1234` and contract policy `contract-policy-5678`.

#### Contract negotiations

#### Contract agreements

#### Transfer processes

#### Catalog

#### Expressing queries with a `Criterion`

A `Criterion` is a normalized way of expressing a logical requirement between two operands and an operator. For example,
we can use this to formulate a query, which selects all objects, where a particular property must have a particular
value. This is similar to an SQL `SELECT` statement, or a policy's `constraint` property.

Like the `constraint`, a `Criterion` has an `operandLeft`, an `operator` and an `operandRight`, which determine the
semantics of the query.

However, there are several very important aspects to understand:

##### Canonical form

The `operandLeft` targets the _canonical form_ or the object. For non-extensible properties, the canonical form is equal
to the object representation in Java code. For example, the canonical form of a transfer process's state field
is `state`,
because that is what the property on the Java class `TransferProcess.java` is called.

Thus, the resulting `Criterion` would look like this:

```json
{
  "@type": "https://w3id.org/edc/v0.0.1/ns/Criterion",
  "operandLeft": "state",
  "operator": "=",
  "operandRight": 800
}
```

Keen readers will notice, that the `TransferProcess#state` property is an enum named `TransferProcessStates`, but
the `operandRight` of the sample is an integer - what gives?
Enums are just "named integers", so we store them as integers in the database. Consequently, the transformation layer
that converts from `Criterion` to an actual SQL query expects the `state` field to be an `INT`.

More detailed information about the canonical format and SQL queries can be
found [here](https://github.com/eclipse-edc/Connector/blob/main/docs/developer/sql_queries.md).

##### Supported operators

The semantic cardinality of operators is virtually limitless, and that is impossible to main or test. Out-of-the box,
EDC supports a limited set of operators. Please find the related
documentation [here](https://github.com/eclipse-edc/Connector/blob/main/docs/developer/sql_queries.md#supported-query-operators).

It should be noted, that - like everything else in EDC - this can be extended through custom SQL dialects, or even
custom data backends. In other words, the set of supported `operators` depend on the backend system interpreting the
query. In the EDC PostgreSQL implementation, these are `=`, `like` and `in`.

##### Namespaced properties

Some objects, such as `Asset` don't have a fixed a schema, rather they are "extensible objects". This is comparable to
a `java.util.Map`. That means, you can store on them whatever you like, even complex objects. That not only brings a lot
of flexibility, it also introduces the potential danger of name clashes: for instance, a property `content-type` could
potentially have different meanings in different _contexts_. To counter this, we always persist the keys of such dynamic
objects with their fully qualified namespace. So if you are using custom properties with a custom JSON-LD namespace, you
will
have to use that namespace in the `Criterion`!

#### A word on JSON-LD contexts

> The complete OpenAPI specification for the management API is
> on [SwaggerHub](https://app.swaggerhub.com/apis/eclipse-edc-bot/management-api). Please select the latest version from
> the dropdown.

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
