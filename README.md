# 🎓 EduPortal — All-in-One AI-Powered School Management Platform

EduPortal is a modern, responsive, and intuitive school management system designed with four role-based dashboard experiences: **Principal (Admin)**, **Teacher**, **Student**, and **Parent**. It covers academics, communication, operational tools, AI learning assistants, and analytic dashboards.

The main web application lives in the [Web/](file:///l:/Minh%20Spark/Education/Web) directory.

---

## 🛠️ Tech Stack

EduPortal is built with modern frontend technologies optimized for performance and fluid UX:
- **Core Framework**: React 19 (leveraging Lazy Loading & Suspense for code splitting and fast page transitions).
- **Build Tool**: Vite 8 (Hot Module Replacement for rapid development).
- **Styling**: Vanilla CSS utilizing CSS Custom Properties (`--accent-primary`, `--bg-glass`, etc.) with a premium **Glassmorphism** layout and adaptive Light/Dark mode support.
- **Icons**: `lucide-react` for a clean, consistent minimalist icon set.
- **Deployment**: Configured for serverless hosting on **Vercel** via `vercel.json` in the workspace root.

---

## 📂 Directory Structure

The codebase is organized cleanly to separate routing, shared state, custom styles, and components:

```text
Education/
├── vercel.json               # Vercel deployment configuration at the root
├── package.json              # Aggregate script to install & build from root
├── README.md                 # Project documentation (This file)
└── Web/                      # React frontend codebase
    ├── index.html            # HTML entry point
    ├── package.json          # Node dependencies and scripts
    ├── vite.config.js        # Vite build configurations
    └── src/                  # Main source files
        ├── main.jsx          # React DOM entry file
        ├── App.jsx           # Routing & App Shell router
        ├── App.css           # Global layout styles
        ├── index.css         # CSS resets, root variable configurations
        ├── context/          
        │   └── AppContext.jsx # Shared global state, functions, and simulated databases
        ├── data/             
        │   └── mockExamsData.js # Static mock data for exam simulation & history
        ├── styles/           
        │   ├── theme.css     # Dark/Light mode theme system
        │   ├── design-system.css # Standard utilities (Glass panels, cards, buttons)
        │   └── components.css # Component-specific stylesheet
        └── components/       # UI Components library
            ├── PrincipalDashboard.jsx # Principal / Admin-specific workspace
            ├── TeacherDashboard.jsx   # Teacher workspace
            ├── StudentDashboard.jsx   # Student overview dashboard
            ├── ParentHub.jsx          # Parent portal
            ├── student/               # Student sub-tab components
            │   ├── AiAdvisorTab.jsx   # AI career counseling simulator
            │   ├── UniversityMatchmakerTab.jsx # Score-based university matching
            │   ├── StudyPlanTab.jsx   # Tailored student learning plans
            │   ├── MockExamTab.jsx    # Real-time online test simulator
            │   ├── WalletIdTab.jsx    # Student ID card with simulated VietQR wallet
            │   └── ...
            ├── teacher/               # Teacher sub-tab components
            │   └── AiLessonPlannerTab.jsx # AI-powered lesson plan generator
            └── ... (Other utility panels)
```

---

## 🔑 Role-Based Features Matrix

The app automatically adjusts the Sidebar navigation and dashboard layouts based on the logged-in user session:

### 1. 🎓 Principal (Admin / BGH)
Oversees school-wide operations, performance, and staffing:
*   **Operational KPIs**: Real-time stats on tuition fee collections, attendance rate, total students, and teachers.
*   **HR Management**: Manage Student & Teacher directories with filters for classes and grades.
*   **Digital Class Journal**: Access logs of class activities, topics taught, and teacher remarks.
*   **AI Risk Analysis**: Predictive risk identification for academic failure or behavioral issues.
*   **Class Performance Comparison**: Interactive bar charts comparing exam results across different classrooms.
*   **Asset Management**: Monitor inventory, school equipment, and maintenance statuses.
*   **Operational Schedules**: Manage duty rosters (Duty Schedule) and teacher clock-ins (Teacher Attendance).

### 2. 👩‍🏫 Teacher
Facilitates learning and communicates with parents:
*   **Gradebook Manager**: Edit marks directly for students in assigned classes.
*   **Interactive Seating Chart**: Drag-and-drop desk editor to assign student seating arrangements visually.
*   **AI Lesson Planner**: Generates full lesson plans (objectives, duration, core activities) using simulated AI templates.
*   **Classroom Ops**: Create classroom polls (Class Voting) and post school announcements (Bulletin Board).
*   **Parent Liaison**: Schedule parent-teacher conferences (Meeting Booking) and send secure messages (Direct Chat).
*   **EduMeet**: Set up mock video conferences with simulated media interfaces.

### 3. 🧑‍🎓 Student
Implements an interactive learning environment with gamification hooks:
*   **AI Tutor 24/7**: Resolves homework problems in Math, Physics, Chemistry, and Literature with mathematical formulas formatted using LaTeX.
*   **AI Essay Grader**: Analyzes English or literature essays, scoring them across Rubric dimensions (Grammar, Vocabulary, Ideas, Organization) with inline edits.
*   **Mock Exams**: Practice mock national exams with timers, scoring, and performance diagnostic panels.
*   **University Matchmaker**: Predicts university admission rates using historic benchmarks and the student's mock grades.
*   **Digital Library**: Browse catalog titles, request loans, and track returns.
*   **Student Wallet (Wallet ID)**: Simulated digital ID card equipped with a VietQR wallet code for cafeteria meal payments.
*   **Web Lab**: Code editor playground to write and execute HTML/CSS/JS directly in the browser.
*   **Wellness & Counseling**: Track mental wellbeing and submit requests for school counselor consultations.
*   **Gamification**: Earn study badges and check leaderboard positions.

### 4. 👨‍👩‍👦 Parent
Maintains a direct link to student progress and payment obligations:
*   **Academic Tracker**: Check student report cards and teacher reviews for semesters 1 and 2.
*   **Attendance & Leaves**: Monitor RFID check-in timestamps and submit digital leave requests.
*   **Report Card Sign-off**: Digitally sign report cards online.
*   **Tuition Billing**: Track invoices (tuition, lunches) and complete simulated payments using VietQR codes.
*   **Communication Hub**: Book 1-on-1 parent-teacher meetings and chat with teachers.

---

## 🤖 Deep Dive: AI Core Features

EduPortal features a mock AI intelligence engine running directly in the browser to simulate realistic responses:

1.  **AI Tutor**: Analyzes input queries. Specific subject triggers (such as *integral*, *friction*, *chemical reactions*, *literary analysis*) yield detailed pedagogical breakdowns with syntax-highlighted LaTeX equations.
2.  **AI Essay Grader**: Scores written submissions. It measures word count, paragraph counts, and sentence variety to output a 4-point radar evaluation chart highlighting recommendations.
3.  **AI Risk Analysis**: Evaluates GPA, unexcused absences, and negative conduct reports to assign a student risk score (High, Medium, Low), aiding early intervention.
4.  **University Matchmaker**: Maps mock test outcomes and major choices to historical cutoff scores of top universities in Vietnam to present acceptance probability scores.

---

## 🚀 Installation & Local Development

Set up and run the application locally on your machine:

### System Prerequisites
- [Node.js](https://nodejs.org/) (LTS 18 or later recommended).
- `npm` packet manager.

### Steps to Run

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/buidangminh23/Education.git
    cd Education
    ```

2.  **Install Dependencies & Build Project**:
    You can trigger the top-level shortcut script:
    ```bash
    npm run build
    ```
    
    *Or manually build within the `Web/` workspace:*
    ```bash
    cd Web
    npm install
    npm run dev
    ```

3.  **Open in Browser**:
    Navigate to the output address shown in the terminal:
    ```text
    http://localhost:5173
    ```

---

## ☁️ Vercel Deployment

The project is fully pre-configured to build on Vercel. The root file [vercel.json](file:///l:/Minh%20Spark/Education/vercel.json) handles building from the subfolder workspace:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "Web/dist",
  "installCommand": "npm install --prefix Web",
  "framework": null
}
```

Simply push commits to the `main` branch of your connected GitHub repository to trigger an automatic deployment pipeline.
