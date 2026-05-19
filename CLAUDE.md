# ERP App Development Guidelines

## Commands
- **Start Dev Server**: `npm run dev` or `npx expo start`
- **Clear Cache & Start**: `npx expo start -c`
- **Linting**: `npx expo lint`
- **Install Dependencies**: `npm install`

## Git Workflow Rule
At the end of every task, always run the following workflow to commit and push changes:
1. Stage all changes: `git add .`
2. Commit changes with a descriptive message (e.g. `feat: add onboarding flow`, `style: update side drawer styling`): `git commit -m "<message>"`
3. Push to remote: `git push origin <branch_name>` (usually `master` or the current branch)
