# Deployment

## Build

```bash
npm ci
npm run build
```

## Docker

```bash
docker build -t digital-wallet-frontend .
docker run -p 3000:3000 --env-file .env.local digital-wallet-frontend
```

## AWS ECS/Fargate

Recommended deployment:

- ALB + WAF in front of frontend service
- ECS Fargate service running the Next.js standalone server
- CloudWatch logs
- Health check on `/dashboard` or a custom `/api/health` route
- Route53 + ACM TLS certificate

## Production env

```bash
NEXT_PUBLIC_ENABLE_MOCKS=false
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

Never expose backend secrets using `NEXT_PUBLIC_` variables.
