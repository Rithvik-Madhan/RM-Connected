# Personal Website Product Requirements Document (PRD)

## Goals and Background Context

### Goals
• Showcase personal portfolio and creative work in an engaging, memorable way
• Establish a platform for sharing blogs and thought leadership content
• Build a distinctive personal brand through creative expression and unique design
• Create a fun and interactive online presence that reflects personality and expertise
• Position myself as a thought leader in my field through content and presentation
• Provide a central hub for professional networking and opportunity discovery
• Showcase diverse interests and expertise in marine biology, environmental science, technology/AI, scouting, and scuba diving
• Create an engaging platform for sharing educational blog content with rich media (images, links, YouTube videos)
• Build a personal brand as a young thought leader passionate about science, technology, and environmental stewardship
• Demonstrate leadership, initiative, and expertise to support applications for scholarships, programs, and opportunities
• Connect with fellow students, scouts, and the general public who share similar interests
• Migrate and expand upon existing blog content with enhanced multimedia capabilities
• Establish credibility and showcase achievements in diverse areas (Boy Scouts, scuba certification, academic interests)

### Background Context

As a 14-year-old high school student with certifications in scuba diving and active involvement in Boy Scouts, this website addresses the unique challenge of effectively presenting diverse talents and passions to multiple audiences. Traditional teen portfolios often lack the sophistication needed for scholarship applications and program admissions, while being too formal for peer engagement.

This platform will serve as both an educational resource and personal showcase, featuring multimedia-rich blog posts about marine biology, environmental science, technology/AI, scouting experiences, and underwater exploration. By combining existing blog content with enhanced presentation capabilities, the site will demonstrate maturity, expertise, and leadership qualities that set the foundation for future academic and professional opportunities. The creative, engaging approach ensures the content resonates with peers and the general public while maintaining the professionalism needed for formal applications.

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-05 | 1.0 | Initial PRD creation - Goals and Background | John (PM) |
| 2025-08-05 | 1.1 | Updated for 14-year-old student focus on science/scouting | John (PM) |

---

## Requirements

### Functional Requirements

**FR1:** The website shall display a homepage introducing the student with their key interests, achievements, and current projects

**FR2:** The blog system shall support rich multimedia content including images, embedded YouTube videos, and external links within posts

**FR3:** The website shall provide a dedicated portfolio section showcasing Boy Scout achievements, scuba diving certifications, and project work

**FR4:** The website shall include a separate achievements/certifications section highlighting academic awards, scout ranks, diving certifications, and other accomplishments

**FR5:** The blog shall categorize posts by topic areas (marine biology, environmental science, technology/AI, scouting, scuba diving)

**FR6:** The website shall migrate and display existing blog content from the student's 2 previous blogs

**FR7:** The blog system shall support markdown or rich text editing for easy content creation and formatting

**FR8:** The website shall include an "About Me" section detailing the student's background, interests, and goals

**FR9:** The website shall provide contact information and social media links for networking opportunities

**FR10:** The blog shall include a search functionality to help visitors find content by topic or keyword

**FR11:** The website shall display recent blog posts prominently on the homepage to encourage engagement

**FR12:** Each blog post shall support tags and categories for better content organization and discovery

**FR13:** The blog shall include a commenting system to allow visitor engagement and discussion on posts

**FR14:** The website shall integrate analytics tracking to monitor content performance, visitor behavior, and popular topics

**FR15:** The commenting system shall include moderation capabilities to maintain appropriate discourse

### Non-Functional Requirements

**NFR1:** The website shall be mobile-responsive to ensure accessibility across all devices used by students and general public

**NFR2:** The website shall load within 3 seconds on standard broadband connections to maintain visitor engagement

**NFR3:** The website shall be hosted on a platform suitable for a student budget (free or low-cost hosting options)

**NFR4:** The website shall use SEO best practices to improve discoverability by scholarship committees and program directors

**NFR5:** The website design shall appear professional and mature while remaining authentic to a 14-year-old's voice and interests

**NFR6:** The website shall be maintainable by a high school student without requiring advanced technical expertise

**NFR7:** The website shall support future growth and additional content types as interests and achievements expand

**NFR8:** Image uploads and media content shall be optimized for web performance without sacrificing quality

**NFR9:** Analytics data shall be presented in an easy-to-understand dashboard format suitable for a student user

**NFR10:** The commenting system shall prevent spam and inappropriate content through automated filtering and manual moderation

---

## User Interface Design Goals

### Overall UX Vision

The website will embody a "young scientist explorer" aesthetic featuring your actual diving and scouting photography as hero content. The design will use ocean-inspired colors (blues, whites, tans) in a fun yet modern approach - think contemporary beach house meets scientific journal. The interface balances 60% casual/40% formal tone to feel approachable and authentic while maintaining credibility for scholarship applications. Your underwater photography and scouting adventures will serve as the visual foundation, creating an immersive experience that showcases your real experiences.

### Key Interaction Paradigms

- **Photo-story navigation**: Your diving and scouting photos guide visitors through content sections
- **Casual-professional balance**: Friendly, conversational writing with structured, informative content organization  
- **Visual storytelling**: Your actual photographs and videos are featured prominently throughout the experience
- **Discovery journey**: Content flows like exploring underwater environments or trail adventures
- **Community engagement**: Comment sections encourage educational discussions in a relaxed but respectful tone

### Core Screens and Views

- **Homepage/Landing**: Hero carousel featuring your best diving/scouting photos with casual introduction and recent highlights
- **Blog Feed**: Photo-rich preview cards using your images as visual hooks for each post
- **Individual Blog Post**: Your photos/videos integrated throughout content, not just as attachments
- **Portfolio/Projects**: Visual showcase led by your photography with project stories
- **Achievements/Certifications**: Timeline design incorporating photos from certification moments and scouting events
- **About Me**: Photo collage showing your diverse interests with casual but informative storytelling
- **Photo Gallery**: Dedicated space for your diving and scouting photography collections

### Accessibility: WCAG AA

Meeting WCAG AA standards while ensuring your photography maintains proper contrast ratios and includes descriptive alt text for your diving and adventure images.

### Branding

**Ocean-adventure aesthetic**: Primary palette of ocean blues, crisp whites, and warm sandy tans applied in clean, contemporary styling. Your diving photography provides authentic oceanic imagery while scouting photos add earthy, adventure elements. Typography will be modern and readable - casual enough for peer engagement but professional enough for applications. Design elements will subtly reference both underwater environments and outdoor exploration, directly tied to your actual experiences rather than generic nature imagery.

### Target Device and Platforms: Web Responsive

Fully responsive design that showcases your photography beautifully across all devices, with particular attention to mobile image optimization since your diving and adventure photos will be content centerpieces.

---

## Technical Assumptions

### Repository Structure: Monorepo
Single repository containing the Astro website with all components, content, and assets organized in Astro's standard structure.

### Service Architecture
**Static Site with Dynamic Islands**: Astro's hybrid approach using static site generation with interactive islands for dynamic features (comments, search). This provides excellent performance while supporting the interactive features you need.

### Testing Requirements
**Unit + Integration Testing**: Basic testing setup with Vitest (Astro's recommended testing framework) for component testing and integration tests for critical user flows like blog posting and comment functionality.

### Additional Technical Assumptions and Requests

**Framework & Build System:**
- **Astro 4.x** as the primary framework - excellent choice for content-heavy sites with multimedia support
- **Content Collections** for blog posts and portfolio items with frontmatter for metadata
- **MDX support** for rich blog posts with embedded components, images, and YouTube videos

**Frontend Technologies:**
- **TypeScript** for type safety and better development experience with AI tools
- **Tailwind CSS** for styling - perfect for your ocean color palette and responsive design
- **React/Preact islands** for interactive components (comments, search, analytics dashboard)

**Content Management:**
- **Markdown/MDX files** for blog posts stored in repository - easy to version control and migrate existing content
- **Frontmatter** for post metadata (categories, tags, featured images, publication dates)
- **Content Collections API** for type-safe content querying and organization

**Media & Performance:**
- **Astro Image optimization** for your diving/scouting photography with responsive images
- **YouTube embed components** for video content integration
- **Static asset optimization** for fast loading of your multimedia content

**Interactive Features:**
- **Giscus** (GitHub Discussions-based comments) - free, spam-resistant, perfect for your technical audience
- **Pagefind** for client-side search functionality - works great with static sites
- **Google Analytics 4** integration for tracking content performance

**Hosting & Deployment:**
- **Netlify** or **Vercel** free tier - both have excellent Astro support and automatic deployments
- **GitHub** for version control and content management
- **GitHub Actions** for automated deployment pipeline

**Development Tools:**
- **Claude Code** and AI tools for development assistance
- **VS Code** with Astro extension for optimal development experience
- **Prettier** and **ESLint** for code formatting and quality

---

## Epic List

**Epic 1: Foundation & Core Infrastructure**
Establish project setup with Astro framework, basic site structure, and deploy a working homepage with your introduction and key achievements.

**Epic 2: Content Management & Blog System** 
Create the blog system with MDX support, content collections, and migrate your existing blog posts with rich multimedia capabilities.

**Epic 3: Visual Portfolio & Achievement Showcase**
Build dedicated sections for showcasing your diving/scouting photography, portfolio projects, and certifications with your ocean-inspired design system.

**Epic 4: Community Features & Analytics**
Implement commenting system, search functionality, and analytics integration to enable visitor engagement and content performance tracking.

---

## Epic 1: Foundation & Core Infrastructure

**Epic Goal:** Establish a fully functional Astro website with ocean-inspired design, deployed to production, featuring your introduction and key achievements to immediately create your online presence.

### Story 1.1: Project Setup and Initial Structure

As a high school student,
I want an Astro project properly configured with TypeScript, Tailwind CSS, and my ocean color palette,
so that I have a solid foundation for building my personal website with modern web technologies.

**Acceptance Criteria:**
1. Astro project created with TypeScript configuration
2. Tailwind CSS installed and configured with custom ocean color palette (blues, whites, tans)
3. Basic folder structure established for pages, components, and content
4. Development server runs successfully with hot reload
5. ESLint and Prettier configured for code quality

### Story 1.2: Homepage Layout and Introduction

As a visitor to the website,
I want to see an engaging homepage that introduces the student with their key interests and achievements,
so that I quickly understand who they are and what they're passionate about.

**Acceptance Criteria:**
1. Hero section displays student introduction with ocean-inspired background
2. Key achievements section highlights Boy Scout rank, diving certification, and academic interests
3. Recent interests preview (marine biology, environmental science, technology/AI, scouting)
4. Contact/social media links prominently displayed
5. Fully responsive design working on mobile, tablet, and desktop
6. Navigation menu with placeholder links for future sections

### Story 1.3: Deployment and Production Setup

As a student,
I want my website automatically deployed to a free hosting platform,
so that I can share my online presence immediately and have changes deploy automatically.

**Acceptance Criteria:**
1. GitHub repository created with proper commit history
2. Website deployed to Netlify or Vercel with custom domain configuration
3. Automatic deployment pipeline triggered by GitHub commits
4. HTTPS enabled and working
5. Performance optimization configured (image optimization, minification)
6. Basic SEO meta tags implemented for homepage

## Epic 2: Content Management & Blog System

**Epic Goal:** Create a powerful, multimedia-rich blogging system that allows easy content creation and showcases existing blog posts with proper categorization and rich media support.

### Story 2.1: Content Collections and Blog Structure

As a student blogger,
I want a well-organized content management system for my blog posts,
so that I can easily create, organize, and manage content across my diverse interests.

**Acceptance Criteria:**
1. Astro Content Collections configured for blog posts with TypeScript schemas
2. Frontmatter structure supports title, date, categories, tags, featured image, and excerpt
3. Category system implemented for marine biology, environmental science, technology/AI, scouting, scuba diving
4. Blog index page displays posts with category filtering
5. Individual blog post layout with proper typography and reading experience
6. SEO optimization for blog posts (meta tags, Open Graph, structured data)

### Story 2.2: Rich Media Integration

As a student blogger,
I want to embed images, YouTube videos, and external links seamlessly in my blog posts,
so that I can create engaging, multimedia content that effectively shares my experiences and knowledge.

**Acceptance Criteria:**
1. MDX support enabled for React component usage in blog posts
2. Custom image component with lazy loading and responsive sizing
3. YouTube embed component for easy video integration
4. External link component with proper styling and security attributes
5. Image gallery component for showcasing multiple photos
6. Code syntax highlighting for technology-related posts
7. Performance optimized with image compression and lazy loading

### Story 2.3: Existing Content Migration

As a student,
I want my 2 existing blogs migrated to the new website with proper formatting,
so that all my previous work is preserved and discoverable in the new system.

**Acceptance Criteria:**
1. Existing blog content converted to MDX format with proper frontmatter
2. Images and media assets properly organized and optimized
3. Categories and tags assigned to migrated content
4. Publication dates preserved from original posts
5. Internal links updated to work with new site structure
6. All migrated content displays correctly with rich media
7. Old URLs redirected if possible for SEO preservation

## Epic 3: Visual Portfolio & Achievement Showcase

**Epic Goal:** Create dedicated sections that professionally showcase diving/scouting photography, portfolio projects, and certifications using your ocean-inspired design to support scholarship applications and networking.

### Story 3.1: Photography Portfolio and Gallery

As a visitor interested in my diving and scouting experiences,
I want to view a curated gallery of photography and videos from my adventures,
so that I can see the breadth of my outdoor experiences and underwater exploration.

**Acceptance Criteria:**
1. Dedicated portfolio section with grid layout for photography
2. Lightbox functionality for full-size image viewing
3. Categories for diving photos, scouting activities, and nature photography
4. Image metadata display (location, date, diving depth where applicable)
5. Video integration for diving and activity footage
6. Mobile-optimized gallery with touch gestures
7. Loading optimization for large image collections

### Story 3.2: Achievements and Certifications Showcase

As a scholarship committee member or program director,
I want to see a professional presentation of the student's achievements and certifications,
so that I can quickly assess their qualifications and commitment to various activities.

**Acceptance Criteria:**
1. Dedicated achievements section with organized presentation
2. Boy Scout rank progression display with dates and requirements completed
3. Scuba diving certifications with certification levels and dive log highlights
4. Academic awards and recognition properly documented
5. Interactive timeline or badge system for visual appeal
6. Downloadable resume/CV functionality
7. Professional formatting suitable for application screenshots

### Story 3.3: Project Portfolio and Technical Work

As a potential mentor, educator, or program coordinator,
I want to see examples of the student's project work and technical interests,
so that I can understand their capabilities and areas of expertise.

**Acceptance Criteria:**
1. Project showcase section with detailed case studies
2. Technical projects highlighted with technologies used
3. Environmental science projects documented with methodologies and results
4. Scouting leadership projects and community service highlighted
5. Links to project repositories, documentation, or live demos where applicable
6. Skills and technologies section with proficiency indicators
7. Integration with blog posts that detail project development processes

## Epic 4: Community Features & Analytics

**Epic Goal:** Enable visitor engagement through commenting and search functionality while providing analytics insights to understand audience interests and content performance.

### Story 4.1: Search and Content Discovery

As a visitor to the website,
I want to search for content across blog posts and portfolio items by keywords or categories,
so that I can quickly find information about topics that interest me.

**Acceptance Criteria:**
1. Client-side search functionality using Pagefind or similar
2. Search results page with content previews and relevance ranking
3. Category and tag filtering integrated with search
4. Search suggestions and autocomplete for better user experience
5. Mobile-optimized search interface
6. Search performance optimized for large content collections
7. Search analytics to track popular queries

### Story 4.2: Comment System and Community Engagement

As a visitor to the blog,
I want to leave comments and engage in discussions about the content,
so that I can ask questions, share experiences, and connect with the author and other readers.

**Acceptance Criteria:**
1. Giscus comment system integrated with GitHub Discussions
2. Comment moderation capabilities for maintaining appropriate discourse
3. Threaded discussions for organized conversations
4. Social login through GitHub for authenticated commenting
5. Email notifications for new comments (configurable)
6. Spam prevention and inappropriate content filtering
7. Mobile-friendly comment interface

### Story 4.3: Analytics and Performance Tracking

As a student content creator,
I want to understand how visitors interact with my content and which topics perform best,
so that I can create more of what my audience finds valuable and track my online presence growth.

**Acceptance Criteria:**
1. Google Analytics 4 integration with privacy-compliant configuration
2. Custom dashboard showing content performance metrics
3. Popular content tracking by page views and engagement time
4. Audience insights showing visitor demographics and interests
5. Search query analytics to understand visitor intent
6. Comment engagement metrics and trending discussions
7. Performance reports accessible through admin interface or email summaries

---

*Document generated through interactive workflow by John (PM) on 2025-08-05*