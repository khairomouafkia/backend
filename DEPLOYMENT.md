# Backend deployment

## Required environment

Set these values in the deployment provider's secret/configuration panel:

- `NODE_ENV=production`
- `PORT` to the port supplied by the provider (or `3000` for a self-managed container)
- `ALLOWED_ORIGINS` to the comma-separated, exact HTTPS origins of the frontend; do not use `*`
- `TRUST_PROXY_HOPS` to the number of trusted reverse proxies in front of Express (usually `1`)
- `SUPABASE_URL`, `SUPABASE_KEY`, and `GEMINI_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT_JSON` containing the service-account JSON, or `FIREBASE_SERVICE_ACCOUNT_PATH` pointing to a securely mounted file

Never commit `.env` or `serviceAccountKey.json`. The provided `.dockerignore` excludes both from container builds. Use a server-side Supabase key only in this backend, and rotate credentials if they have been exposed.

## Docker

Build from the `backend` directory:

```sh
docker build -t octobre-rose-backend .
docker run --rm -p 3000:3000 --env-file .env octobre-rose-backend
```

The host platform must provide all required variables and route traffic to `PORT`. `GET /api/health` is the readiness endpoint and returns `503` when a required integration is unavailable.

## Authentication

Protected endpoints accept a Firebase ID token in `Authorization: Bearer <id-token>`. The API verifies the token signature, expiry, and revocation status. Public read endpoints remain public; write endpoints require authentication, and event/center administration additionally requires the Firebase `admin` custom claim. Assign that claim only through the trusted admin script.