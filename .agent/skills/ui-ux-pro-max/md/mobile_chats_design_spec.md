# Mobile Chats: UI/UX Design Specification & Implementation Guide

This document acts as a comprehensive spec and prompt for the mobile developer/workspace to build the mobile counterpart of the **Isokariari Chats** system. The objective is to achieve a pixel-perfect, premium-feel native layout (using React Native, Flutter, or Swift/Kotlin) that mirrors the features, states, and data models of the Web application.

---

## 🎨 Design System & Visual Aesthetics

To maintain a cohesive look and feel across platforms, the mobile application should adhere to the following visual specifications:

### 1. Color Palette

| Token | Light Mode Value | Dark Mode Value | Usage |
| :--- | :--- | :--- | :--- |
| **Primary/Accent** | `#003399` | `#3b82f6` (Blue 500) | Buttons, new chat badges, individual chat icon |
| **Department Accent** | `#059669` (Emerald 600) | `#10b981` (Emerald 500) | Department badge, department icon, link badges |
| **Group Accent** | `#7c3aed` (Purple 600) | `#a78bfa` (Purple 400) | Group tab indicator, group chat icon |
| **Screen Background** | `#f6f5f8` (Off-white) | `#020617` (Slate 950) | Main background container |
| **Card/Sidebar BG** | `#ffffff` (White) | `#0f172a` (Slate 900) | Thread items, search bars, header |
| **Incoming Bubble** | `#ffffff` (White) | `#1e293b` (Slate 800) | Chat bubbles from other users |
| **Outgoing Bubble** | `#dcf8c6` (WhatsApp Light Green) | `#005c4b` (WhatsApp Dark Green) | Chat bubbles sent by current user |
| **Chat Wallpaper** | `#efeae2` (Beige overlay) | `#020617` (Slate 950 overlay) | Background of the message feed |

### 2. Typography & Iconography
- **Font**: Use modern Sans-Serif (e.g., `Inter`, `Roboto`, or system-default).
- **Icons**: Lucide Icons or similar SVG-based libraries:
  - `MessageSquare` (Individual Chat)
  - `Users` (Department/Group Chat)
  - `Plus` (Create Chat)
  - `Search` (Search Input)
  - `Paperclip` (Attachments)
  - `Link` (Entity Links)
  - `Send` (Send Button)
  - `Download`, `FileText`, `FileSpreadsheet`, `FileCode`, `Image` (Attachment types)

---

## 📱 Layout & Screen Flows

```
  ┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
  │ 🏛️ Chats (Thread List)  │      │ 💬 Active Chat Feed    │      │ ➕ Start New Chat       │
  ├────────────────────────┤      ├────────────────────────┤      ├────────────────────────┤
  │ 🔍 Search chats...     │      │ 👤 Project Team (Group)│      │ [Individual][Dept][Grp]│
  ├────────────────────────┤      ├────────────────────────┤      ├────────────────────────┤
  │ 👥 Dept: Finance   10:30│      │ ┌──────────────────┐   │      │ Select Staff:          │
  │    New document...  [2] │      │ │ Incoming msg    │   │      │ 👤 Jane Doe            │
  │ 👤 Jane Doe        09:15│      │ └──────────────────┘   │      │ 👤 John Smith          │
  │    Let's sync up        │      │ ┌──────────────────┐   │      ├────────────────────────┤
  │ 👥 Generator Team  08:00│      │ │ Outgoing msg (Me)│   │      │ Topic:                 │
  │    Task linked: #4      │      │ └──────────────────┘   │      │ [ Generator Repair ]   │
  │                        │      ├────────────────────────┤      ├────────────────────────┤
  │                     [+]│      │ 📎 🔗 [Type a message] │      │      [Create Chat]     │
  └────────────────────────┘      └────────────────────────┘      └────────────────────────┘
```

### Screen 1: Thread List
1. **Header**: Title "Chats", right-aligned float button `[+]` to open the "Start New Chat" screen.
2. **Search Bar**: Sticky at the top, live-filtering threads by topic or participant name.
3. **Thread List Cards**:
   - Left side: Avatar or Icon (`MessageSquare` for individual, `Users` with green color for department, `Users` with purple color for group).
   - Middle: Thread Name (Staff Name for individual; Department Name + " Department" for department; Topic/Group Name for group) + Last message preview (truncated).
   - Right side: Timestamp of latest message + Unread count badge (`#003399` background with bold white text).

### Screen 2: Active Chat Feed
1. **Header**: Back button, Thread Icon, Thread Name, and optional subtitle (Topic).
2. **Message Feed**: Scroll view automatically scrolling to the bottom.
   - Incoming/Outgoing bubbles with rounded corners (e.g. `border-radius: 16px`, with tail corner sharp).
   - Author name displayed on incoming messages in Department/Group threads (using accent color).
   - **Attachments**:
     - Image: Render preview with tap-to-expand modal.
     - Document (PDF, Word, Excel, ZIP): Render card with extension icon (`FileText`, `FileSpreadsheet`, etc.), name, type description, and inline download button.
   - **Metadata Links**:
     - Render small inline tags at the bottom of the bubble (e.g. `[Task] Generator Maintenance`, `[Equipment] Generator Gen-02`) with the entity type and label.
   - Timestamp inside each bubble (bottom-right corner, low opacity).
3. **Input Row**:
   - `[Link]` Button: Opens a modal to link Entities (`Task`, `Asset`, `Equipment`, `Procurement`).
   - `[Attachment]` Button: Opens native file/image picker.
   - Text Area: Multiline auto-expanding text box.
   - `[Send]` Button: Highlighted in `#003399` (disabled if input, attachments, and links are all empty).

### Screen 3: Start New Chat (Compose Modal)
- **Segmented Tabs**: Toggle between **Individual**, **Department**, and **Group**.
- **Individual Tab**:
  - Staff selection dropdown or search list.
- **Department Tab**:
  - Department dropdown list.
  - Optional Topic text input.
- **Group Tab**:
  - Multi-select staff list (checkboxes).
  - Required Group Name / Topic text input.
- **Action Buttons**: Cancel (dismisses screen) and Create Chat (submits request to API, navigates directly to Screen 2 for that thread).

---

## 🔌 API Integration Interface

All requests must include the user's Bearer token: `Authorization: Bearer <token>`.

### 1. Get Chat Threads
- **Endpoint**: `GET /api/v1/messages`
- **Response Format**:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": [
    {
      "id": 12,
      "topic": "Generator Repair Team",
      "type": "group",
      "department_id": null,
      "created_by": 5,
      "created_at": "2026-05-20T08:00:00.000000Z",
      "unread_count": 2,
      "creator": { "id": 5, "name": "Admin User" },
      "department": null,
      "participants": [
        {
          "id": 20,
          "chat_thread_id": 12,
          "user_id": 5,
          "read_at": "2026-05-20T08:05:00.000000Z",
          "user": {
            "id": 5,
            "name": "Admin User",
            "staff": { "first_name": "Admin", "surname": "User" }
          }
        },
        {
          "id": 21,
          "chat_thread_id": 12,
          "user_id": 3,
          "read_at": null,
          "user": {
            "id": 3,
            "name": "Jane Doe",
            "staff": { "first_name": "Jane", "surname": "Doe" }
          }
        }
      ],
      "messages": [
        {
          "id": 45,
          "chat_thread_id": 12,
          "user_id": 5,
          "body": "Let's align on the generator status.",
          "attachments": [],
          "metadata": { "links": [{"type": "Task", "label": "Repair Generator #2"}] },
          "created_at": "2026-05-20T08:00:00.000000Z"
        }
      ]
    }
  ]
}
```

### 2. Get Thread Messages
- **Endpoint**: `GET /api/v1/messages/thread/{threadId}`
- **Response Format**:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "thread": {
      "id": 12,
      "topic": "Generator Repair Team",
      "type": "group"
    },
    "messages": [
      {
        "id": 45,
        "chat_thread_id": 12,
        "user_id": 5,
        "body": "Let's align on the generator status.",
        "attachments": [
          {
            "name": "generator_schematics.pdf",
            "url": "/storage/chat_attachments/abc123xyz.pdf",
            "mime": "application/pdf"
          }
        ],
        "metadata": {
          "links": [
            { "type": "Task", "label": "Repair Generator #2" }
          ]
        },
        "created_at": "2026-05-20T08:00:00.000000Z",
        "sender": {
          "id": 5,
          "name": "Admin User",
          "staff": { "first_name": "Admin", "surname": "User" }
        }
      }
    ]
  }
}
```

### 3. Send Message / Create Thread
- **Endpoint**: `POST /api/v1/messages`
- **Content-Type**: `multipart/form-data` (required when sending file attachments)
- **Parameters**:
  - `thread_id` (Integer, Optional): ID of the existing thread (if sending to active chat).
  - `target_type` (String, Required if `thread_id` is missing): One of `individual`, `department`, `group`.
  - `receiver_id` (Integer, Required if `target_type` is `individual`): Target user ID.
  - `receiver_ids` (Array of Integers, Required if `target_type` is `group`): Array of participant user IDs.
  - `department_id` (Integer, Required if `target_type` is `department`): Target department ID.
  - `topic` (String, Required if `target_type` is `group`, Optional for `department`): Group/topic name.
  - `body` (String, Optional): The text body.
  - `attachments[]` (Files array, Optional): One or more files to upload.
  - `metadata[links]` (Array of objects, Optional): Entity links formatted as:
    ```json
    [
      { "type": "Task", "label": "Task #120" },
      { "type": "Equipment", "label": "CAT Generator 400" }
    ]
    ```
- **Response Format**:
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "thread": {
      "id": 12,
      "topic": "Generator Repair Team",
      "type": "group"
    },
    "message": {
      "id": 46,
      "chat_thread_id": 12,
      "user_id": 5,
      "body": "File uploaded",
      "attachments": [
        {
          "name": "invoice.pdf",
          "url": "/storage/chat_attachments/inv_123.pdf",
          "mime": "application/pdf"
        }
      ],
      "metadata": null,
      "created_at": "2026-05-20T08:15:00.000000Z",
      "sender": {
        "id": 5,
        "name": "Admin User",
        "staff": { "first_name": "Admin", "surname": "User" }
      }
    }
  }
}
```

### 4. Mark Thread as Read
- **Endpoint**: `POST /api/v1/messages/{threadId}/read`
- **Response Format**:
```json
{
  "success": true,
  "message": "Thread marked as read",
  "data": null
}
```

### 5. Compose Resources (Staff/Departments)
- **Endpoint**: `GET /api/v1/messages/resources`
- **Response Format**:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "staff": [
      { "id": 1, "first_name": "Jane", "surname": "Doe", "user_id": 3 }
    ],
    "departments": [
      { "id": 2, "name": "Finance" }
    ]
  }
}
```

---

## 🛠️ Prompt for Mobile Workspace / AI Developer Assistant

Copy and paste the prompt below directly to your mobile sub-agents or UI/UX workspace tools:

```text
Build a premium, high-fidelity chat feature in our mobile application that integrates with our Laravel thread-based backend.

Core Requirements:
1. Screen Flow: 
   - Screen A (Thread list): Display user's current chats with real-time text searching, read/unread states, badges, and type icons (Individual, Department, Group).
   - Screen B (Chat Feed): Display the message bubbles with specific tail bubbles for outgoing vs incoming messages. Incoming bubbles in group/department chats must display the sender's full name. Supports loading image attachments as previews and document attachments as downloadable card files. Integrates metadata entity links (Task, Equipment, Asset, Procurement) as tags underneath text.
   - Screen C (Compose Modal): A segmented tab view enabling users to initiate:
     a) Individual Chat: select one staff member.
     b) Department Chat: select a department and enter an optional topic.
     c) Group Chat: select multiple staff members and enter a group topic/name.

2. styling guidelines:
   - Use HSL-based Tailwind tokens or stylesheet styles for light/dark mode.
   - Keep a clean off-white background (#f6f5f8), white cards, and WhatsApp-like wallpaper for active feeds.
   - Accent colors: Corporate Blue (#003399) for Individual/Actions, Emerald Green (#059669) for Departments, Purple (#7c3aed) for Groups.

3. API Handlers:
   - GET /api/v1/messages (List threads)
   - GET /api/v1/messages/thread/{threadId} (Thread detail)
   - POST /api/v1/messages (Send message with multi-part attachments and metadata links)
   - POST /api/v1/messages/{threadId}/read (Mark read)
   - GET /api/v1/messages/resources (Dropdown compose options)

Ensure smooth state updates, handling of empty search states, loading spinner feedback, and error handling for file size limitations.
```
