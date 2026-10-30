# PulseCord — Full-Stack Discord-Inspired Communication Platform

PulseCord is a production-ready, high-performance real-time communication platform inspired by Discord. It provides real-time text messaging, multi-user WebRTC voice channels, live camera video calls, browser-native 1080p60 screen sharing, servers/communities, RBAC roles and permissions, friends & direct messages, audit logs, and full GitHub + Railway deployment automation.

---

## 1. Key Implemented Features

### Real-Time Messaging (`tables/messages` & `tables/direct_messages`)
- **Instant Message Delivery & Multi-Tab Synchronization**: Messages, edits, deletions, reactions, pins, and threads persist in the relational database (`tables/*`) and synchronize across open sessions in real time via `BroadcastChannel` and WebSockets.
- **Rich Message Actions**:
  - **Reply** to any message with contextual quote banners.
  - **Edit & Delete** own messages (or moderate others' messages with `MANAGE_MESSAGES` permission).
  - **Emoji Reactions**: One-click reaction pills (`🚀`, `🔥`, `👍`, `❤️`, `🎉`, `⚡`, etc.) with live counters.
  - **Pin Messages**: Pin important announcements and view them in the channel **Pinned Messages** drawer.
  - **Threads**: Create and reply inside dedicated side-panel message threads.
  - **Search & Pagination**: Filter channel messages in real time and paginate historical messages on demand (`Load Earlier Messages`).
  - **File Attachments**: Deliberate binary upload integration targeting `/files/attachments` (never storing Base64 in database rows).

### WebRTC Voice Channels, Video Calls & Screen Sharing (`js/webrtc.js`)
- **Multi-User Voice Channels**: Join `Architecture Sync (Voice/Video)` or `Pair Programming Lounge` to connect with real microphone capture (`navigator.mediaDevices.getUserMedia`), echo cancellation, and noise suppression.
- **Real-Time Voice Activity Detection (VAD)**: Uses the browser's `AudioContext` + `AnalyserNode` FFT frequency spectrum to render a live green speaking ring around active speakers.
- **Mute & Deafen Controls**: Accessible from both the bottom-left user control bar and the central voice theater dock.
- **Live Camera Grid**: Toggle your hardware webcam (`720p`) or automatic WebRTC canvas stream fallback so multi-participant video grids work on every device.
- **Browser-Native Screen Sharing**: Click **Share Screen** to capture your screen, application window, or browser tab via `navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always', frameRate: 60 }, audio: true })`, or click **Stream IDE Screen** to test a live 60fps telemetry stream without an OS prompt.
- **Hardware Device Selector**: Enumerates audio input microphones, audio output speakers, and video cameras via `navigator.mediaDevices.enumerateDevices()`.

### Servers, Channels, RBAC Roles & Moderation
- **Server Management**: Create new servers, join servers via invite codes (`pulsecord-hq`, `railway-builders`, `nexus-gaming`), edit server overview/region, leave, or delete servers.
- **Channel Types**: Supports `# Text`, `🔊 Voice & Video`, `📢 Announcement`, and `💬 Forum` channels organized by category.
- **Role-Based Access Control (RBAC)**: Create custom roles, customize hex colors, and toggle bitfield permissions (`ADMINISTRATOR`, `MANAGE_SERVER`, `MANAGE_ROLES`, `MANAGE_CHANNELS`, `KICK_MEMBERS`, `BAN_MEMBERS`, `MANAGE_MESSAGES`, `SEND_MESSAGES`, `CONNECT_VOICE`, `SPEAK_VOICE`, `STREAM_VIDEO`).
- **Moderation & Audit Logs**: Kick or ban members and inspect every administrative action in the immutable **Audit Log** tab.

### Authentication, User Profiles, Friends & Direct Messages
- **Account Switcher & Registration**: Register new accounts with SHA-256/Bcrypt-formatted password hashing or switch instantaneously between seeded engineering personas (`Alex Rivera`, `Elena Vance`, `Marcus Chen`, `Sora Takahashi`, `Liam O'Connor`) in **User Settings** to test multi-user permissions.
- **Custom Presence**: Set status (`Online`, `Idle`, `Do Not Disturb`, `Offline`) and custom status messages.
- **Friends & Group DMs**: Filter friends by `Online`, `All`, `Pending`, `Blocked`, or `Add Friend`, and launch 1-on-1 or Group DM voice/video calls.

---

## 2. Project Structure

```text
├── index.html                  # Main application entry point (4-column Discord layout)
├── css/
│   └── style.css               # Dark & Light theme tokens, animations, voice/video grids
├── js/
│   ├── api.js                  # Table API CRUD wrapper, /files/attachments uploader & event bus
│   ├── webrtc.js               # Real WebRTC media, Web Audio FFT VAD & getDisplayMedia engine
│   └── app.js                  # Main UI state, RBAC evaluator, modals & interactive handlers
├── prisma/
│   └── schema.prisma           # 18 PostgreSQL relational models with composite indexes
├── server/
│   └── index.ts                # Production Node.js/TypeScript/Express/Socket.IO/LiveKit server
├── Dockerfile                  # Multi-stage Node 20 Alpine production container build
├── railway.json                # Railway deployment manifest with /api/health probe & migrations
├── package.json                # Full-stack dependencies & build scripts
├── .env.example                # Production environment variables template
└── .gitignore                  # Git ignore rules protecting secrets and build artifacts
```

---

## 3. Railway & GitHub Deployment Guide

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "feat: complete PulseCord communication platform"
git branch -M main
git remote add origin https://github.com/your-org/pulsecord.git
git push -u origin main
```

### Step 2: Provision Railway Services
1. Create a new project on **[Railway](https://railway.app)** and select **Deploy from GitHub repo**.
2. Add a **PostgreSQL** database service (`+ New` → `Database` → `Add PostgreSQL`). Railway automatically injects `DATABASE_URL`.
3. *(Optional)* Add a **Redis** service for horizontal `Socket.IO` scaling across multiple replicas.
4. Configure the environment variables listed in `.env.example` (`JWT_ACCESS_SECRET`, `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`).
5. Railway automatically detects `railway.json` and `Dockerfile`, runs `npx prisma migrate deploy`, starts the server on `0.0.0.0:$PORT`, and monitors `/api/health`.
