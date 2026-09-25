# CuraReach 360 — Complete Patient Journey & Agentic Coordination Network

> **Theme:** Agentic AI for Healthcare and Life Sciences  
> **Tagline:** Autonomous 4-Agent Healthcare Coordination Grid with 5 Role Dashboards, Persistent Database, 18-State Machine, and Vercel Ready Architecture.

---

## 1. Executive Summary

**CuraReach 360** is an enterprise-grade, database-first patient care coordination platform tailored for underserved and rural healthcare systems in India. It bridges community-level triage with tertiary healthcare facilities through:
- **Five Dedicated Role-Based Dashboards:** Patient, Community Health Worker (ASHA), Doctor Coordinator, Hospital Staff, and Admin.
- **Four Cooperating AI Agents:** Clinical Intake Agent, Care Intelligence Agent, Adaptive Referral Agent, and Care Rescue Agent.
- **Human Clinician Guardrails:** AI agents propose triage, facilities, and follow-ups; only credentialed clinicians and hospital staff can authorize transfers and appointments.
- **18-State Audit Trail:** Enforced clinical state machine with strict transition validation and tamper-evident audit logging.
- **Complete Medical & Financial Database:** Structured storage for patient registration, medical history, clinical documents/prescriptions, and treatment invoices.
- **Vercel-Ready Architecture:** Clean monorepo structure with serverless Python backend handler and high-performance React SPA.

---

## 2. Directory Structure

```
curareach-agentx/
├── api/                             # Vercel Serverless Function Entry Point
│   └── index.py                     # Mounts FastAPI backend for Vercel Python runtime
├── backend/                         # FastAPI Python Backend
│   ├── app/
│   │   ├── agents/                  # 4 Core AI Agents & Base Engine
│   │   ├── api/v1/                  # REST API Endpoints (auth, cases, records, billing, demo)
│   │   ├── core/                    # Database connection, config, security (JWT/RBAC)
│   │   ├── models/                  # SQLAlchemy ORM Models (patients, cases, records, invoices)
│   │   ├── services/                # Database seed service, orchestrator, LLM engine
│   │   ├── state_machine/           # 18-state clinical transition engine & rules
│   │   └── main.py                  # Master FastAPI application
│   ├── tests/                       # Pytest test suite (18/18 passing)
│   ├── requirements.txt             # Python dependencies
│   ├── run_backend.py               # Local development server runner
│   └── curareach360.db              # Local SQLite database (seeded on start)
├── frontend/                        # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboards/          # 5 Role Dashboards (Patient, Worker, Doctor, Hospital, Admin)
│   │   │   ├── modals/              # Self-Registration, Case Creation, Review modals
│   │   │   └── ui/                  # Reusable UI widgets, badges, telemetry cards
│   │   ├── services/
│   │   │   └── curareachApi.ts      # Adaptive API client (detects local vs production)
│   │   ├── App.tsx                  # Dashboard switching & layout
│   │   └── main.tsx                 # Application bootstrap
│   ├── package.json                 # Frontend dependencies & scripts
│   ├── vercel.json                  # Frontend SPA routing configuration
│   └── vite.config.ts               # Vite bundler configuration
├── package.json                     # Root orchestrator for npm build / dev
├── requirements.txt                 # Root Python requirements for Vercel
├── vercel.json                      # Master Vercel deployment configuration
└── README.md                        # Documentation
```

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts.
- **Backend:** Python 3.11+, FastAPI, SQLAlchemy, SQLite (local & `/tmp` on serverless), PyJWT, Passlib, Pydantic v2.
- **Deployment Platform:** Vercel (SPA + Python Serverless Runtime).

---

## 4. Local Development Quickstart

### Step 1: Clone and Navigate
```bash
cd curareach-agentx
```

### Step 2: Run the Backend
In a terminal:
```bash
cd backend
pip install -r requirements.txt
python run_backend.py
```
*Backend runs on `http://127.0.0.1:8000` (Interactive Swagger Docs: `http://127.0.0.1:8000/docs`).*

### Step 3: Run the Frontend
In another terminal:
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://127.0.0.1:5173/`.*

### Step 4: Run the Backend Test Suite
```bash
cd backend
python -m pytest tests -v
```
*(Verifies all 18 test cases including state transitions, emergency triage bypass, clinician approval gates, and RBAC.)*

---

## 5. Deploying to Vercel

The project is pre-configured with `vercel.json`, `api/index.py`, and `requirements.txt` to deploy directly to Vercel without additional build configuration.

### Option A: Deploy via Vercel Web Dashboard (Recommended)

1. Push your repository to **GitHub** (or GitLab/Bitbucket).
2. Go to [vercel.com](https://vercel.com) and click **"Add New..." $\to$ "Project"**.
3. Import your `curareach-agentx` repository.
4. Keep the **Root Directory** as `./` (the root).
5. Vercel automatically detects:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build --prefix frontend` (from `vercel.json`)
   - **Output Directory:** `frontend/dist`
   - **Serverless API:** `api/index.py` handles `/api/*`
6. Click **Deploy**.
7. Once deployed, both your frontend dashboards and backend API endpoints will be live on your custom `.vercel.app` domain!

### Option B: Deploy via Vercel CLI

From the project root:
```bash
# 1. Install or run Vercel CLI
npx vercel

# 2. Deploy to production
npx vercel --prod
```

### Environment Variables on Vercel (Optional)
If you deploy the backend on a dedicated hosting service (e.g. Render, Railway, AWS ECS) instead of Vercel Serverless:
- `VITE_API_BASE_URL`: URL of your external backend (e.g., `https://api.curareach.example.com/api/v1`).
If omitted, the app automatically communicates with the collocated `/api/v1` routes on Vercel!

---

## 6. Pre-Seeded Hackathon Scenarios

The database automatically initializes on startup with pre-seeded demo records:
- **Scenario A (Emergency Dyspnea):** Ramesh Patel, age 58, severe chest tightness and SpO2 88%. Demonstrates immediate emergency guidance and critical queue escalation.
- **Scenario B (Alternative Hospital Match):** Priya Sharma, age 32, obstetric emergency. Demonstrates hospital rejection handling and automated alternative facility discovery.
- **Scenario C (ASHA Assisted Registration):** Anita Devi, rural patient enrolled with consent by Community Health Worker Sunita Verma.
- **Scenario D (End-to-End Referral):** Full cycle from intake triage $\to$ clinician sign-off $\to$ hospital slot booking $\to$ post-discharge home visit.

---

## 7. Safety, Clinical Compliance & Disclaimers

- **Clinical Decision Support Only:** CuraReach 360 is designed as decision support software and does not replace the diagnosis or prescription of a certified medical practitioner.
- **Mandatory Clinician Sign-Off:** AI suggestions for hospital referral and medication remain in `pending_clinician_review` until a licensed doctor clicks **"Approve & Authorize Referral"**.
