# Insurance Helpdesk Frontend

A modern, responsive web application for managing insurance policies and customer support. Built with React, Vite, and Tailwind CSS.

## Features

- 🔒 Secure authentication system
- 📊 Interactive policy management dashboard
- 💬 Real-time chat support
- 📝 Policy documentation with Markdown support
- 🎥 Video tutorials and guides
- 👤 User profile management
- 🔍 Advanced search functionality
- 🎯 Admin dashboard for support staff

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React & React Icons
- **State Management**: Context API
- **Authentication**: JWT
- **Markdown Rendering**: Custom Markdown component
- **HTTP Client**: Axios

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/Insurance-Helpdesk-Internal.git
cd Insurance-Helpdesk-Internal/frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://your-backend-url:port
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
frontend/
├── src/
│   ├── assets/         # Static assets (images, videos)
│   ├── components/     # Reusable UI components
│   ├── context/        # React Context providers
│   ├── pages/          # Page components
│   ├── utils/          # Utility functions
│   ├── App.jsx         # Root component
│   └── main.jsx       # Entry point
├── public/            # Public assets
└── index.html        # HTML template
```

## Key Components

- **Navbar**: Main navigation component with theme switching
- **MarkdownRenderer**: Custom markdown rendering with syntax highlighting
- **FormInput**: Reusable form input component
- **ThemeSwitcher**: Dark/Light theme toggle
- **TypingDots**: Animated loading indicator
- **Error**: Error boundary component

## Pages

- **Hero**: Landing page with feature showcase
- **Login**: Authentication page
- **Policy**: Insurance policy management
- **Chats**: Customer support chat interface
- **Admin**: Admin dashboard
- **Profile**: User profile management
- **Video**: Video tutorials section

## Styling

The project uses Tailwind CSS with custom configurations for:
- Custom color schemes
- Dark/Light theme variants
- Responsive breakpoints
- Custom animations
- Gradient utilities

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier

### Code Style

- ESLint configuration for React
- Prettier for code formatting
- Custom rules for consistent code style

## License

This project is proprietary and confidential. Unauthorized copying or distribution is prohibited.

## Support

For support, please contact the development team or raise an issue in the repository.
