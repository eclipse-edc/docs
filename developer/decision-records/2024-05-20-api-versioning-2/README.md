# Consistent Versioning of external APIs (cont'd)

_This Decision Record is an Addendum
to [2023-11-09-api-versioning](https://github.com/eclipse-edc/Connector/tree/main/docs/developer/decision-records/2023-11-09-api-versioning)
and builds partly
on [2022-11-09-api-refactoring](https://github.com/eclipse-edc/Connector/tree/main/docs/developer/decision-records/2022-11-09-api-refactoring).
All statements made there remain valid here, unless stated otherwise_.

## Decision

All Eclipse Dataspace Components that expose an API must adhere to the rules outlined in this document with regard to
versioning,
grouping and lifecycle.

## Rationale

As the EDC project matures, there are certain expectations that consumers (i.e. client applications) have towards the
EDC in terms of API stability. This document aims at settings those expectations and providing a clear guideline and
contract for all outward-facing APIs.

_Note: this solely refers to remote APIs, e.g. REST, not code-level interfaces. We typically call them SPIs._

## Approach

### Grouping of APIs

EDC and its interrelated components have multiple APIs each, all of which fulfill different objectives, have different
with regard to security, network protection and authentication/authorization.

This section outlines the different groups (or "contexts") of APIs that currently exist in the Connector project, with
the notable exclusions of DSP and the `"version"` context.

1. the `"management"` context: contains all endpoints that allow manipulating the business objects of EDC, such as
   Assets, Policies etc. This API is not intended for internet-facing deployments, and
   requires [additional protection](../../best-practices.md#11-exposing-apis-to-the-internet).
2. the `"observability"` context: contains the Observability endpoints that are intended to track the application health
   in containerized deployments, similar
   to [Kubernetes readiness probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/).
3. the `"control"` context: contains endpoints that are not intended to be client-consumable, but are designed for
   component-to-component interaction, for
   example [Dataplane Signaling](https://github.com/eclipse-edc/Connector/tree/main/docs/developer/decision-records/2023-12-12-dataplane-signaling)
   between controlplane and dataplane.
4. the `"public"` context: this is the public-facing endpoint(s), that the dataplane exposes during HTTP-PULL transfers.
5. the `"sts"` context: the endpoints that are exposed by the Secure Token Service fall in this group
6. the `"version"` context: contains the endpoint to access version information,
   see [this section](#accessing-versioning-information) for details.

While every API group (or "context") has its own version, all of them adhere to the same progression and
deprecation model as well as the same maturity levels. All endpoints of one particular group are reachable using the
same base path, including the version segment (e.g. `/api/management/v4/...`).

_Note that this decision record only mentions APIs of the connector, but the assertions and statements hold true for
other components as well. APIs of other components, even if their semantics are similar (e.g. "managment"), are
technically separate groups/contexts._

### Types and Maturity levels of APIs

Generally, we distinguish between three types or maturity levels of APIs:

1. _stable_: this is the most recent version of an API, that receives regular maintenance updates and has gone through
   several iterations of development. We strongly advise client applications be developed against or upgraded to this
   version.
2. _deprecated_: this is the outdated and thus outgoing version of an API. Once an API group is marked `deprecated` it
   will receive no more maintenance. In the case of a severe incident, it is likely to be removed rather than
   maintained. Client applications using this type of application should upgrade at the earliest possibility.
3. _unstable_: APIs that are not yet fully tested or are otherwise not deemed production-ready fall in this group.
   Unstable APIs have no reliability contract whatsoever, they can be changed or removed at any time and without prior
   notice. They also are not subject to the deprecation policy.

All these maturity levels are accessible through individual URL paths, for example `/v3/` (stable), `/v2` (deprecated),
and `/v4alpha` (unstable).

### Versioning scheme, API contract and lifecycle model

#### Graduating to _stable_

New APIs, breaking changes and other new major features are first deployed to the _unstable_ level, where they remain
until they are deemed stable by the EDC technical committee. Unstable APIs can be changed or removed at any time without
prior notice, they are intended for test deployments, and to give client code early access to upcoming features.

Note that this does _not_ include maintenance, such as patches, bug fixes and minor improvements. Those will be
deployed to the stable group, using the SemVer patch version.

When an API is deemed mature enough to graduate to the _stable_ level, it will effectively replace the current _stable_
API while increasing the version number in the URL path. The current _stable_ API becomes _deprecated_ effectively
replacing the current _deprecated_ API.

For example, the current `/v3` API becomes deprecated, the `/v4beta` API becomes the stable `/v4` API. There might not
yet be a new unstable `/v5alpha` version of the API.

#### Deprecating APIs

Once an unstable API graduates to the _stable_ level, the current _stable_ API becomes _deprecated_.

#### Removing _deprecated_ APIs

Once an API is moved to the _deprecated_ level, the EDC project will make a best-effort to keep it in the code base for
a grace period of at least **two milestone releases**. During this time the API is marked `deprecated` and client
applications should upgrade to the _stable_ level as soon as possible.

After this grace period, the _deprecated_ API will get removed from the code base. Note that at that time, the stable
API may still remain in place unchanged.

Note also, that there may be circumstances, where the grace period **cannot** be observed. Those cases will be announced
in the appropriate channels.

#### Deprecation policy

- _deprecated_ APIs remain available for at least **two milestone releases** after being deprecated before they are
  deleted
- there is no guarantee how long an API remains at the _stable_ level
- there is no guarantee at all w.r.t to _unstable_ APIs

### Accessing versioning information

A new `"version"` context will be introduced that contains the Version Information API. The purpose of this API is to
provide version information about each API that is deployed in the current runtime. With a simple `GET` request users
can obtain that information:

```shell
GET /api/version
```

returns a response like the following:

```json
{
  "management": [
    {
      "maturity": "stable",
      "version": "3.0.0",
      "urlPath": "/v3",
      "last_updated": "2024-05-20T14:02:41Z"
    },
    {
      "maturity": "deprecated",
      "version": "2.0.4",
      "urlPath": "/v2",
      "deprecated_since": "0.6.2",
      "last_updated": "2023-06-18T18:00:00Z"
    }
  ],
  "control": [
    {
      "maturity": "stable",
      "version": "1.0.2",
      "urlPath": "/v1",
      "last_updated": "2023-01-01T12:00:00Z"
    }
  ]
}
```

Every API group that is contained in the current runtime, including the `"version"` context with the Version Information
API, is represented in the response.

The implementation of this feature will follow a similar approach as the health status providers: every API group
contributes a version
record into a central directory, which is then exposed via the aforementioned API.

Note that the `deprecated_since` field is only available in _deprecated_ APIs and refers to the EDC version tag when it
was deprecated. From this, clients can easily derive the expected time of deletion.

#### Version record schema

```java
public record VersionRecord(String maturity, String version, String urlPath, Instant lastUpdated,
                            @Nullable String deprecatedSince) {
}
```

### Runtime view of APIs

From a runtime perspective, we will keep all versions of an API in the _same_ Java module (as opposed to: in separate
modules).
That way it can be guaranteed that all available maturity levels of an API are accessible at runtime.

_Unstable_ APIs are not deployed by default, they can be activated with a config switch:

```properties
web.http.management.unstable=true
```

This would make the _unstable_ variant of the Management API available at runtime

### Further considerations

- controller `@Path` annotations should **include** the version string, e.g. `@Path("/v4/assets")`
- context configurations in properties files should **not** include versions