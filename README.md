# Novel platform Monorepo

This repository contains a multi-service architecture for a novel reading platform, designed for independent deployment across different servers.

## Project Structure

```
novels/
├── services/
│   ├── web/                  ← Novel Reader App (Server A)
│   └── auth/                 ← Authentication Service (Server B - DynamoDB)
├── shared/                   ← Common code, database helpers, and config
├── ecosystem.config.js       ← PM2 configuration
├── package.json              ← Root orchestration
└── .env                      ← Shared environment variables
```

---

## Deployment Guide: Multiple Servers

Since the **Web service** and **Auth service** are in the same repository but intended for different servers, follow these steps for each:

### Server A: Web Service (Novel Reader)
1. **Clone the repo** to Server A.
2. **Configure `.env`**: Ensure `PORT` is set (e.g., `3000`) and AWS S3 credentials are provided.
3. **Install Dependencies**:
   ```bash
   npm run install:web   # Installs only web-related dependencies
   npm install           # Installs shared dependencies at root
   ```
4. **Build & Start**:
   ```bash
   npm run build         # Runs DOM obfuscation
   pm2 start ecosystem.config.js --only novels-web --env production
   ```

### Server B: Auth Service (Login/Logout)
1. **Clone the repo** to Server B.
2. **Configure `.env`**: Set `AUTH_PORT` (e.g., `3001`), `JWT_SECRET`, and `DYNAMO_USERS_TABLE`.
3. **IAM Role**: Ensure the EC2 instance has an IAM Role with `AmazonDynamoDBFullAccess` (or custom policy for the specific table).
4. **Install Dependencies**:
   ```bash
   npm run install:auth  # Installs only auth-related dependencies
   npm install           # Installs shared dependencies at root
   ```
5. **Setup Table (First time only)**:
   ```bash
   cd services/auth
   npm run create-table
   ```
6. **Start**:
   ```bash
   pm2 start ecosystem.config.js --only novels-auth --env production
   ```

---

## Local Development

### Prerequisites
- Node.js 18+
- SQLite3 (for novels metadata)
- AWS Credentials / IAM access for S3 and DynamoDB

### Quick Start
1. **Install everything**:
   ```bash
   npm run install:all
   npm install
   ```
2. **Seed local database**:
   ```bash
   npm run seed
   ```
3. **Run services**:
   - Web: `npm run dev:web` (Port 3003)
   - Auth: `npm run dev:auth` (Port 3001)

## Shared Infrastructure
- **Database**: The Web service uses a shared SQLite database (`shared/database/novels.db`) for novel metadata.
- **Config**: AWS S3 logic is shared in `shared/config/aws.js`.
- **Auth**: The Auth service uses AWS DynamoDB for user management, allowing it to scale independently of the web server.

## Security Features
- **DOM Obfuscation**: Classes are rotated on every build via `npm run build`.
- **JWT Authentication**: Stateless authentication between services using secure tokens.
- **Anti-Bot Middleware**: Injected watermarks and request filtering to deter scrapers.