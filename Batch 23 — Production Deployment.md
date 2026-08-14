Prepare the platform for production deployment.

## FRONTEND

Prepare for deployment to:

Vercel

## BACKEND

Use:

Supabase

## CONFIGURATION

Create:

.env.example

Document all required variables.

Never commit:

API keys
Service role keys
Payment secrets
JWT secrets
Database passwords

## PRODUCTION CHECKS

Verify:

Database migrations
RLS
Authentication
Storage policies
Payment webhooks
CORS
Domain configuration
Email configuration
SEO
Sitemap
Robots
Error handling
Logging
Analytics

## DEPLOYMENT DOCUMENTATION

Create:

/docs/deployment.md

Include:

Local development
Environment setup
Supabase setup
Database migrations
Storage setup
Authentication setup
Payment setup
Webhook setup
Vercel deployment
Custom domain
Production checklist
Rollback procedure

Do not claim production readiness until all checks pass.