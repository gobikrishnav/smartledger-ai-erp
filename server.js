/**
 * SmartLedger AI ERP — Monorepo Server Gateway
 *
 * Production entrypoint delegating to backend/server.js
 * Enables seamless deployment across Heroku, Render, AWS, Docker, and local development.
 */
require('./backend/server.js');

