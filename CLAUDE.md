# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ocean Explorer** is a sophisticated personal portfolio website for a marine biology student, Eagle Scout, and certified scuba diver. The site showcases underwater photography, diving adventures, scouting achievements, and scientific research through an interactive, ocean-themed design.

### Technology Stack
- **Astro 5.12.9** - Static site generator with component islands
- **React 19.1.1** - Interactive components with TypeScript
- **Tailwind CSS 3.4.3** - Custom ocean/sand theme with component utilities
- **MDX** - Rich content support (planned)

### Architecture
- **Component-based design** with reusable Astro components
- **Interactive islands** for dynamic features (carousel, filters, navigation)
- **Progressive enhancement** with performance-optimized loading
- **Mobile-first responsive design** with touch interactions

## Development Commands

```bash
# Development
npm run dev          # Start dev server at localhost:4321
npm run build        # Build production site to ./dist/
npm run preview      # Preview production build locally
npm run astro        # Run Astro CLI commands (check, add, etc.)

# Clean development install
rm -rf node_modules package-lock.json dist .astro
npm install
npm run dev

# Installation
npm install          # Install all dependencies
```

## Component Architecture

### Core Components

**Header.astro** (`src/components/Header.astro`)
- Fixed navigation with backdrop blur
- Responsive mobile hamburger menu with animated icon toggle
- Interactive JavaScript for mobile menu show/hide and outside click handling
- Search button and navigation links to planned sections

**Hero.astro** (`src/components/Hero.astro`) 
- Auto-advancing image carousel with 3 marine biology/scouting photos
- Manual controls: dots navigation, arrow buttons, keyboard support
- Pause on hover/focus for accessibility
- Dynamic title/subtitle updates with fade animations
- TypeScript for carousel state management

**BlogPreview.astro** (`src/components/BlogPreview.astro`)
- Interactive category filtering (All, Marine Biology, Diving, Conservation, Scouting)
- Staggered animations for filtered content display
- Mock blog data structure with images, metadata, and tags
- Responsive grid layout with hover effects

**PhotoCard.astro** (`src/components/PhotoCard.astro`)
- Typed props interface for diving/scouting/nature categories
- Lazy loading with IntersectionObserver (via Layout.astro)
- Category-specific color coding and metadata display
- Hover scale effects and overlay animations

**Layout.astro** (`src/layouts/Layout.astro`)
- Progressive image loading with IntersectionObserver
- SEO meta tags and performance optimizations
- Google Fonts preconnect for typography

### Page Structure

**index.astro** (`src/pages/index.astro`)
- Single-page application with data-driven sections
- Achievement data structure with icons, organizations, and descriptions
- Featured work portfolio with metadata (location, date, depth)
- Statistics showcase (50+ dives, 3 research projects, 5 certifications)

## Styling & Design System

### Color Palette (tailwind.config.mjs)
- **Ocean theme**: `ocean-50` through `ocean-900` (blues #f0f9ff to #0c4a6e)
- **Sand accents**: `sand-50` through `sand-900` (tans #fefdf8 to #78350f)  
- **Primary**: `ocean-600` (#0284c7) for buttons, links, active states
- **Accent**: `sand-500` (#f59e0b) for highlights and achievements

### Component Classes (src/styles/global.css)

**Buttons:**
- `.btn-primary` - Ocean blue with hover/focus states
- `.btn-secondary` - Outlined ocean blue with hover fill

**Layout:**
- `.card` - White rounded cards with hover shadow transitions
- `.nav-link` - Navigation links with hover colors and active states

**Utilities:**
- `.text-gradient` - Ocean blue gradient text effect
- `.ocean-gradient` - Background gradient for CTA sections
- `.loading-skeleton` - Shimmer animation for image placeholders

### Typography
- **Primary**: Inter (headings, UI elements)
- **Content**: Merriweather (blog content, planned)
- **Responsive scale**: 4xl-6xl for hero, 3xl-4xl for sections

### Animations & Interactions
- **Hero carousel**: 5-second auto-advance with smooth transitions
- **Category filters**: Color transitions and content staggering
- **Image loading**: Fade-in on IntersectionObserver trigger
- **Hover effects**: Scale transforms on cards and images
- **Mobile menu**: Icon morphing and slide animations

## Content Management

### Data Structures

**Achievements** (in index.astro):
```typescript
{
  title: string;
  organization: string; 
  date: string;
  icon: string; // emoji
  description: string;
}
```

**Blog Posts** (in BlogPreview.astro):
```typescript
{
  id: number;
  title: string;
  excerpt: string;
  category: 'Marine Biology' | 'Diving' | 'Conservation' | 'Scouting';
  date: string;
  readTime: string;
  image: string;
  tags: string[];
}
```

**Portfolio Items** (in index.astro):
```typescript
{
  src: string;
  alt: string;
  title: string;
  category: 'diving' | 'scouting' | 'nature';
  metadata?: {
    location?: string;
    date?: string;
    depth?: string;
  };
}
```

### Content Categories
- **Marine Biology**: Research projects, species studies, coral investigations
- **Diving**: Certifications, underwater photography, exploration logs
- **Conservation**: Environmental projects, sea turtle work, cleanup initiatives  
- **Scouting**: Leadership projects, environmental education, outdoor adventures

## Key Technical Features

### Performance Optimizations
- **Progressive image loading** via IntersectionObserver in Layout.astro
- **Lazy loading** on all images with `loading="lazy"`
- **Font preconnection** for Google Fonts
- **Responsive images** with proper width/height attributes

### Accessibility Features
- **Keyboard navigation** for carousel (arrow keys)
- **ARIA labels** for interactive elements
- **Focus management** in mobile menu
- **Semantic HTML** structure throughout components
- **Print-friendly styles** with `.no-print` classes

### JavaScript Integration
- **TypeScript in Astro components** for type safety
- **DOM manipulation** for interactive features
- **Event delegation** for mobile menu and carousel
- **Intersection Observer API** for progressive loading

## Development Guidelines

### Component Conventions
- Use **TypeScript interfaces** for all component props
- Implement **progressive enhancement** - core content works without JS
- Include **loading states** and **error handling** for dynamic content
- Follow **mobile-first responsive design** patterns

### Content Strategy
- **Ocean/marine theme consistency** across all content and imagery
- **Educational focus** supporting student portfolio goals
- **Visual storytelling** through authentic photography
- **Professional presentation** suitable for scholarship applications

### Code Quality
- **TypeScript strict mode** enabled
- **Semantic HTML5** elements for accessibility
- **Custom CSS properties** for consistent theming
- **Performance-first** approach with optimized images and fonts

## Planned Enhancements

Based on the comprehensive documentation in `/docs/` directory:

### Content Collections
- Astro Content Collections for type-safe blog post management
- MDX integration for rich multimedia blog posts
- Frontmatter schema for metadata standardization

### Interactive Features
- Search functionality with client-side filtering
- Comment system integration (likely Giscus)
- Lightbox gallery for portfolio photography
- Contact form with validation

### Advanced Functionality  
- Google Analytics integration for content performance
- Newsletter signup for blog updates
- RSS feed generation
- Social sharing buttons

## Important Notes

- **Color naming**: Use `sand-*` not `sandy-*` (corrected naming convention)
- **Image sources**: Currently using Pexels placeholder images - replace with authentic photography
- **Navigation links**: Header links point to planned sections (/blog, /portfolio, etc.)
- **Mobile optimization**: Touch-friendly interactions throughout, especially for galleries
- **Print support**: Includes print-specific styles for professional presentation

This is a **student portfolio project** requiring thoughtful content handling and professional presentation standards for educational/scholarship applications.