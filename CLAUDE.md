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

## Backend API
- **Hosted API Documentation**: https://oki.wchapel.com/api/documentation#/
- **Local Codebase**: Developed in the project **`isokariari-v3`** (located at `C:\Users\USER\Herd\isokariari-v3`).
- **OpenAPI / Swagger Spec**: The OpenAPI JSON specification is located at `C:\Users\USER\Herd\isokariari-v3\storage\api-docs\api-docs.json`.
- When working on features that require API changes or integrations, refer to the local codebase for controllers, models, and routes, and use the Swagger/OpenAPI documentation as reference.

