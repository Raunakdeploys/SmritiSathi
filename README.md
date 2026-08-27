# 🧠 SmritiSathi

### Adaptive Cognitive Gaming, Memory Assistance & Safety Support for Elderly Users

> **Smart India Hackathon 2026 — SIH26003**  
> **AI-Based Cognitive Gaming and Memory Assistance Platform**

SmritiSathi is an elderly-friendly cognitive assistance platform designed to go beyond conventional memory games. It combines **progressive cognitive training, adaptive difficulty, real-life memory recall, AI-assisted object recognition, progress tracking, and location-based safety features** into one accessible system.

---

## 💡 The Idea

Cognitive decline can affect much more than memory — including **attention, orientation, sequencing, recognition, spatial reasoning and everyday decision-making**.

Instead of building another collection of repetitive brain games, SmritiSathi follows one continuous approach:

### **PLAY → MEASURE → ADAPT → REINFORCE → TRACK → PROTECT**

The system observes how a user performs and aims to make cognitive activities progressively more relevant to their abilities and everyday life.

---

## ✨ Key Features

### 🧠 Cognitive Training
Progressive activities target different cognitive abilities through:

- **Time & Clock Training** — temporal reasoning and planning
- **LifeThread** — familiar people, relationships and memory recall
- **Routine Rescue** — sequencing everyday activities
- **WayBack** — spatial orientation and route memory
- **StorySpark** — attention, comprehension and recall
- **Memory Detective** — observation and memory challenges
- Additional cognitive games for recognition, association and reasoning

---

### ⚡ Adaptive Bridge Challenges

Difficulty should not become a wall.

SmritiSathi considers performance signals such as:

**Accuracy • Response Time • Attempts • Hints**

If a user performs comfortably at one level but repeatedly struggles at the next, the system can introduce an **intermediate Bridge Challenge**.

```text
Level 3 ✓
   ↓
Level 4 → Struggle
   ↓
Personalized Level 3.5
   ↓
Reinforcement
   ↓
Retry Level 4
```

This creates gradual progression instead of simply repeating the same failed challenge.

---

### 📸 Reality Quest — Cognition Beyond the Screen

Reality Quest connects cognitive activity with the user's actual surroundings.

```text
Real-World Challenge
        ↓
Open Camera
        ↓
Capture Object
        ↓
AI-Assisted Verification
        ↓
Result + Mind Points
```

Users may be asked to identify familiar everyday objects, helping extend interaction beyond conventional screen-based puzzles.

---

### 👨‍👩‍👧 Familiar Memory Assistance

SmritiSathi incorporates familiar people, relationships and everyday information into recall-oriented activities.

The aim is to make cognitive engagement **personal and contextual**, rather than relying entirely on generic datasets.

---

### 📍 Safety & Geofencing

The platform also explores a **300 m familiar safety zone** using device location.

The intended safety workflow is:

```text
Location Monitoring
        ↓
300 m Familiar Zone
        ↓
Boundary Exit Validation
        ↓
SOS / Location Information
        ↓
Family Alert Workflow
```

The core idea is simple:

> **A safety system for someone experiencing memory difficulties should minimize dependence on that person remembering to activate it.**

---

### 📊 Mind Points & Progress

Activities contribute to a shared **Mind Points** and progression system.

This provides users and caregivers with a simple representation of:

- completed activities
- game performance
- level progression
- cognitive engagement
- challenge history

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React** | Interactive frontend |
| **TypeScript** | Application logic & type safety |
| **Vite** | Development and production builds |
| **Tailwind CSS** | Responsive, accessible interface |
| **Firebase** | Data and progress persistence where integrated |
| **Google Gemini** | AI-assisted object verification |
| **Camera API** | Reality Quest interaction |
| **Geolocation API** | Location-aware safety features |
| **Git & GitHub** | Version control and collaboration |

---

## 🧩 Core Approach

```text
                 USER INTERACTION
                        ↓
              Cognitive Activities
                        ↓
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
     Accuracy          Time          Attempts
        └───────────────┼───────────────┘
                        ↓
               Performance Analysis
                        ↓
              Adaptive Difficulty
                 ↙             ↘
           Next Level       Bridge Level
                 ↘             ↙
                   Reinforce
                       ↓
                 Track Progress
                       ↓
              Cognitive Assistance
```

---

## 🚀 Running the Project

### 1. Clone the repository

```bash
git clone <YOUR-REPOSITORY-URL>
cd SmritiSathi
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_api_key_here
```

> ⚠️ Never commit your actual API key to GitHub.

### 4. Start development server

```bash
npm run dev
```

### 5. Create production build

```bash
npm run build
```

---

## 🔐 Privacy & Responsible Design

- Camera images used for object verification are intended to be temporary rather than permanently stored.
- API credentials must remain outside the public repository.
- Location information should be handled with minimum necessary storage and appropriate user/caregiver permission.
- SmritiSathi is a **hackathon prototype for cognitive assistance and engagement** and is **not a medical diagnostic or treatment system**.

---

## 🔮 Future Scope

- Native mobile background geofencing
- Fully automated server-side emergency notifications
- Long-term adaptive difficulty based on performance history
- Regional-language and culturally familiar cognitive activities
- Expanded caregiver insights
- Clinician-reviewed cognitive modules
- Larger real-world cognitive challenge library

---

## 🎯 Our Vision

> **SmritiSathi is not just another brain-game platform. It is an attempt to connect cognitive training with familiar memories, real-world interaction, personalization and safety.**

### **Remember • Adapt • Reinforce • Protect ❤️**

---

### 🏆 Smart India Hackathon 2026

**Problem Statement:** SIH26003 — AI-Based Cognitive Gaming and Memory Assistance Platform  
**Institution:** JIS University  
**Project:** SmritiSathi
