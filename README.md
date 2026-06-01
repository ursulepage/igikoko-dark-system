# igikoko-dark-system

A React + Vite application featuring a dark theme system with real-time communication capabilities.

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS
- **Real-time:** Supabase, Simple Peer (WebRTC)
- **UI Components:** Lucide React, Emoji Picker React
- **Routing:** React Router DOM
- **Notifications:** React Hot Toast
- **Linting:** ESLint with React support

## Project Structure

```
├── src/                 # Source code
├── public/             # Static assets
├── eslint.config.js    # ESLint configuration
├── vite.config.js      # Vite configuration
├── render.yaml         # Render deployment config
└── package.json        # Project dependencies
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Language Composition

- JavaScript: 98.7%
- HTML: 1.3%

## Deployment

This project is configured for deployment on Render using `render.yaml`. The build creates an optimized production bundle with:
- Vite bundling and optimization
- Tailwind CSS purging
- ESLint validation

## License

ISC
