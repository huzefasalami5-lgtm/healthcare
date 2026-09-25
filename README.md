# CuraReach AgentX
> **Theme:** Agentic AI for Healthcare and Life Sciences  
> **Tagline:** Autonomous 7-Agent Healthcare Coordination & Referral Network for Rural & Underserved Communities in India

---

## 1. Problem Statement
Rural and underserved communities across India face extreme difficulty accessing the right healthcare service at the right time due to:
- **Fragmented Information:** Lack of real-time visibility into bed, specialist, and medical oxygen availability at higher-tier referral hospitals.
- **Limited Resources & Stockouts:** Primary Health Centres (PHCs) frequently encounter sudden stockouts of life-saving drugs or defective diagnostic equipment.
- **Physical & Connectivity Barriers:** Rough mountainous terrain, unpaved roads, and constrained 2G/offline cellular networks impede emergency communications.
- **Delayed & Blind Referrals:** Patients are often sent without pre-referral stabilization or destination facility intimation, resulting in ambulance deaths and critical care delays.
- **Broken Care Continuity:** Zero longitudinal tracking after hospital discharge leads to lost-to-follow-up cases and preventable mortality.

---

## 2. Final Solution: Agentic Collaborative Network
**CuraReach AgentX** replaces conversational chatbots with a synchronized multi-agent grid executing the standardized healthcare workflow:

$$\text{PREDICT} \longrightarrow \text{TRIAGE} \longrightarrow \text{MATCH} \longrightarrow \text{COORDINATE} \longrightarrow \text{REFER} \longrightarrow \text{FOLLOW-UP}$$

Visible demonstration of 7 cooperating AI agents passing structured JSON payloads to synthesize one unified, explainable care pathway with strict human-in-the-loop clinical verification.

---

## 3. Seven Cooperating AI Agents

| # | Agent Name | Core Mandate | Key Inputs | Output Signals |
|---|---|---|---|---|
| **01** | **Triage Agent** | Urgency stratification into 4 tiers (`LOW`, `MODERATE`, `HIGH`, `EMERGENCY`). Red-flag vital decompensation detection. | Bedside vitals (SpO2, RR, HR, BP, Temp), acute symptoms, comorbidities. | Severity tier, vital red-flag list, clinical stabilization directives. |
| **02** | **Access Intelligence Agent** | Transit delay prediction and physical/cellular barrier modeling. | GPS/village geography, terrain condition, road passability, network signal. | Access risk (`LOW`, `MEDIUM`, `HIGH`), 108 ambulance response delay (mins), teleconsult viability. |
| **03** | **Facility Agent** | Tiered healthcare node matching (Sub-Centre $\to$ PHC $\to$ CHC $\to$ District Hospital $\to$ Medical College). | Candidate facility registry, bed count, distance, travel time, capability score. | Matched facility, capability match score (0-100%), referral necessity flag. |
| **04** | **Resource Agent** | Real-time supply verification across 4 essential pillars (Meds, Diag, Doctors, Oxygen). | Origin vs destination inventory stockouts, oxygen manifold status, doctor duty roster. | Pillar statuses (`Available`, `Partial`, `Stockout`), missing items list, transport contingency. |
| **05** | **Coordinator Agent** | Multi-agent synthesis and unified clinical care pathway formulation. | Aggregated outputs from Triage, Access, Facility, and Resource agents. | Unified care pathway title, action priority, comprehensive "WHY" explainability. |
| **06** | **Referral Agent** | Capability-aware referral protocol and digital handover slip generation. | Origin deficit analysis, destination acceptance protocol, transport type (108 ALS vs BLS). | Official digital referral slip, QR authentication token, pre-referral transit directives, doctor sign-off action. |
| **07** | **Care Continuity Agent** | Longitudinal care timeline, ASHA community health worker integration, and telephony alerts. | Inpatient milestones, discharge orders, ASHA domiciliary checklist, patient telephony. | Milestone tasks tracker, ASHA 48-hour checklist, automated SMS text dispatch, next review target. |

---

## 4. Key Safety & Regulatory Requirements
- **Clinical Decision Support Only:** The system explicitly does **NOT** diagnose medical conditions or replace certified medical practitioners.
- **Mandatory Disclaimer Banner:**  
  *“AI-generated decision support. Not a medical diagnosis. Human verification is required.”*
- **Escalation Protocol:** For `HIGH` and `EMERGENCY` cases, the system mandates a registered medical officer (RMO) sign-off prior to ambulance dispatch.
- **Synthetic Data Compliance:** Uses 100% synthetic, non-PII clinical patient cases for demonstration and testing.

---

## 5. Technology Stack
- **Frontend:**
  - React 19 + TypeScript + Vite
  - Tailwind CSS (Tailored dark medical theme with glassmorphism & pulse animations)
  - Lucide React icons
  - Recharts (Interactive vital telemetry progression charts & facility multi-attribute readiness matrix)
  - Fully responsive, accessible, judge-optimized layout
- **Backend:**
  - Python 3.11+
  - FastAPI + Uvicorn
  - Pydantic v2 data validation schemas
  - Deterministic clinical heuristic engine (guaranteed 100% crash-free hackathon reliability)
  - Optional Gemini Generative AI LLM integration via `GEMINI_API_KEY`
- **Data & Geography:**
  - Realistic Karnataka rural health infrastructure dataset (Shivamogga, Bhadravathi, Kudligere, Holalur) adhering to Indian Public Health Standards (IPHS).

---

## 6. Project Architecture & Folder Structure

```
curareach-agentx/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── base_agent.py
│   │   │   ├── triage_agent.py
│   │   │   ├── access_agent.py
│   │   │   ├── facility_agent.py
│   │   │   ├── resource_agent.py
│   │   │   ├── coordinator_agent.py
│   │   │   ├── referral_agent.py
│   │   │   └── continuity_agent.py
│   │   ├── data/
│   │   │   ├── demo_patients.json
│   │   │   ├── facilities.json
│   │   │   └── resources.json
│   │   ├── models/
│   │   │   ├── agent_schemas.py
│   │   │   ├── facility.py
│   │   │   ├── patient.py
│   │   │   └── referral.py
│   │   ├── services/
│   │   │   ├── facility_service.py
│   │   │   ├── llm_service.py
│   │   │   └── orchestration_service.py
│   │   ├── config.py
│   │   └── main.py
│   ├── .env.example
│   ├── requirements.txt
│   └── run_backend.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AgentActivityPanel.tsx
│   │   │   ├── AgentFlowVisualizer.tsx
│   │   │   ├── CareTimeline.tsx
│   │   │   ├── CoordinatorPathwaySummary.tsx
│   │   │   ├── CustomPatientModal.tsx
│   │   │   ├── FacilityComparisonChart.tsx
│   │   │   ├── FacilityMatching.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── JudgeDemoModal.tsx
│   │   │   ├── PatientOverview.tsx
│   │   │   ├── PatientPortal.tsx
│   │   │   ├── PatientRegistration.tsx
│   │   │   ├── ReferralPathway.tsx
│   │   │   ├── ResourceAvailability.tsx
│   │   │   ├── ThemeSelector.tsx
│   │   │   ├── TriageCard.tsx
│   │   │   └── VitalsTelemetryChart.tsx
│   │   ├── data/
│   │   │   └── mockPatients.ts
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
└── README.md
```

---

## 7. Installation & Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python run_backend.py
```
*Backend will start on `http://127.0.0.1:8000` (API Docs: `http://127.0.0.1:8000/docs`).*

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend will start on `http://127.0.0.1:5173/`.*

---

## 8. Environment Variables

Create `backend/.env` (optional):
```env
APP_NAME="CuraReach AgentX"
VERSION="1.0.0"
PORT=8000
HOST="0.0.0.0"

# Optional: Gemini API Key for dynamic LLM reasoning
# If left empty, system operates in deterministic multi-agent mode with zero API key dependencies
GEMINI_API_KEY=""
```

---

## 9. Primary Demo Instructions
1. Open `http://127.0.0.1:5173/` in any modern web browser.
2. Observe the active patient profile: **Rameshappa G. (58y, Male)** presenting with acute fever, progressive dyspnea, SpO2 88%, and tachypnea (RR 28/min).
3. Click **"Start Care Assessment"**:
   - Watch the 7 agent nodes animate sequentially in the **Agent Intelligence Pipeline**.
   - Note the **Triage Card** escalating urgency to `EMERGENCY`.
   - Observe **Facility Agent** matching **Holalur CHC / District Hospital** with a 91%+ capability match.
   - Inspect **Resource Agent** highlighting origin PHC oxygen deficiency and essential antibiotics stockout.
   - Review the **Official Digital Referral Slip** with ABHA QR auth token.
   - Click **"Sign & Authorize Transfer"** to simulate the registered doctor's digital sign-off.
   - Toggle milestones in the **Longitudinal Care Timeline** to demonstrate interactive task completion.
4. Click **"Judge Demo Mode"** in the top bar to open the guided 8-slide presentation deck.
5. Click **"Customize"** in the Patient Overview to simulate custom patient vitals and terrain.

---

## 10. Key Backend API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Network status and agent registration health check |
| `GET` | `/api/agents/status` | Real-time status of all 7 autonomous agents |
| `GET` | `/api/facilities` | Healthcare facility registry (Sub-Centres to District Hospitals) |
| `GET` | `/api/resources` | Live inventory and stockout data |
| `GET` | `/api/demo/patients` | Synthetic clinical patient presets |
| `POST` | `/api/patient/register` | Enrolls new patient with ABHA ID & triggers 7-agent care workflow |
| `GET` | `/api/patients` | Retrieve all registered community patient profiles |
| `GET` | `/api/patient/{id}` | Retrieve specific patient registration record |
| `POST` | `/api/patient/assess` | Executes full 7-agent coordination workflow |
| `POST` | `/api/workflow/run` | Alias for patient assessment workflow |
| `GET` | `/api/patient/{id}/timeline` | Retrieve longitudinal care milestones |
| `POST` | `/api/timeline/update` | Update task status (`pending`, `in_progress`, `completed`) |
| `POST` | `/api/referral/create` | Doctor clinical authorization sign-off |

---

## 11. Future Scope
- **Offline Mesh Networking:** P2P Bluetooth / Wi-Fi Direct sync between ASHA tablets in dead zones.
- **National Health Stack (ABHA) Integration:** Direct HL7/FHIR export to Indian Ayushman Bharat Digital Mission (ABDM).
- **Multilingual Voice Bot Integration:** Voice-to-structured telemetry in Kannada, Hindi, Telugu, and Tamil.
