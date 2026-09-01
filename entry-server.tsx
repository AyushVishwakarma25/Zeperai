// entry-server.tsx
// Used ONLY by prerender.mjs (a build-time script). Not shipped to the
// browser, not imported by index.tsx, and does not change client behavior
// in any way.

import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext.js';
import { DesignsProvider } from './contexts/DesignsContext.js';

import { LandingPage } from './src/landing/LandingPage.js';
import { PricingPage } from './src/landing/PricingPage.js';
import { AboutUsPage } from './src/landing/AboutUsPage.js';
import { ContactPage } from './src/landing/ContactPage.js';
import { TermsPage } from './src/landing/TermsPage.js';
import { PrivacyPolicyPage } from './src/landing/PrivacyPolicyPage.js';
import { CookiePolicyPage } from './src/landing/CookiePolicyPage.js';
import { BlogPage } from './src/landing/BlogPage.js';
import { BackgroundRemoverLandingPage } from './src/landing/BackgroundRemoverLandingPage.js';

const routeComponents: Record<string, React.FC<any>> = {
  '/': LandingPage,
  '/pricing': PricingPage,
  '/about': AboutUsPage,
  '/contact': ContactPage,
  '/blog': BlogPage,
  '/tools/background-remover': BackgroundRemoverLandingPage,
  '/background-remover': BackgroundRemoverLandingPage,
  '/terms': TermsPage,
  '/privacy': PrivacyPolicyPage,
  '/cookies': CookiePolicyPage,
};

export const prerenderRoutes = Object.keys(routeComponents);

export function render(url: string) {
  const Component = routeComponents[url];
  if (!Component) {
    throw new Error(`entry-server: no component registered for route "${url}"`);
  }

  const helmetContext: { helmet?: any } = {};

  const html = renderToString(
    React.createElement(
      HelmetProvider,
      { context: helmetContext },
      React.createElement(
        StaticRouter as any,
        { location: url },
        React.createElement(
          AuthProvider,
          null,
          React.createElement(DesignsProvider, null, React.createElement(Component))
        )
      )
    )
  );

  return { html, helmet: helmetContext.helmet };
}
