# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# Documentation & specific local files
README copy.md
prd.md
PROJECT_STATE.md

# Dependencies
/node_modules
/.pnpm-store

# Next.js & Build outputs
/.next/
/out/
/build
/dist

# Debug logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
*.log

# Environment variables
.env*
!.env.example

# Vercel & Deployment
.vercel

# TypeScript & Cache
*.tsbuildinfo
next-env.d.ts~
.turbo/

# IDE / Editor configuration
.vscode/
.idea/
*.swp
*.swo

# System / OS files
.DS_Store
Thumbs.db

# Testing & Coverage
/coverage
/.nyc_output