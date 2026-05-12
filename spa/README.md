# STUF SPA

React-based Single Page Application for the Secure Trusted Upload Facility.

## Development

### With Docker (Recommended)

From the project root:

```bash
make spa-dev
```

This starts the full stack (Zitadel, MinIO, API, SPA) with hot reloading. OIDC configuration is read from `.zitadel-bootstrap/generated.env` after provisioning.

### Without Docker

```bash
cd spa
npm install
npm run dev
```

**Note:** When running without Docker, the SPA uses hardcoded defaults:

| Setting        | Default Value           |
| -------------- | ----------------------- |
| API URL        | `http://localhost:8000` |
| OIDC Authority | `http://localhost:8080` |
| OIDC Client ID | `stuf-spa`              |

If your local setup differs from these defaults, use `make spa-dev` instead, which reads OIDC configuration from `.zitadel-bootstrap/generated.env`.

### Switching Between Docker and Non-Docker

When switching between `make spa-dev` (Docker) and `npm run dev` (non-Docker), you may need to remove the generated config file:

```bash
rm spa/public/config.js
```

Or use the cleanup commands from the project root:

```bash
make spa-stop  # Stops services and cleans config
make clean     # Full cleanup including config
```

**Why?** Docker mode generates `public/config.js` with runtime configuration. If this file exists when running `npm run dev` outside Docker, it will override the hardcoded defaults and may point to incorrect URLs (e.g., Docker container hostnames).

## Configuration System

The SPA uses a runtime configuration approach:

1. **Docker deployments**: `docker-entrypoint.sh` generates `public/config.js` at container startup, injecting environment variables as `window.__STUF_CONFIG__`

2. **Local development**: Falls back to hardcoded defaults in `src/config.ts` (only if `config.js` doesn't exist)

This allows the same Docker image to be deployed to different environments (dev, staging, prod) without rebuilding.

## Testing

```bash
npm test        # Run tests
npm run test:ui # Run tests with UI
```

## Building

```bash
npm run build   # Production build (outputs to build/)
```
