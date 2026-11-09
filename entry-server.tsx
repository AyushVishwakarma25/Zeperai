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
import { BackgroundRemoverLandingPage } from './src/landing/BackgroundRemoverLandingPage.js';
import { NicheBackgroundRemoverPage } from './src/landing/NicheBackgroundRemoverPage.js';
import { ToolsHubPage } from './src/landing/ToolsHubPage.js';
import { RoasRtoCalculatorPage } from './src/landing/RoasRtoCalculatorPage.js';
import { CreativeFatigueCalculatorPage } from './src/landing/CreativeFatigueCalculatorPage.js';
import { QuickCommerceCalculatorPage } from './src/landing/QuickCommerceCalculatorPage.js';
import { ALL_NICHE_SLUGS } from './src/data/backgroundRemoverNiches.js';

const routeComponents: Record<string, React.FC<any>> = {
  '/': LandingPage,
  '/pricing': PricingPage,
  '/about': AboutUsPage,
  '/contact': ContactPage,
  '/tools': ToolsHubPage,
  '/tools/roas-rto-calculator': RoasRtoCalculatorPage,
  '/tools/meta-creative-fatigue': CreativeFatigueCalculatorPage,
  '/tools/quick-commerce-margin-calculator': QuickCommerceCalculatorPage,
  '/tools/background-remover': BackgroundRemoverLandingPage,
  '/terms': TermsPage,
  '/privacy': PrivacyPolicyPage,
  '/cookies': CookiePolicyPage,
};

// Register all 50+ programmatic niche routes for static pre-rendering
for (const slug of ALL_NICHE_SLUGS) {
  const routePath = `/tools/remove-background-for-${slug}`;
  routeComponents[routePath] = () => React.createElement(NicheBackgroundRemoverPage, { forcedSlug: slug });
}

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
