# [ShotDeckAI](https://www.shotdeckai.com)

Welcome to **ShotDeckAI**, the ultimate AI-powered platform for creative professionals and aspiring artists. This private repository contains the core technology behind ShotDeckAI, which enables users to effortlessly generate personalized storyboards, video concepts, and cinematic guidance based on their unique creative vision, emotions, and experiences.

## Recent Updates (Jun 17, 2025 08:49 PM - Jun 18, 2025 03:29 AM)

| Category            | Feature/Fix            | Description                                                                           | Files Modified                                                     |
| ------------------- | ---------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **🎨 Theme System** | Dark Mode Support      | Implemented comprehensive theme support with custom CSS variables and animated toggle | `layout.tsx`, `globals.css`, `theme-toggle.tsx`, `theme-config.ts` |
| **🎨 Theme System** | Theme Documentation    | Created dedicated theme documentation                                                 | `docs/THEMING.md`                                                  |
| **📱 UI/UX**        | Animation Integration  | Added Framer Motion for smooth transitions and animations                             | `prelaunch-signup.tsx`, `story-input.tsx`, `storyboard-frame.tsx`  |
| **📱 UI/UX**        | Typography Enhancement | Added Instrument Serif fonts for improved readability                                 | `globals.css`, `layout.tsx`, `logo-with-text.tsx`                  |
| **📱 UI/UX**        | Social Media Icons     | Consolidated icons as SVG components for better performance                           | `page.tsx`                                                         |
| **🚀 Performance**  | Image Caching          | Implemented image caching in story generation flow                                    | `story-input.tsx`                                                  |
| **🚀 Performance**  | Loading States         | Added skeleton loading states for better user feedback                                | `storyboard-frame.tsx`                                             |
| **🤖 AI Features**  | Typing Rhythm Analysis | Enhanced story input with dynamic generation delays based on typing patterns          | `story-input.tsx`, `generateImage/route.ts`                        |
| **📱 Mobile**       | Responsive Layout      | Refactored layouts for improved mobile experience                                     | `page.tsx`, `globals.css`, `prelaunch-signup.tsx`                  |
| **📱 Mobile**       | Network Access         | Updated dev script to enable mobile testing                                           | `package.json`                                                     |
| **🔍 SEO**          | Meta Tags              | Enhanced metadata with Open Graph and Twitter Card integration                        | `layout.tsx`                                                       |
| **🐛 Bug Fixes**    | Styling Consistency    | Fixed padding, colors, and layout issues across components                            | Multiple components                                                |
| **🐛 Bug Fixes**    | Background Images      | Updated dark mode backgrounds and positioning                                         | `page.tsx`                                                         |
| **🔧 DevOps**       | Build Configuration    | Added `.nvmrc` and build script for deployment                                        | `.nvmrc`, `build.sh`                                               |
| **🔧 DevOps**       | Image Configuration    | Updated Next.js config for image optimization                                         | `next.config.mjs`                                                  |

### Summary Statistics

- **Total Commits**: 29
- **Files Modified**: 15+ unique files
- **New Features**: 8 major features
- **Bug Fixes**: 13 styling and layout fixes
- **Performance Improvements**: 3 optimizations

## Overview

**ShotDeckAI** leverages state-of-the-art technologies to provide an intuitive and highly personalized experience for content creators, filmmakers, and influencers. By integrating AI-driven tools with advanced generative models, ShotDeckAI helps users transform abstract ideas into visually compelling narratives.

## Technology Stack

This project is built using a cutting-edge tech stack to ensure performance, scalability, and a seamless user experience:

- **Next.js**: For building the fast and scalable React-based front-end.
- **TailwindCSS**: For highly customizable, utility-first styling.
- **ShadCN UI**: To create flexible and reusable component libraries.
- **Cloudflare**: Serving as the platform for fast and secure deployment.
- **Supabase**: As the back-end service for real-time database, authentication, and storage.
- **Cloudflare Wrangler**: To manage Cloudflare Workers and deploy serverless functions.
- **Flux Text-to-Image Diffusion Model**: For generating customized visuals based on user inputs, including descriptions of emotions, memories, and creative ideas.
- **Retrieval-Augmented Generation (RAG)**: For enhanced content generation, providing more accurate and contextually relevant outputs.
- **OpenAI Multi-Modal**: To process text, images, and other input formats to offer suggestions and creative feedback.

## Features

- **AI-Driven Storyboarding**: Generate personalized and cinematic storyboards effortlessly.
- **Real-Time Creative Suggestions**: Receive intelligent input on camera angles, shot composition, and emotional tone.
- **Emotional and Memory Integration**: Describe memories, emotions, or creative ideas, and let the AI translate them into cinematic visuals.
- **Security and Privacy**: All personal data such as photos, videos, and memories are securely stored, ensuring user privacy and control over content.

## Privacy and Security

ShotDeckAI prioritizes data security and privacy. Users can confidently upload their personal media, which is securely stored using Supabase's real-time storage and authentication features. No personal content is shared without explicit permission from the user, and data is encrypted and protected in transit and at rest.

## Deployment

This project is deployed on **Cloudflare**, leveraging Cloudflare Workers for serverless functions and Wrangler for streamlined management and deployment. The platform is designed for high availability, security, and low-latency performance globally.

## Internal Access Only

This repository is private and only accessible to authorized personnel within the ShotDeckAI team. Please ensure proper credentials and permissions are in place before accessing the codebase.

For any questions or assistance, please contact the appropriate team member directly.
