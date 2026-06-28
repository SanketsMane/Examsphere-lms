# 🎓# EXAMSPHERE LMS Marketplace (Live)

> **A Modern Learning Management System & Course Marketplace**  
> Built with Next.js 15, TypeScript, and cutting-edge technologies for seamless online education, course creation, and marketplace functionality.

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 🚀 Overview

EXAMSPHERE LMS Marketplace is a comprehensive learning management system that combines course creation, student management, and marketplace functionality. It provides a complete ecosystem for educators to create, sell, and manage online courses while offering students an engaging learning experience.

## ✨ Key Features

### 🎯 **Course Management**
- **Rich Course Builder** - Create multimedia courses with drag-and-drop interface
- **Video Streaming** - Integrated video player with progress tracking
- **Interactive Quizzes** - Build assessments with multiple question types
- **Course Analytics** - Track student engagement and performance
- **Content Versioning** - Manage course updates and revisions

### 🛒 **Marketplace Features**
- **Course Discovery** - Advanced search and filtering capabilities
- **Rating & Reviews** - Student feedback and rating system
- **Course Previews** - Free preview content for potential students
- **Wishlist & Favorites** - Save courses for later purchase
- **Bulk Enrollment** - Corporate and institutional enrollments

### 💰 **Payment & Revenue**
- **Stripe Integration** - Secure payment processing
- **Multiple Payment Methods** - Cards, wallets, and bank transfers
- **Revenue Dashboard** - Real-time earnings and analytics
- **Payout Management** - Automated instructor payments
- **Discount Coupons** - Promotional pricing strategies

### 👥 **User Management**
- **Role-Based Access** - Students, Instructors, Admins
- **Profile Management** - Comprehensive user profiles
- **Learning Paths** - Guided course sequences
- **Certificates** - Automated certificate generation
- **Social Learning** - Discussion forums and peer interaction

### 🔐 **Security & Authentication**
- **Better-Auth Integration** - Modern authentication system
- **Email Verification** - Secure account activation
- **Two-Factor Authentication** - Enhanced security options
- **Rate Limiting** - Bot protection and abuse prevention
- **Data Encryption** - Secure data handling

### 📊 **Analytics & Reporting**
- **Learning Analytics** - Student progress insights
- **Business Intelligence** - Revenue and engagement metrics
- **Custom Reports** - Exportable data reports
- **Real-time Dashboards** - Live performance monitoring

### 🎨 **Modern UI/UX**
- **Responsive Design** - Mobile-first approach
- **Dark/Light Mode** - User preference themes
- **Accessibility** - WCAG 2.1 AA compliant
- **Progressive Web App** - Offline functionality
- **Component Library** - Reusable UI components

## 🛠️ Technology Stack

### **Frontend**
- **Next.js 15.3.3** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **React Hook Form** - Form management
- **Zustand** - State management

### **Backend & Database**
- **PostgreSQL** - Primary database
- **Prisma ORM** - Type-safe database client
- **Better-Auth** - Authentication system
- **Stripe** - Payment processing
- **AWS S3** - File storage
- **WebSocket** - Real-time communication

### **Development & Deployment**
- **pnpm** - Package manager
- **ESLint & Prettier** - Code quality
- **Husky** - Git hooks
- **Vercel** - Deployment platform
- **GitHub Actions** - CI/CD pipeline

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.17 or later
- **PostgreSQL** 14 or later
- **pnpm** 8.0 or later

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SanketsMane/EXAMSPHERE-LMS-Marketplace.git
   cd EXAMSPHERE-LMS-Marketplace
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Configure your environment variables
   ```

4. **Database Setup**
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

5. **Start Development Server**
   ```bash
   pnpm dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
EXAMSPHERE/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (public)/          # Public pages
│   ├── admin/             # Admin dashboard
│   ├── dashboard/         # User dashboard
│   ├── teacher/           # Instructor portal
│   └── api/               # API routes
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── admin/            # Admin-specific components
│   ├── teacher/          # Instructor components
│   └── general/          # General components
├── lib/                  # Utilities and configurations
├── prisma/               # Database schema and migrations
├── hooks/                # Custom React hooks
└── public/               # Static assets
```

## 🔧 Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Database
pnpm db:migrate       # Run database migrations
pnpm db:push          # Push schema changes
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed test data

# Testing
pnpm test             # Run tests
pnpm test:watch       # Run tests in watch mode
```

## 🌟 Key Highlights

- **🎓 Complete LMS Solution** - Everything needed for online education
- **🛒 Built-in Marketplace** - Sell and discover courses
- **📱 Mobile Optimized** - Perfect experience on all devices
- **🔒 Enterprise Security** - Bank-level security standards
- **⚡ High Performance** - Optimized for speed and scalability
- **🎨 Modern Design** - Beautiful, intuitive user interface
- **🔧 Developer Friendly** - Well-documented and maintainable code

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 👤 Developer

**Sanket Mane**
- 🌐 GitHub: [@SanketsMane](https://github.com/SanketsMane)
- 📧 Email: sanketpatil515151@gmail.com
- 💼 Portfolio: [sanketmane.dev](https://sanketmane.dev)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

If you have any questions or need help with setup, please:
- 📧 Email: sanketpatil515151@gmail.com
- 🐛 Open an issue on GitHub
- 💬 Start a discussion in the repository

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Authentication by [Better-Auth](https://www.better-auth.com/)
- Database management with [Prisma](https://www.prisma.io/)

---

⭐ **Star this repository if you find it helpful!**

Made with ❤️ by [Sanket Mane](https://github.com/SanketsMane)
