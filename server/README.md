# Vibez WhatsApp Clone - Node.js Backend

A production-ready real-time backend built with TypeScript, Express, Socket.io, and Prisma.

## Features
- **Auth**: JWT-based authentication with phone number verification logic.
- **Real-time**: Instant messaging and presence (online/last seen) via Socket.io.
- **Database**: PostgreSQL with Prisma ORM for structured data.
- **Storage**: Cloudflare R2 (S3-compatible) for media uploads.
- **E2EE Ready**: Schema includes public key fields for end-to-end encryption.

## Setup
1. `cd server`
2. `npm install`
3. Configure your `.env` (use `.env.example` as a template).
4. Run `npx prisma generate` to initialize the database client.
5. `npm run dev` for local development.

## Deployment
This server can be deployed to any Node.js hosting (Railway, Render, DigitalOcean, Cloud Run).
Make sure to set the environment variables in your hosting provider's dashboard.
