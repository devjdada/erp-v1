# Graph Report - erp-app  (2026-05-20)

## Corpus Check
- 72 files · ~88,675 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 508 nodes · 806 edges · 40 communities (33 shown, 7 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `21883a63`
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
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 64 edges
2. `useAuth()` - 40 edges
3. `dependencies` - 32 edges
4. `useTheme` - 21 edges
5. `expo` - 17 edges
6. `styles` - 14 edges
7. `DesignSystemGenerator Class` - 13 edges
8. `useThemeContext()` - 12 edges
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

## Communities (40 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.15
Nodes (14): reactCompiler, typedRoutes, expo, experiments, icon, ios, name, orientation (+6 more)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (15): BM25, detect_domain(), _load_csv(), Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query, Load CSV and return list of dicts, Core search function using BM25 (+7 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (31): dependencies, expo, expo-constants, expo-device, expo-font, expo-glass-effect, @expo-google-fonts/plus-jakarta-sans, expo-image (+23 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (21): HintRowProps, styles, styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, styles (+13 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (33): BM25 Search Algorithm, UI/UX Search Function, Stack Search Function, generate_design_system Function, DesignSystemGenerator Class, persist_design_system Function, DesignSystemGenerator, _detect_page_type() (+25 more)

### Community 6 - "Community 6"
Cohesion: 0.25
Nodes (11): Expo Router Type Declarations, Fleet Inventory Screen, Fleet Navigation Tabs, GPS Tracking Map, Entry Screen, App Navigation Layout, Root Layout, Reset Project Utility (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (12): files, code, document, image, paper, video, graphifyignore_patterns, needs_graph (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.4
Nodes (4): DocumentItem, DocumentsScreen(), StaffDocument, styles

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
Cohesion: 0.07
Nodes (35): AppContent(), AppLayout(), RootLayout(), SettingsScreen(), styles, AuthLayout(), Collapsible, Colors (+27 more)

### Community 27 - "Community 27"
Cohesion: 0.08
Nodes (23): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, android, web (+15 more)

### Community 29 - "Community 29"
Cohesion: 0.29
Nodes (5): main, name, private, version, Expo Icon Configuration

### Community 31 - "Community 31"
Cohesion: 0.4
Nodes (5): devDependencies, eslint, eslint-config-expo, @types/react, typescript

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (6): ApiMessage, DepartmentResource, GroupedThread, MessagesScreen(), StaffResource, styles

### Community 34 - "Community 34"
Cohesion: 0.16
Nodes (18): LoginScreen(), styles, RegisterScreen(), styles, ERPButton(), ERPButtonProps, styles, ERPInput() (+10 more)

### Community 35 - "Community 35"
Cohesion: 0.21
Nodes (6): AnnouncementItem, AnnouncementsScreen(), styles, styles, TabType, WorkOrderScreen()

### Community 36 - "Community 36"
Cohesion: 0.16
Nodes (12): CustomDrawerContent(), styles, useAuth(), ChatScreen(), Message, styles, LoanRecord, LoansScreen() (+4 more)

### Community 37 - "Community 37"
Cohesion: 0.14
Nodes (11): AuthContext, AuthContextType, Staff, User, PermissionRecord, PermissionsScreen(), styles, styles (+3 more)

### Community 38 - "Community 38"
Cohesion: 0.21
Nodes (9): EntryScreen(), FleetVehicles(), styles, Vehicle, ActivityRow(), DashboardStats, MetricCard(), styles (+1 more)

### Community 39 - "Community 39"
Cohesion: 0.33
Nodes (5): Colleague, LeaveBalance, LeaveRequestItem, LeaveScreen(), styles

### Community 40 - "Community 40"
Cohesion: 0.4
Nodes (4): AttendanceLog, CorrectionRequest, CorrectionsScreen(), styles

### Community 41 - "Community 41"
Cohesion: 0.15
Nodes (13): useTheme(), Collapsible(), MovementRecord, MovementsScreen(), styles, ProfileScreen(), styles, ICTTicket (+5 more)

## Knowledge Gaps
- **248 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+243 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `scripts` connect `Community 27` to `Community 0`, `Community 29`?**
  _High betweenness centrality (0.198) - this node is a cross-community bridge._
- **Why does `path` connect `Community 4` to `Community 27`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **Why does `useTheme()` connect `Community 41` to `Community 32`, `Community 34`, `Community 35`, `Community 36`, `Community 37`, `Community 38`, `Community 39`, `Community 40`, `Community 8`, `Community 3`, `Community 24`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _248 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 22` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._