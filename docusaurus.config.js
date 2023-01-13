// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'My Site',
  tagline: 'Dinosaurs are cool',
  url: 'https://FraunhoferISST.github.io',
  baseUrl: '/edc-docs/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'FraunhoferISST', // Usually your GitHub org/user name.
  projectName: 'edc-docs', // Usually your repo name.
  deploymentBranch: "gh-pages",

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
          'https://github.com/FraunhoferISST/edc-docs/tree/master',

        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/FraunhoferISST/edc-docs/tree/master',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({

      navbar: {
        title: '',
        logo: {
          alt: 'My Site Logo',
          src: 'img/icon.png',
        },
        items: [
          {
            type: 'doc',
            docId: 'README',
            position: 'left',
            label: 'Docs',
           // to: "sidebar.md"
            //to: "/docs"
          },
          {
            to: 'blog',
            docId: 'README',
            position: 'left',
            label: 'Blog',
            // to: "sidebar.md"
            //to: "/docs"
          },
          {
            href: 'https://github.com/eclipse-edc',
            label: 'GitHub',
            position: 'right',
          },
          {
            href: 'https://search.maven.org/search?q=g:org.eclipse.edc',
            label: 'Maven Central',
            position: 'right',
          },

          {
            href: 'https://app.swaggerhub.com/search?owner=eclipse-edc-bot',
            label: 'SwaggerHub',
            position: 'right',
          },

        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            label: 'Contact',
            href: 'https://projects.eclipse.org/projects/technology.edc/contact'
          },

          {
            label: 'Youtube',
            href: 'https://www.youtube.com/channel/UCYmjEHtMSzycheBB4AeITHg'
          },
          {
            label: 'EF Project',
            href: 'https://projects.eclipse.org/projects/technology.edc'

          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Eclipse Dataspace Components, built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;