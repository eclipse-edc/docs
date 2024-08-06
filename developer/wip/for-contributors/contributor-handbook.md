# Contributor Documentation


<!-- TOC -->
* [Contributor Documentation](#contributor-documentation)
  * [0. Intended audience](#0-intended-audience)
  * [1. Getting started](#1-getting-started)
    * [1.1 Prerequisites](#11-prerequisites)
    * [1.2 Terminology](#12-terminology)
    * [1.3 Architectural and coding principles](#13-architectural-and-coding-principles)
  * [2. The control plane](#2-the-control-plane)
    * [2.1 Entities](#21-entities)
      * [2.1.1 Assets](#211-assets)
      * [2.1.2 Policies](#212-policies)
        * [2.1.2.1 Policy vs PolicyDefinition](#2121-policy-vs-policydefinition)
        * [2.1.2.2 Policy scopes and bindings](#2122-policy-scopes-and-bindings)
        * [2.1.2.3 Policy evaluation functions](#2123-policy-evaluation-functions)
        * [2.1.2.4 Example: binding an evaluation function](#2124-example-binding-an-evaluation-function)
        * [2.1.2.5 Advanced policy concepts](#2125-advanced-policy-concepts)
          * [Pre- and Post-Evaluators](#pre--and-post-evaluators)
          * [Dynamic functions](#dynamic-functions)
      * [2.1.3 Contract definitions](#213-contract-definitions)
      * [2.1.4 Contract agreements](#214-contract-agreements)
      * [2.1.5 Catalog](#215-catalog)
      * [2.1.5 Querying with `QuerySpec` and `Criterion`](#215-querying-with-queryspec-and-criterion)
    * [2.2 Programming Primitives](#22-programming-primitives)
      * [2.2.1 State machines](#221-state-machines)
        * [2.2.1.1 Batch-size, sorting and tick-over timeout](#2211-batch-size-sorting-and-tick-over-timeout)
        * [2.2.1.2 Database-level locking](#2212-database-level-locking)
      * [2.2.2 Transformers](#222-transformers)
        * [2.2.2.1 Basic Serialization and Deserialization](#2221-basic-serialization-and-deserialization)
        * [2.2.2.1 Transformer context](#2221-transformer-context)
        * [2.2.2.2 Segmented transformer registries](#2222-segmented-transformer-registries)
        * [2.2.2.3 Reporting transformation errors](#2223-reporting-transformation-errors)
      * [2.2.3 Token generation and decorators](#223-token-generation-and-decorators)
      * [2.2.4 Token validation and rules](#224-token-validation-and-rules)
    * [2.3 Serialization via JSON-LD](#23-serialization-via-json-ld)
    * [2.4 Extension model](#24-extension-model)
    * [2.5 Dependency injection deep dive](#25-dependency-injection-deep-dive)
    * [2.6 Service layers](#26-service-layers)
      * [2.6.1 API controllers](#261-api-controllers)
      * [2.6.2 Validators](#262-validators)
      * [2.6.3 Transformers](#263-transformers)
      * [2.6.4 Aggregate services](#264-aggregate-services)
    * [2.7 Protocol extensions (DSP)](#27-protocol-extensions-dsp)
    * [2.8 (Postgre-)SQL persistence](#28-postgre-sql-persistence)
    * [2.9 Data plane signaling](#29-data-plane-signaling)
  * [3. The data plane](#3-the-data-plane)
    * [3.1 Data plane self-registration](#31-data-plane-self-registration)
    * [3.2 Public API authentication](#32-public-api-authentication)
    * [3.3 Writing a custom data plane extension (sink/source)](#33-writing-a-custom-data-plane-extension-sinksource)
    * [3.4 Writing a custom data plane (using only DPS)](#34-writing-a-custom-data-plane-using-only-dps)
  * [4. Development best practices](#4-development-best-practices)
    * [4.1 Writing Unit-, Component-, Integration-, Api-, EndToEnd-Tests](#41-writing-unit--component--integration--api--endtoend-tests)
    * [4.1 Other best practices](#41-other-best-practices)
  * [5. Further concepts](#5-further-concepts)
    * [4.3 Autodoc](#43-autodoc)
    * [4.4 Adapting the Gradle build](#44-adapting-the-gradle-build)
<!-- TOC -->

## 0. Intended audience

This document is aimed at software developers who have already read the [adopter documentation](../for-adopters) and
want to contribute code to the Eclipse Dataspace Components project.

Its purpose is to explain in greater detail the core concepts of EDC. After reading through it, readers should have a
good understanding of EDCs inner workings, implementation details and some of the advanced concepts.

So if you are a solution architect looking for a high-level description on how to integrate EDC, or a software engineer
who wants to use EDC in their project, then this guide is not for you. More suitable resources can be found
[here](https://eclipse-edc.github.io/docs/#/README) and [here](../for-adopters) respectively.

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
course aware of them and absolutely recommend their use, but we simply cannot cover and explain every possible
combination of OS, tool and tool version.

> Note that Windows is not a supported OS at the moment. If Windows is a must, we recommend using WSL2 or a setting up a
> Linux VM.

### 1.2 Terminology

- runtime: a Java process executing code written in the EDC programming model (e.g. a control plane)
- distribution: a specific combination of modules, compiled into a runnable form, e.g. a fat JAR file, a Docker image
  etc.
- launcher: a runnable Java module, that pulls in other modules to form a distribution. "Launcher" and "distribution"
  are sometimes used synonymously
- connector: a control plane runtime and 1...N data plane runtimes. Sometimes used interchangeably with "distribution".
- consumer: a dataspace participant who wants to ingest data under the access rules imposed by the provider
- provider: a dataspace participant who offers data assets under a set of access rules

### 1.3 Architectural and coding principles

When EDC was originally created, there were a few fundamental architectural principles around which we designed and
implemented all dataspace components. These include:

- **asynchrony**: all external mutations of internal data structures happen in an asynchronous fashion. While the REST
  requests to trigger the mutations may still be synchronous, the actual state changes happen in an asynchronous and
  persistent way. For example starting a contract negotiation through the API will only return the negotiation's ID, and
  the control plane will cyclically advance the negotiation's state.
- **single-thread processing**: the control plane is designed around a set of sequential [state
  machines](#221-state-machines), that employ pessimistic locking to guard against race conditions and other problems.
- **idempotency**: requests, that do not trigger a mutation, are idempotent. The same is true when provisioning external
  resources.
- **error-tolerance**: the design goal of the control plane was to favor correctness and reliability over (low) latency.
  That means, even if a communication partner may not be reachable due to a transient error, it is designed to cope with
  that error and attempt to overcome it.

Prospective contributors to the Eclipse Dataspace Components are well-advised to follow these principles and build their
applications around them.

There are other, less technical principles of EDC such as simplicity and self-contained-ness. We are extremely careful
when adding third-party libraries or technologies to maintain a simple, fast and un-opinionated platform.

Take a look at our [coding principles](../../contributing/coding-principles.md) and our
[styleguide](../../contributing/styleguide.md).

## 2. The control plane

Simply put, the control plane is the brains of a connector. Its tasks include handling protocol and API requests,
managing various internal asynchronous processes, validating policies, performing participant authentication and
delegating the data transfer to a data plane. Its job is to handle (almost) all business logic. For that, it is designed
to favor _reliability_ over _low latency_. It does **not** directly transfer data from source to destination.

The primary way to interact with a connector's control plane is through the Management API, all relevant Java modules
are located at `extensions/control-plane/api/management-api`.

### 2.1 Entities

#### 2.1.1 Assets

Assets are containers for metadata, they do **not** contain the actual bits and bytes. Say you want to offer a file to
the dataspace, that is physically located in an S3 bucket, then the corresponding `Asset` would contain metadata about
it, such as the content type, file size, etc. In addition, it could contain _private_ properties, for when you want to
store properties on the asset, which you _do not want to_ expose to the dataspace. Private properties will get ignored
when serializing assets out over DSP.

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
    "secretKey": "this is secret information, never tell it to the dataspace!"
  },
  "dataAddress": {
    "type": "HttpData",
    "baseUrl": "http://localhost:8080/test"
  }
}
```

The `Asset` also contains a `DataAddress` object, which can be understood as a "pointer into the physical world". It
contains information about where the asset is physically located. This could be a HTTP URL, or a complex object. In the
S3 example, that `DataAddress` might contain the bucket name, region and potentially other information. Notice that the
_schema_ of the `DataAddress` will depend on where the data is physically located, for instance a `HttpDataAddress` has
different properties from an S3 `DataAddress`. More precisely, Assets and DataAddresses are _schemaless_, so there is no
schema enforcement beyond a very basic validation. Read [chapter 2.6](#26-service-layers) to learn about plugging in
custom validators.

A few things must be noted. First, while there isn't a _strict requirement_ for the `@id` to be a UUID, we highly
recommend using the JDK `UUID` implementation.

Second, _never_ store access credentials such as passwords, tokens, keys etc. in the `dataAddress` or even the
`privateProperties` object. While the latter does not get serialized over DSP, both properties are persisted in the
database. Always use a HSM to store the credential, and hold a reference to the secret in the DataAddress. Checkout
[chapter 4](#4-development-best-practices) for details.

By design, Assets are extensible, so users can store any metadata they want in it. For example, the `properties` object
could contain a simple string value, or it could be a complex object, following some custom schema. Be aware, that
unless specified otherwise, all properties are put under the `edc` namespace by default. There are some "well-known"
properties in the `edc` namespace: `id`, `description`, `version`, `name`, `contenttype`.

Here is an example of how an Asset with a custom property following a custom namespace would look like:

```json
{
  "@context": {
    "edc": "https://w3id.org/edc/v0.0.1/ns/",
    "sw": "http://w3id.org/starwars/v0.0.1/ns/"
  },
  "@id": "79d9c360-476b-47e8-8925-0ffbeba5aec2",
  "properties": {
    "faction": "Galactic Imperium",
    "person": {
      "name": "Darth Vader",
      "webpage": "https://death.star"
    }
  }
}
```

(assuming the `sw` context contains appropriate definitions for `faction` and `person`).

Remember that upon ingress through the Management API, all JSON-LD objects get
[expanded](https://www.w3.org/TR/json-ld11/#expanded-document-form), and the control plane only operates on expanded
JSON-LD objects. The Asset above would look like this:

```json
[
  {
    "@id": "79d9c360-476b-47e8-8925-0ffbeba5aec2",
    "https://w3id.org/edc/v0.0.1/ns/properties": [
      {
        "https://w3id.org/starwars/v0.0.1/ns/faction": [
          {
            "@value": "Galactic Imperium"
          }
        ],
        "http://w3id.org/starwars/v0.0.1/ns/person": [
          {
            "http://w3id.org/starwars/v0.0.1/ns/name": [
              {
                "@value": "Darth Vader"
              }
            ],
            "http://w3id.org/starwars/v0.0.1/ns/webpage": [
              {
                "@value": "https://death.star"
              }
            ]
          }
        ]
      }
    ]
  }
]
```

This is important to keep in mind, because it means that Assets get persisted in their expanded form, and operations
performed on them (e.g. querying) in the control plane must also be done on the expanded form. For example, a query
targeting the `sw:faction` field from the example above would look like this:

```json
{
  "https://w3id.org/edc/v0.0.1/ns/filterExpression": [
    {
      "https://w3id.org/edc/v0.0.1/ns/operandLeft": [
        {
          "@value": "https://w3id.org/starwars/v0.0.1/ns/faction"
        }
      ],
      "https://w3id.org/edc/v0.0.1/ns/operator": [
        {
          "@value": "="
        }
      ],
      "https://w3id.org/edc/v0.0.1/ns/operandRight": [
        {
          "@value": "Galactic Imperium"
        }
      ]
    }
  ]
}
```

#### 2.1.2 Policies

Policies are the EDC way of expressing that certain conditions may, must or must not be satisfied in certain situations.
Policies are used to express what requirements a subject (e.g. a communication partner) must fulfill in
order to be able to perform an action. For example, that the communication partner must be headquartered in the European
Union.

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

The `constraint` object expresses logical relationship of a key (`leftOperand`), the value (`righOperand`) and the
`operator`. Multiple constraints can be linked with logical operators, see [advanced policy
concepts](#2125-advanced-policy-concepts). The `leftOperand` and `rightOperand` are completely arbitrary, only the
`operator` is limited to the following possible values: `eq`, `neq`, `gt`, `geq`, `lt`, `leq`, `in`, `hasPart`, `isA`,
`isAllOf`, `isAnyOf`, `isNoneOf`.

Please note that not all operators are always allowed, for example `headquarter_location lt EU` is nonsensical and
should result in an evaluation error, whereas `headquarter_location isAnOf [EU, US]` would be valid. Whether an
`operator` is valid is solely defined by the [policy evaluation function](#2123-policy-evaluation-functions), supplying
an invalid operator should raise an exception.

##### 2.1.2.1 Policy vs PolicyDefinition

In EDC we have two general use cases under which we handle and persist policies:

1. for use in contract definitions
2. during contract negotiations

In the first case policies are ODRL objects and thus must have a `uid` property. They are typically used in contract
definitions.

> Side note: the ODRL context available at `http://www.w3.org/ns/odrl.jsonld` simply defines `uid` as an alias to the
> `@id` property. This means, whether we use `uid` or `@id` doesn't matter, both expand to the same property `@id`.

However in the second case we are dealing with DCAT objects, that have no concept of Offers, Policies or Assets. Rather,
their vocabulary includes Datasets, Dataservices etc. So when deserializing those DCAT objects there is no way to
reconstruct `Policy#uid`, because the JSON-LD structure does not contain it.

To account for this, we defined the `Policy` class as value object that contains rules and other properties. In
addition, we have a `PolicyDefinition` class, which contains a `Policy` and an `id` property, which makes it an
_entity_.

##### 2.1.2.2 Policy scopes and bindings

A policy scope is the "situation", in which a policy is evaluated. For example, a policy may need to be evaluated when a
contract negotiation is attempted. To do that, EDC defines certain points in the code called "scopes" to which policies
are _bound_. These policy scopes (sometimes called policy evaluation points) are static, injecting/adding additional
scopes is not possible. Currently, the following scopes are defined:

- `contract.negotiation`: evaluated upon initial contract offer. Ensures that the consumer fulfills the contract policy.
- `transfer.process`: evaluated before starting a transfer process to ensure that the policy of the [contract
  agreement](#214-contract-agreements) is fulfilled. One example would be contract expiry.
- `catalog`: evaluated when the catalog for a particular participant agent is generated. Decides whether the participant
  has the asset in their catalog.
- `request.contract.negotiation`: evaluated on every request during contract negotiation between two control plane
  runtimes. Not relevant for end users.
- `request.transfer.process`: evaluated on every request during transfer establishment between two control plane
  runtimes. Not relevant for end users.
- `request.catalog`: evaluated upon an incoming catalog request. Not relevant for end users.
- `provision.manifest.verify`: evaluated during the precondition check for resource provisioning. Only relevant in
  advanced use cases.

A policy scope is a string that is used for two purposes:

1. binding a scope to a rule type: implement filtering based on the `action` or the `leftOperand` of a policy. This
   determines for every rule inside a policy whether it should be evaluated in the given scope. In other words, it
   determines _if_ a rule should be evaluated.
2. binding a [policy evaluation function](#2123-policy-evaluation-functions) to a scope: if a policy is determined to be
   "in scope" by the previous step, the policy engine invokes the evaluation function that was bound to the scope to
   evaluate if the policy is fulfilled. In other words, it determines (implements) _how_ a rule should be evaluated.

##### 2.1.2.3 Policy evaluation functions

If policies are a formalized declaration of requirements, policy evaluation functions are the means to evaluate those
requirements. They are pieces of Java code executed at runtime. A policy on its own only _expresses_ the requirement,
but in order to enforce it, we need to run policy evaluation functions.

Upon evaluation, they receive the operator, the `rightOperand` (or _rightValue_), the rule, and the `PolicyContext`. A
simple evaluation function that asserts the headquarters policy mentioned in the example above could look similar to
this:

```java
import org.eclipse.edc.policy.engine.spi.AtomicConstraintFunction;

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

This particular evaluation function only accepts `eq` as operator, and only accepts scalars as `rightValue`, no list
types.

The `ParticipantAgent` is a representation of the communication counterparty that contains a set of verified claims. In
the example, `extractLocationClaim()` would look for a claim that contains the location of the agent and return it as
string. This can get quite complex, for example, the claim could contain geo-coordinates, and the evaluation function
would have to perform inverse address geocoding.

Other policies may require other context data than the participant's location, for example an exact timestamp, or may
even need a lookup in some third party system such as a customer database.

The same policy can be evaluated by different evaluation functions, if they are meaningful in different contexts
([scopes](#2122-policy-scopes-and-bindings)).

> NB: to write evaluation code for policies, implement the `org.eclipse.edc.policy.engine.spi.AtomicConstraintFunction`
> interface. There is a second interface with the same name, but that is only used for internal use in the
> `PolicyEvaluationEngine`.

##### 2.1.2.4 Example: binding an evaluation function

As we've learned, for a policy to be evaluated at certain [points](#2122-policy-scopes-and-bindings), we need to create
a policy (duh!), bind the policy to a scope, create a [policy evaluation function](#2123-policy-evaluation-functions),
and we need to bind the function to the same scope. The standard way of registering and binding policies is done in an
[extension](#24-extension-model). For example, here we configure our `HeadquarterFunction` so that it evaluates our
`headquarter_location` function whenever someone tries to negotiate a contract:

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

The code does two things: it _binds_ the function key (= the leftOperand) to the negotiation scope, which means that the
policy is "relevant" in that scope. Further, it binds the evaluation function to the same scope, which means the policy
engine "finds" the function and executes it in the negotiation scope.

This example assumes, a policy object exists in the system, that has a `leftOperand = headquarter_location`. For details
on how to create policies, please check out the [OpenAPI
documentation](https://eclipse-edc.github.io/Connector/openapi/management-api/#/Policy%20Definition/createPolicyDefinition).

##### 2.1.2.5 Advanced policy concepts

###### Pre- and Post-Evaluators

Pre- and post-validators are functions that are executed before and after the actual policy evaluation, respectively.
They can be used to perform preliminary evaluation of a policy or to enrich the `PolicyContext`. For example, EDC uses
pre-validators to inject DCP scope strings using dedicated `ScopeExtractor` objects.

###### Dynamic functions

These are very similar to `AtomicConstraintFunctions`, with one significant difference: they also receive the
left-operand as function parameter. This is useful when the function cannot be bound to a left-operand of a policy,
because the left-operand is not known in advance.

Let's revisit our headquarter policy from earlier and change it a little:

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
          "or": [
            {
              "leftOperand": "headquarter.location",
              "operator": "eq",
              "rightOperand": "EU"
            },
            {
              "leftOperand": "headerquarter.numEmployees",
              "operator": "gt",
              "rightOperand": 5000
            }
          ]
        }
      }
    ]
  }
}
```

This means two things. One, our policy has changed its semantics: now we require the headquarter to be in the EU, or to
have more than 5000 employees.

#### 2.1.3 Contract definitions

Contract definitions are how [assets](#211-assets) and [policies](#212-policies) are linked together. It is EDC's way of
expressing which policies are in effect for an asset. So when an asset (or several assets) are offered in the dataspace,
a contract definition is used to express under what conditions they are offered. Those conditions are comprised of a
_contract policy_ and an _access policy_. The _access policy_ determines, whether a participant will even get the offer,
and the contract policy determines whether they can negotiate a contract for it. Those policies are referenced by ID,
but foreign-key constrainta are not enforced. This means that contract definitions can be created _ahead of time_.

It is important to note that contract definitions are _implementation details_ (i.e. _internal objects_), which means
they **never** leave the realm of the provider, and they are **never** sent to the consumer via DSP.

- **access policy**: determines whether a particular consumer is offered an asset when making a catalog request. For
  example, we may want to restrict certain assets such that only consumers within a particular geography can see them.
  Consumers outside that geography wouldn't even have them in their catalog.
- **contract policy**: determines the conditions for initiating a contract negotiation for a particular asset. Note that
  this only guarantees the successful _initiation_ of a contract negotiation, it does not automatically guarantee the
  successful _conclusion_ of it!

Contract definitions also contain an `assetsSelector`. THat is a query expression that defines all the assets that are
included in the definition, like an SQL `SELECT` statement. With that it is possible to configure the same set of
conditions (= access policy and contract policy) for a multitude of assets.

Please note that creating an `assetSelector` may require knowledge about the shape of an Asset and can get complex
fairly quickly, so be sure to read the chapter about [querying](#215-querying-with-queryspec-and-criterion).

Here is an example of a contract definition, that defines an access policy and a contract policy for assets `id1`, `id2`
and `id3` that must contain the `"foo" : "bar"` property.

```json
{
  "@context": {
    "edc": "https://w3id.org/edc/v0.0.1/ns/"
  },
  "@type": "https://w3id.org/edc/v0.0.1/ns/ContractDefinition",
  "@id": "test-id",
  "edc:accessPolicyId": "access-policy-1234",
  "edc:contractPolicyId": "contract-policy-5678",
  "edc:assetsSelector": [
    {
      "@type": "https://w3id.org/edc/v0.0.1/ns/Criterion",
      "edc:operandLeft": "id",
      "edc:operator": "in",
      "edc:operandRight": ["id1", "id2", "id3"]
    },
    {
      "@type": "https://w3id.org/edc/v0.0.1/ns/Criterion",
      "edc:operandLeft": "foo",
      "edc:operator": "=",
      "edc:operandRight": "bar"
    }
  ]
}
```

The sample expresses that a set of assets identified by their ID be made available under the access policy
`access-policy-1234` and contract policy `contract-policy-5678`, if they contain a property `"foo" : "bar"`.

> Note that asset selector expressions are always logically conjoined using an "AND" operation.

#### 2.1.4 Contract agreements

Once a contract negotiation is successfully concluded (i.e. it reaches the `FINALIZED` state), it "turns into" a
contract agreement. It is always the provider connector that gives the final approval. Contract agreements are
immutable objects that contain the final, agreed-on policy, the ID of the asset that the contract was negotiated for,
the IDs of the negotiation parties and the exact signing date.

> Note that in future iterations contracts will be cryptographically signed to further support the need for
> immutability and non-repudiation.

Like contract definitions, contract agreements are entities that only exist within the bounds of a connector.

_About terminating contracts:_ once a contract negotiation has reached a [terminal
state](https://docs.internationaldataspaces.org/ids-knowledgebase/v/dataspace-protocol/contract-negotiation/contract.negotiation.protocol#id-1.2-state-machine)
`TERMINATED` or `FINALIZED`, it becomes immutable. This could be compared to not being able to scratch a signature off a
physical paper contract. Cancelling or terminating a contract is therefor handled through other channels like eventing
systems. The semantics of cancelling a contract are highly individual to each dataspace and may even bring legal side
effects, so EDC cannot make an assumption here.

#### 2.1.5 Catalog

The catalog contains the "data offerings" of a connector and one or multiple service endpoints to initiate a negotiation
for those offerings.

Every data offering is represented by a [`Dataset` object](https://www.w3.org/TR/vocab-dcat-2/#Class:Dataset) which
contains a [policy](#212-policies) and one or multiple [`Distribution`
objects](https://www.w3.org/TR/vocab-dcat-2/#Class:Distribution). A `Distribution` should be understood as a _variant_
or _representation_ of the `Dataset`. For instance, if a file is accessible via multiple transmission channels from a
provider (HTTP and FTP), then each of those channels would be represented as a `Distribution`. Another example would be
image assets that are available in different file formats (PNG, TIFF, JPEG).

A [`DataService` object](https://www.w3.org/TR/vocab-dcat-2/#Class:Data_Service) specifies the endpoint where contract
negotiations and transfers are accepted by the provider. In practice, this will be the DSP endpoint of the connector.

The following example shows an HTTP response to a catalog request, that contains one offer that is available via two channels `HttpData-PUSH` and `HttpData-PULL`.

<details>
  <summary>catalog example</summary>

```json
{
  "@id": "567bf428-81d0-442b-bdc8-437ed46592c9",
  "@type": "dcat:Catalog",
  "dcat:dataset": [
    {
      "@id": "asset-2",
      "@type": "dcat:Dataset",
      "odrl:hasPolicy": {
        "@id": "c2Vuc2l0aXZlLW9ubHktZGVm:YXNzZXQtMg==:MzhiYzZkNjctMDIyNi00OGJjLWFmNWYtZTQ2ZjAwYTQzOWI2",
        "@type": "odrl:Offer",
        "odrl:permission": [],
        "odrl:prohibition": [],
        "odrl:obligation": {
          "odrl:action": {
            "@id": "use"
          },
          "odrl:constraint": {
            "odrl:leftOperand": {
              "@id": "DataAccess.level"
            },
            "odrl:operator": {
              "@id": "odrl:eq"
            },
            "odrl:rightOperand": "sensitive"
          }
        }
      },
      "dcat:distribution": [
        {
          "@type": "dcat:Distribution",
          "dct:format": {
            "@id": "HttpData-PULL"
          },
          "dcat:accessService": {
            "@id": "a6c7f3a3-8340-41a7-8154-95c6b5585532",
            "@type": "dcat:DataService",
            "dcat:endpointDescription": "dspace:connector",
            "dcat:endpointUrl": "http://localhost:8192/api/dsp",
            "dct:terms": "dspace:connector",
            "dct:endpointUrl": "http://localhost:8192/api/dsp"
          }
        },
        {
          "@type": "dcat:Distribution",
          "dct:format": {
            "@id": "HttpData-PUSH"
          },
          "dcat:accessService": {
            "@id": "a6c7f3a3-8340-41a7-8154-95c6b5585532",
            "@type": "dcat:DataService",
            "dcat:endpointDescription": "dspace:connector",
            "dcat:endpointUrl": "http://localhost:8192/api/dsp",
            "dct:terms": "dspace:connector",
            "dct:endpointUrl": "http://localhost:8192/api/dsp"
          }
        }
      ],
      "description": "This asset requires Membership to view and SensitiveData credential to negotiate.",
      "id": "asset-2"
    }
  ],
  "dcat:distribution": [],
  "dcat:service": {
    "@id": "a6c7f3a3-8340-41a7-8154-95c6b5585532",
    "@type": "dcat:DataService",
    "dcat:endpointDescription": "dspace:connector",
    "dcat:endpointUrl": "http://localhost:8192/api/dsp",
    "dct:terms": "dspace:connector",
    "dct:endpointUrl": "http://localhost:8192/api/dsp"
  },
  "dspace:participantId": "did:web:localhost%3A7093",
  "participantId": "did:web:localhost%3A7093",
  "@context": {}
}
```

</details>
<br/>

Catalogs are ephemeral objects, they are not persisted or cached on the provider side. Everytime a consumer participant
makes a catalog request through DSP, the connector runtime has to evaluate the incoming request and build up the catalog
specifically for that participant. The reason for this is that between two subsequent requests from the same
participant, the contract definition or the claims or the participant could have changed.

The relevant component in EDC is the `DatasetResolver`, which resolves all contract definitions that are relevant to a
participant filtering out those where the participant does not satisfy the access policy and collects all the assets
therein.

In order to determine how an asset can be _distributed_, the resolver requires knowledge about the data planes that are
available. It uses the [Dataplane Signaling Protocol](#29-data-plane-signaling) to query them and construct the list of
`Distributions` for an asset.

> For details about the FederatedCatalog, please refer to its [documentation](https://github.com/eclipse-edc/FederatedCatalog/).

#### 2.1.5 Querying with `QuerySpec` and `Criterion`

explain query specs, criterion default in-mem stores, predicate converters,
CriterionOperatorRegistry, ReflectionBasedQueryResolver

### 2.2 Programming Primitives

This chapter describes the fundamental architectural and programming paradigms that are used in EDC. Typically, they
are not related to one single extension or feature area, they are of overarching character.

#### 2.2.1 State machines

EDC is asynchronous by design, which means that processes are processed in such a way that they don't block neither the
runtime nor the caller. For example starting a contract negotiation is a long-running process and every contract
negotiation has to traverse a series of
[states](https://docs.internationaldataspaces.org/ids-knowledgebase/v/dataspace-protocol/contract-negotiation/contract.negotiation.protocol#id-1.2-state-machine),
most of which involve sending remote messages to the counter party. These state transitions are not guaranteed to happen
within a certain time frame, they could take hours or even days.

From that it follows that an EDC instance must be regarded as ephemeral (= they can't hold state in memory), so the
state (of a contract negotiation) must be held in persistent storage. This makes it possible to start and stop connector
runtimes arbitrarily, and every replica picks up where the other left off, without causing conflicts or processing an
entity twice.

The state machine itself is synchronous: in every iteration it processes a number of objects and then either goes back
to sleep, if there was nothing to process, or continues right away.

At a high level this is implemented in the `StateMachineManager`, which uses a set of `Processor`s. The
`StateMachineManager` sequentially invokes each `Processor`, who then reports the number of processed entities. In EDC's
state machines, processors are functions who handle `StatefulEntities` in a particular state and are registered when the
application starts up:

```java
// ProviderContractNegotiationManagerImpl.java

@Override
protected StateMachineManager.Builder configureStateMachineManager(StateMachineManager.Builder builder) {
    return builder
        .processor(processNegotiationsInState(OFFERING, this::processOffering))
        .processor(processNegotiationsInState(REQUESTED, this::processRequested))
        .processor(processNegotiationsInState(ACCEPTED, this::processAccepted))
        .processor(processNegotiationsInState(AGREEING, this::processAgreeing))
        .processor(processNegotiationsInState(VERIFIED, this::processVerified))
        .processor(processNegotiationsInState(FINALIZING, this::processFinalizing))
        .processor(processNegotiationsInState(TERMINATING, this::processTerminating));
}

```

This instantiates a `Processor` that binds a given state to a callback function. For example `AGREEING` ->
`this::processAgreeing`. When the `StateMachineManager` invokes this `Processor`, it loads all contract negotiations in
that state (here: `AGREEING`) and passes each one to the `processAgreeing` method. 

All processors are invoked sequentially, because it is possible that one single entity transitions to multiple states in
the same iteration.

##### 2.2.1.1 Batch-size, sorting and tick-over timeout

In every iteration the state machine loads multiple `StatefulEntity` objects from the database. To avoid overwhelming
the state machine and to prevent entites from becoming stale, two main safeguards are in place:
- batch-size: this is the maximum amount of entities per state that are fetched from the database
- sorting: `StatefulEntity` objects are sorted based on when their state was last updated, oldest first. 
- iteration timeout: if no `StatefulEntities` were processed, the statemachine simply yields for a configurable amount of time.

##### 2.2.1.2 Database-level locking

In production deployments the control plane is typically replicated over several instances for performance and
robustness. This must be considered when loading `StatefulEntity` objects from the database, because it is possible that
two replicas attempt to load the same entity at the same time, which - without locks - would lead to a race condition,
data inconsistencies, duplicated DSP messages and other problems.

To avoid this, EDC employs pessimistic exclusive locks on the database level for stateful entities, which are called
`Lease`. These are entries in a database that indicate whether an entity is currently leased, whether the lease is
expired and which replica leased the entity. Attempting to acquire a lease for an already-leased entity is only possible if the
lease holder is the same.

> Note that the value of the `edc.runtime.id` property is used to record the holder of a `Lease`. It is _recommended not
> to configure_ this property in clustered environments so that randomized runtime IDs (= default) are used.

Generally the process is as follows:
- load `N` "leasable" entities and acquire a lease for each one. An entity is considered "leasable" if it is not already
  leased, or the current runtime already holds the lease, or the lease is expired.
- if the entity was processed, advance state, free the lease
- if the entity was not processed, free the lease

That way, each replica of the control plane holds an exclusive lock for a particular entity while it is trying to
process and advance its state. 


#### 2.2.2 Transformers

EDC uses JSON-LD serialization on API ingress and egress. For information about this can be found [in this
chapter](#23-serialization-via-json-ld), but the TL;DR is that it is necessary because of extensible properties and
namespaces on wire-level DTOs. 

##### 2.2.2.1 Basic Serialization and Deserialization
On API ingress and egress this means that conventional serialization and deserialization ("SerDes") cannot be achieved
with Jackson, because Jackson operates on a configurable, but ultimately rigid schema.

For that reason, EDC implements its own SerDes layer, called "transformers". The common base class for all transformers
is the `AbstractJsonLdTransformer<I,O>` and the naming convention is `JsonObject[To|From]<Entity>Transformer` for
example `JsonObjectToAssetTransformer`. They typically come in pairs, to enable both serialization and deserialization.

Another rule is that the entity class must contain the fully-qualified (expanded) property names as constants and typical programming patterns are:
- deserialization: transformers contain a `switch` statement that parses the property names and populates the entity's builder.
- serialization: transformers simply construct the `JsonObject` based on the properties of the entity using a `JsonObjectBuilder`

##### 2.2.2.1 Transformer context

Many entities in EDC are complex objects that contain other complex objects. For example, a `ContractDefinition`
contains the asset selector, which is a `List<Criterion>`. However, a `Criterion` is also used in a `QuerySpec`, so it
makes sense to extract its deserialization into a dedicated transformer. So when the
`JsonObjectFromContractDefinitionTransformer` encounters the asset selector property in the JSON structure, it delegates
its deserialization back to the `TransformerContext`, which holds a global list of type transformers (`TypeTransformerRegistry`). 

As a general rule of thumb, a transformer should only deserialize first-order properties, and nested complex objects
should be delegated back to the `TransformerContext`.

Every module that contains a type transformer should register it with the `TypeTransformerRegistry` in its accompanying extension:

```java
@Inject
private TypeTransformerRegistry typeTransformerRegistry;

@Override
public void initialize(ServiceExtensionContext context){
  typeTransformerRegistry.register(new JsonObjectToYourEntityTransformer());
}
```
##### 2.2.2.2 Segmented transformer registries

One might encounter situations, where different serialization formats are required for the same entity, for example
`DataAddress` objects are serialized differently on the [Signaling API](#29-data-plane-signaling) and the [DSP
API](#27-protocol-extensions-dsp).

If we would simply register both transformers with the transformer registry, the second registration would overwrite the
first, because both transformers have the same input and output types:

```java
public class JsonObjectFromDataAddressTransformer extends AbstractJsonLdTransformer<DataAddress, JsonObject> {
  //...
}

public class JsonObjectFromDataAddressDspaceTransformer extends AbstractJsonLdTransformer<DataAddress, JsonObject> {
  //...
}
```

Consequently, all `DataAddress` objects would get serialized in the same way.

To overcome this limitation, EDC has the concept of _segmented_ transformer registries, where the segment is defined by
a string called a "context": 

```java
@Inject
private TypeTransformerRegistry typeTransformerRegistry;

@Override
public void initialize(ServiceExtensionContext context){
  var signalingApiRegistry = typeTransformerRegistry.forContext("signaling-api");
  signalingApiRegistry.register(new JsonObjectFromDataAddressDspaceTransformer(/*arguments*/));

  var dspRegistry = typeTransformerRegistry.forContext("dsp-api");
  dspRegistry.register(new JsonObjectToDataAddressTransformer());
}
```
_Note that this example serves for illustration purposes only!_

Usually, transformation happens in API controllers to deserialize input, process and serialize output, but controllers
don't use transformers directly because more than one transformer may be required to correctly deserialize an object.
Rather, they have a reference to a `TypeTransformerRegistry` for this. For more information please refer to the [chapter
about service layers](#26-service-layers).

##### 2.2.2.3 Reporting transformation errors

Generally speaking, input validation should be performed by [validators](#262-validators). However, it is still possible
that an object cannot be serialized/deserialized correctly, for example when a property has has the wrong type, wrong
multiplicity, cannot be parsed, unknown property, etc. Those types of errors should be reported to the
`TransformerContext`:

```java
// JsonObjectToDataPlaneInstanceTransformer.java
private void transformProperties(String key, JsonValue jsonValue, DataPlaneInstance.Builder builder, TransformerContext context) {
    switch (key) {
        case URL -> {
            try {
                builder.url(new URL(Objects.requireNonNull(transformString(jsonValue, context))));
            } catch (MalformedURLException e) {
                context.reportProblem(e.getMessage());
            }
        }
    // other properties
    }
}
```
Transformers should report errors to the context instead of throwing exceptions. Please note that basic JSON validation should be performed by [validators](#262-validators).


#### 2.2.3 Token generation and decorators

#### 2.2.4 Token validation and rules

### 2.3 Serialization via JSON-LD

why its needed, why we sometimes use Jackson SerDes, ingress = expanded, egress = compacted, validation

### 2.4 Extension model

details about metamodel annotations, (api authentication) registries, configuration best practices

### 2.5 Dependency injection deep dive

details regarding `@Provides`, `@Provider`, `@Requires`, `@Inject` defaults of default providers (e.g. resolution on
demand) dependency graph lifecycle best practices

### 2.6 Service layers

#### 2.6.1 API controllers
```java
@Consumes({ MediaType.APPLICATION_JSON })
@Produces({ MediaType.APPLICATION_JSON })
@Path("/v1/foo/bar")
public class SomeApiObjectController {

    private final TypeTransformerRegistry typeTransformerRegistry;

    public SomeApiObjectController(TypeTransformerRegistry typeTransformerRegistry) {
        this.typeTransformerRegistry = typeTransformerRegistry;
    }

    @POST
    @Override
    public JsonObject create(JsonObject someApiObject) {
      // deserialize JSON -> SomeApiObject
      var someApiObject = typeTransformerRegistry.transform(dataFlowStartMessage, SomeApiObject.class)
                .onFailure(f -> /*log warning*/)
                .orElseThrow(InvalidRequestException::new);

      var processedObject = someService.process(someApiObject);

      // serialize SomeApiObject -> JSON
      return typeTransformerRegistry.transform(processedObject, JsonObject.class)
                .orElseThrow(f -> new EdcException(f.getFailureDetail()));
    }
}
```

#### 2.6.2 Validators

#### 2.6.3 Transformers

#### 2.6.4 Aggregate services

The above example 
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

### 4.1 Writing Unit-, Component-, Integration-, Api-, EndToEnd-Tests

test pyramid...

### 4.1 Other best practices

-> link to best practices doc

## 5. Further concepts

### 4.3 Autodoc

### 4.4 Adapting the Gradle build
