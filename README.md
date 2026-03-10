# PlacePrep – Student Learning & Placement Preparation Platform

PlacePrep is a student-focused learning and placement preparation platform designed to help learners prepare for aptitude tests, technical interviews, and job recruitment processes.

The goal of PlacePrep is to transform unstructured placement preparation into a **structured, data-driven learning system**.

Students often prepare randomly for placements without understanding company requirements, interview patterns, or their own readiness level. PlacePrep aims to solve this by combining preparation tools, company insights, and AI-powered assistance in one platform.

---

# Problem Statement

Multiple studies highlight major gaps in campus placement readiness.

• According to the **Unstop Talent Report 2024**, **66% of recruiters report skill gaps in campus hiring**.
• Assessment platforms like **Mettl** report that many students fail during **aptitude and reasoning tests**.
• Research on student employability shows that students struggle during **written tests, group discussions, and interviews**.
• A **Times of India report** indicates that **only 1 in 3 job seekers feel interview-ready**.

These gaps show that students need **structured preparation tools rather than scattered resources**.

---

# Current Prototype Features

The current version of PlacePrep is a **functional prototype** that demonstrates the core structure of the platform.

### Authentication System

Students can create accounts and log in securely using Firebase authentication.

### Student Dashboard

A centralized dashboard where users can access preparation tools, track progress, and navigate through platform resources.

### Company Preparation Pages

Students can view information related to different companies and preparation areas.

### Practice Sections

Practice pages for preparation resources and learning materials.

### Modular Component Architecture

The platform uses reusable UI components for scalable frontend development.

---

# System Architecture

PlacePrep follows a modern full-stack web architecture using Next.js and Firebase.

```id="9fd3aw"
User (Browser)
      │
      ▼
Next.js Frontend (React + TypeScript)
      │
      ▼
Application Logic Layer
      │
 ┌───────────────┬───────────────┐
 ▼               ▼               ▼
Firebase Auth   Firestore DB   AI Services (Future)
(Authentication) (User Data)   (Mock Interviews,
                               Resume Builder)
```

### Architecture Overview

**Frontend Layer**
Built using Next.js with React and TypeScript for dynamic UI rendering.

**Authentication Layer**
Firebase Authentication manages secure user login and signup.

**Database Layer**
Firestore stores user data, preparation progress, and platform content.

**AI Layer (Future Integration)**
AI models will generate mock interviews, resume variations, and personalized preparation strategies.

---

# Project Structure

```id="dy4kn0"
placeprep/
│
├── app/                # Next.js App Router pages
│   ├── auth/           # Login / Signup pages
│   ├── dashboard/      # Student dashboard
│   ├── companies/      # Company preparation pages
│   ├── practice/       # Practice questions
│   └── resources/      # Learning resources
│
├── components/         # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Firebase configuration and utilities
├── public/             # Static assets
├── styles/             # Global styles
```

---

# Planned Features (Future Roadmap)

The following features represent the **long-term vision of PlacePrep**.

### AI Mock Interviews

Mock interviews dynamically generated based on a student’s preparation level and target companies.

### AI Resume Builder

Automatically generate tailored resumes using data from GitHub, LinkedIn, and student activity.

### Personalized Learning Engine

Adaptive preparation plans based on performance and learning behavior.

### Placement Analytics

Readiness score, progress tracking, and performance insights.

### Community & Interview Experiences

Students can share real interview experiences for different companies.

### Recruiter Dashboard

Companies can access verified candidate profiles and preparation analytics.

---

# Tech Stack

Frontend
• Next.js
• React
• TypeScript
• Tailwind CSS

Backend & Infrastructure
• Firebase Authentication
• Firestore Database
• Firebase Hosting

Future AI Integration
• LLM-based interview simulation
• Resume generation systems
• Learning recommendation models

---

# Demo

A live demo can be deployed using Vercel.

Example:

```
https://placeprep-student-learning-platofrom-a1s77eql7.vercel.app/
```




# Screenshots
HomePage
---<img width="2293" height="1116" alt="Screenshot 2026-03-06 220217" src="https://github.com/user-attachments/assets/b2aa22b5-81f9-4b3a-862e-c46bbb9ae4d2" />

DashBoard
---<img width="2541" height="1295" alt="Screenshot 2026-03-07 005940" src="https://github.com/user-attachments/assets/f1ecad96-f1b8-47e3-b915-37b7e4b13152" />

Practice Section
---<img width="2536" height="1301" alt="Screenshot 2026-03-07 005806" src="https://github.com/user-attachments/assets/8383be64-75e2-4d89-a73b-4cc8fb1520ab" />

---

# Running the Project Locally

Clone the repository

```
git clone https://github.com/itsak98t-hue/Placeprep-Student-Learning-Platofrom.git
```

Install dependencies

```
npm install
```

Run the development server

```
npm run dev
```

Open in browser

```
http://localhost:3000
```
