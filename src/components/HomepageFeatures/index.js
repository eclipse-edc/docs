import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Data Space',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
          Data spaces allow organizations to securely share data with others.
          They enable data cooperation in a multi-cloud federation by focusing on identity,
          sovereignty, and interoperability.
      </>
    ),
  },
  {
    title: 'Data space connector',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
          a connector component is used to participate in a data space and mainly
          focuses on these aspects while ensuring data sovereignty
          along the entire data supply and value chain.
      </>
    ),
  },
  {
    title: 'Identity Provider',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
          The International Data Spaces offer cross-company identity management according
          to modern standards and with low organizational requirements.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
