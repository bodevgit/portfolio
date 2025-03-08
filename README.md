# Space-Themed Portfolio & Document Management System

A personal portfolio website with an integrated document management system and planning features. Features a sleek, cosmic-inspired design with dark blue/purple color schemes, gradients, and subtle animations.

![Portfolio Screenshot Placeholder](https://via.placeholder.com/800x400?text=BodevPortfolio)

## 🌠 Features

- **Responsive Portfolio Website**
  - Personal information display
  - Project showcase
  - Space-themed UI with dark backgrounds and blue/purple accents

- **Document Management System**
  - Upload, categorize, and manage documents
  - File search and filtering by category
  - Secure document storage with user-specific access
  - Download functionality
  - Category-based organization (School, Work, Personal, Projects)

- **Planning System**
  - Task management with categories (Today, Upcoming, Project Ideas)
  - Create, update, complete, and delete tasks
  - Persistent task storage

- **User Authentication**
  - Secure login system
  - Admin and regular user roles with appropriate permissions

## 🚀 Tech Stack

- **Frontend:** HTML, CSS, JavaScript with Bootstrap
- **Backend:** Node.js with Express.js
- **Database:** SQLite for document and task storage
- **Template Engine:** EJS
- **File Handling:** Multer

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## 🔧 Local Development Setup

1. Clone the repository
   ```bash
   git clone https://github.com/bodevgit/portfolio.git
   cd portfolio
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create environment file
   ```bash
   cp .env.example .env
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

5. Visit `http://localhost:3000` in your browser

## 🌐 Deployment

This application is configured for easy deployment on Render.com:

1. Push your code to GitHub
2. Create a new Web Service on Render pointing to your repository
3. Configure environment variables as specified in `.env.sample`
4. Set up a persistent disk for database and uploads
5. Connect your custom domain (bodev.dev)

Detailed deployment instructions are available in the [deployment guide](deployment.md).

## 🔒 Security Notes

- Default admin credentials are included for development
- Change admin credentials before production deployment
- Configure session secrets via environment variables

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📝 Author

**Bo Dev** - [bodevgit](https://github.com/bodevgit)

---

⭐️ From [bodevgit](https://github.com/bodevgit)
