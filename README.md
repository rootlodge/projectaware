# Project Aware v2

A modular, self-aware AI platform with plugin architecture, multi-tenant support, and enterprise-grade capabilities for both local and cloud deployment.

## 🚀 Features

### Phase 1 - Foundation & Authentication ✅

- **Authentication System**
  - Better Auth integration with email/password
  - Bcrypt password hashing
  - Role-based access control (RBAC) - admin, developer, team member, user
  - Session management with database persistence
  - Email verification
  - Password reset functionality
  - Multi-database support (SQLite/PostgreSQL)

- **User Management**
  - User activity tracking
  - GDPR-compliant data export
  - GDPR-compliant data deletion
  - User feedback and rating system

- **Multi-Tenant Architecture**
  - Tenant isolation and data segregation
  - Tenant provisioning and management
  - Tenant-specific configuration
  - Resource limits and quota tracking
  - Usage tracking system

- **Email Service**
  - Configurable email providers (SMTP, SendGrid, etc.)
  - Tenant-specific email configuration
  - Email templates for verification, password reset, and welcome

## 📦 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Drizzle ORM with SQLite/PostgreSQL support
- **Authentication**: Better Auth
- **Styling**: Tailwind CSS + shadcn/ui
- **Email**: Nodemailer
- **Testing**: Vitest

## 🛠️ Getting Started

### Prerequisites

- Node.js 22+ LTS
- pnpm 9+

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd projectaware
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- Database URL
- Better Auth secret (generate a secure random string)
- Email service credentials

4. Generate database schema:
```bash
pnpm db:generate
```

5. Push schema to database:
```bash
pnpm db:push
```

6. Run development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
projectaware/
├── src/
│   ├── app/                  # Next.js app directory
│   │   ├── api/             # API routes
│   │   ├── login/           # Login page
│   │   ├── register/        # Registration page
│   │   └── dashboard/       # Dashboard page
│   ├── db/                  # Database layer
│   │   ├── schema/          # Drizzle schemas
│   │   └── index.ts         # Database connection
│   ├── lib/                 # Core libraries
│   │   ├── auth/            # Authentication utilities
│   │   ├── email/           # Email service
│   │   ├── users/           # User management
│   │   ├── tenants/         # Multi-tenant system
│   │   └── utils/           # Utility functions
│   └── middleware.ts        # Next.js middleware
├── drizzle.config.ts        # Drizzle configuration
├── next.config.ts           # Next.js configuration
└── tailwind.config.ts       # Tailwind configuration
```

## 🔒 Environment Variables

See `.env.example` for all required environment variables:

- `DATABASE_URL`: Database connection string
- `DATABASE_TYPE`: `sqlite` or `postgresql`
- `BETTER_AUTH_SECRET`: Secret key for Better Auth
- `ENCRYPTION_KEY`: 32-character key for encrypting sensitive data
- `SMTP_*`: Email service configuration
- `MULTI_TENANT`: Enable/disable multi-tenant mode

## 📝 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript compiler check
- `pnpm format` - Format code with Prettier
- `pnpm db:generate` - Generate database migrations
- `pnpm db:push` - Push schema to database
- `pnpm db:studio` - Open Drizzle Studio
- `pnpm test` - Run tests with Vitest

## 🗺️ Roadmap

- [x] **Phase 1**: Foundation & Authentication
- [ ] **Phase 2**: Core Infrastructure & Database
- [ ] **Phase 3**: Plugin System & Extensibility
- [ ] **Phase 4**: AI Core & Conversation Engine
- [ ] **Phase 5**: User Portals & Interfaces
- [ ] **Phase 6-10**: Advanced features, security, monitoring, testing, launch

See [TODO.md](TODO.md) for detailed roadmap.

## 📄 License

See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with Next.js, Better Auth, Drizzle ORM, and other amazing open-source technologies.
