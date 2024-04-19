# Decision separation build pipelines for Technology Repositories

## Decision

We will separate the build and release pipelines for the Technology-* repositories. That means, that continuous builds, nightly builds and release builds can technically happen separate from the core components builds.

To achieve that, every technolgy repo will get its own Maven sub-group-id: 
- Technology-Azure: `org.eclipse.edc.azure`
- Technology-Aws: `org.eclipse.edc.aws`
- Technology-Gcp: `org.eclipse.edc.gcp`
- (Technology-Huawei: `org.eclipse.edc.huawei`)

As a convention, the version numbering across _all_ repositories will remain consistent.


## Rationale

Maintenance and upkeep for the Technology repositories is currently handled by the committers of the EDC project, for whom this has become a substantial time and resources investment.
In an effort to re-allocate these resources to the core components, we want to decouple the release processes of the Technology repositories. That way, when the builds fail, for example due to a breaking change in an SPI, or some other compile-time problem, the release of the core components is not blocked.

In addition, a process should be started to create dedicated specialist teams in those cloud provider companies, who over time build trust with the community and gain traction with the project, so that they can eventually take over the maintenance for the Technology repositories. This will also help bolster and foster the community of EDC.

It is understood that that is a lengthy process, but one that should start sooner rather than later.

## Approach

Several things are necessary to achieve that modularization:
- removing the Technology repositories from the build scripts in the Release repository. This will exclude them from the nightly and release builds.
- add Maven sub-group-ids
- create a GitHub workflow that publishes to OSSRH Staging / MavenCentral, bumps versions, etc.
- 
