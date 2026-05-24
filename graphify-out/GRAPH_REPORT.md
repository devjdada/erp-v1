# Graph Report - erp-app  (2026-05-24)

## Corpus Check
- 101 files · ~116,245 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 716 nodes · 1236 edges · 40 communities (32 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4bc1a044`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 48|Community 48]]

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 103 edges
2. `useAuth()` - 58 edges
3. `dependencies` - 35 edges
4. `useTheme` - 21 edges
5. `expo` - 17 edges
6. `styles` - 14 edges
7. `useThemeContext()` - 13 edges
8. `DesignSystemGenerator Class` - 13 edges
9. `scripts` - 11 edges
10. `DesignSystemGenerator` - 11 edges

## Surprising Connections (you probably didn't know these)
- `LoginScreen` --conceptually_related_to--> `Design System Master`  [INFERRED]
  src/app/(auth)/login.tsx → design-system/erp-app/MASTER.md
- `RegisterScreen` --conceptually_related_to--> `Design System Master`  [INFERRED]
  src/app/(auth)/register.tsx → design-system/erp-app/MASTER.md
- `ERPButton` --implements--> `Design System Master`  [INFERRED]
  src/components/ERPButton.tsx → design-system/erp-app/MASTER.md
- `ERPInput` --implements--> `Design System Master`  [INFERRED]
  src/components/ERPInput.tsx → design-system/erp-app/MASTER.md
- `Design System Master` --references--> `ui-ux-pro-max SKILL.md`  [INFERRED]
  design-system/erp-app/MASTER.md → .agent/skills/ui-ux-pro-max/SKILL.md

## Hyperedges (group relationships)
- **UI/UX Pro Max Toolchain** — core_py_search, design_system_py_generate, search_py_main [INFERRED 0.85]
- **App Navigation Layouts** — layout_tsx_app, workspace_layout_tsx_layout, fleet_layout_tsx_layout [INFERRED 0.85]
- **ERP Management Screens** — workspace_index_tsx_dashboard, workspace_tasks_tsx_tasks, fleet_index_tsx_vehicles, fleet_map_tsx_map [INFERRED 0.85]
- **Authentication Flow** — login_loginscreen, register_registerscreen, auth_layout_authlayout [INFERRED 0.95]
- **Theme System Integration** — themed_text_themedtext, themed_view_themedview, use_theme_usetheme, themecontext_themeprovider [INFERRED 0.95]
- **User Entry and Redirection Flow** — onboarding_index_onboardingscreen, login_loginscreen, register_registerscreen [INFERRED 0.85]

## Communities (40 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.15
Nodes (14): reactCompiler, typedRoutes, expo, experiments, icon, ios, name, orientation (+6 more)

### Community 1 - "Community 1"
Cohesion: 0.1
Nodes (33): EntryScreen(), Collapsible, HintRowProps, styles, styles, ThemedText(), ThemedTextProps, ThemedView() (+25 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (34): dependencies, axios, expo, expo-constants, expo-device, expo-font, expo-glass-effect, @expo-google-fonts/plus-jakarta-sans (+26 more)

### Community 3 - "Community 3"
Cohesion: 0.1
Nodes (9): styles, styles, styles, styles, styles, styles, styles, styles (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (48): BM25 Search Algorithm, UI/UX Search Function, Stack Search Function, generate_design_system Function, DesignSystemGenerator Class, persist_design_system Function, BM25, detect_domain() (+40 more)

### Community 6 - "Community 6"
Cohesion: 0.33
Nodes (7): CreateTicketPayload, ticketService, ICTTicket, MOCK_DEPARTMENTS, StaffTicket, styles, TicketsScreen()

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (12): files, code, document, image, paper, video, graphifyignore_patterns, needs_graph (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.25
Nodes (7): compilerOptions, paths, strict, extends, include, @/*, @/assets/*

### Community 10 - "Community 10"
Cohesion: 0.29
Nodes (6): fill, automatic-gradient, groups, supported-platforms, circles, squares

### Community 11 - "Community 11"
Cohesion: 0.25
Nodes (6): enabledPlugins, expo@claude-plugins-official, editor.codeActionsOnSave, source.fixAll, source.organizeImports, source.sortMembers

### Community 12 - "Community 12"
Cohesion: 0.17
Nodes (10): AnimatedIcon, AnimatedSplashOverlay, glowKeyframe, keyframe, logoKeyframe, styles, glowKeyframe, keyframe (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.25
Nodes (6): Expo HAS CHANGED, Backend API, Commands, ERP App Development Guidelines, Git Workflow Rule, Expo v55 compliance

### Community 14 - "Community 14"
Cohesion: 0.4
Nodes (3): Props, ExternalLink, In-App Browser Navigation

### Community 20 - "Community 20"
Cohesion: 0.2
Nodes (9): code:bash (npm install), code:bash (npx expo start), code:bash (npm run reset-project), Get a fresh project, Get started, Join the community, Learn more, Other setup steps (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.05
Nodes (43): Accessibility, Available Domains, Available Stacks, code:bash (python3 --version || python --version), code:bash (python3 skills/ui-ux-pro-max/scripts/search.py "<keyword>" -), code:bash (python3 skills/ui-ux-pro-max/scripts/search.py "beauty spa w), code:bash (# Get UX guidelines for animation and accessibility), code:bash (python3 skills/ui-ux-pro-max/scripts/search.py "layout respo) (+35 more)

### Community 23 - "Community 23"
Cohesion: 0.09
Nodes (21): Additional Forbidden Patterns, Anti-Patterns (Do NOT Use), Buttons, Cards, code:css (@import url('https://fonts.googleapis.com/css2?family=Plus+J), code:css (/* Primary Button */), code:css (.card {), code:css (.input {) (+13 more)

### Community 24 - "Community 24"
Cohesion: 0.25
Nodes (6): exampleDirPath, fs, oldDirs, readline, rl, root

### Community 27 - "Community 27"
Cohesion: 0.2
Nodes (10): web, favicon, output, scripts, android, ios, lint, reset-project (+2 more)

### Community 28 - "Community 28"
Cohesion: 0.29
Nodes (7): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, android

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (10): devDependencies, eslint, eslint-config-expo, @types/react, typescript, main, name, private (+2 more)

### Community 30 - "Community 30"
Cohesion: 0.08
Nodes (23): 1. Color Palette, 1. Get Chat Threads, 2. Get Thread Messages, 2. Typography & Iconography, 3. Send Message / Create Thread, 4. Mark Thread as Read, 5. Compose Resources (Staff/Departments), 🔌 API Integration Interface (+15 more)

### Community 31 - "Community 31"
Cohesion: 0.07
Nodes (37): AppContent(), RootLayout(), SettingsScreen(), styles, AuthLayout(), CustomDrawerContent(), styles, Colors (+29 more)

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (18): messageService, ChatScreen(), Message, styles, ApiMessage, DepartmentResource, GroupedThread, MessagesScreen() (+10 more)

### Community 34 - "Community 34"
Cohesion: 0.16
Nodes (18): LoginScreen(), styles, RegisterScreen(), styles, ERPButton(), ERPButtonProps, styles, ERPInput() (+10 more)

### Community 38 - "Community 38"
Cohesion: 0.08
Nodes (31): AlertButton, AlertContext, AlertContextType, AlertOptions, AlertType, styles, useAlert(), AlertBridge() (+23 more)

### Community 39 - "Community 39"
Cohesion: 0.12
Nodes (9): leaveService, Colleague, LeaveBalance, LeaveRequestItem, LeaveScreen(), MultiDatePickerProps, pickerStyles, styles (+1 more)

### Community 42 - "Community 42"
Cohesion: 0.05
Nodes (54): AppLayout(), useAuth(), FleetLayout(), useTheme(), styles, attendanceService, loanService, toolService (+46 more)

### Community 43 - "Community 43"
Cohesion: 0.1
Nodes (20): Additional Forbidden Patterns, Anti-Patterns (Do NOT Use), Buttons, Cards, code:css (/* Primary Button */), code:css (.card {), code:css (.input {), code:css (.modal-overlay {) (+12 more)

### Community 48 - "Community 48"
Cohesion: 0.14
Nodes (13): CreateRequisitionScreen(), styles, RequisitionDetailScreen(), styles, Requisition, RequisitionItem, RequisitionOptions, RequisitionPayload (+5 more)

## Knowledge Gaps
- **277 isolated node(s):** `styles`, `styles`, `styles`, `styles`, `styles` (+272 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `Community 42` to `Community 32`, `Community 1`, `Community 34`, `Community 3`, `Community 38`, `Community 39`, `Community 6`, `Community 48`, `Community 31`?**
  _High betweenness centrality (0.240) - this node is a cross-community bridge._
- **Why does `scripts` connect `Community 27` to `Community 0`, `Community 24`, `Community 28`, `Community 29`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **Why does `path` connect `Community 4` to `Community 24`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **What connects `styles`, `styles`, `styles` to the rest of the system?**
  _277 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._