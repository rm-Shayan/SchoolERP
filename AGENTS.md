Project Rules
Frontend Code Rules — MANDATORY
1. Read Existing Code Before Making Changes
Always inspect the existing implementation before modifying or adding code.
Read the relevant page, components, hooks, utilities, types, styles, routes, and related tests before making changes.
Understand existing patterns, naming conventions, state management, validation, styling, and component composition before introducing new code.
Do not recreate functionality that already exists somewhere in the codebase.
Before creating a new component, hook, utility, helper, or type, search the existing codebase to determine whether an appropriate reusable implementation already exists.
Preserve existing behavior unless the requested change explicitly requires changing it.
Avoid unrelated refactoring while implementing a feature or fix.
2. Reuse Existing Components First
Prefer existing reusable components over creating new ones.
Check shared UI components, layouts, form components, hooks, utilities, and helpers before implementing alternatives.
If an existing component is close to what is needed, extend or compose it when that is cleaner than duplicating it.
Do not create one-off versions of components that could reasonably be reused.
Keep reusable components generic enough to support their intended use cases without introducing unnecessary complexity.
Follow existing component APIs and design-system conventions.
3. Avoid Unnecessary Dependencies
Do not introduce a new npm/package dependency unless it is genuinely necessary.
Before adding a dependency:
Check whether the project already has a dependency that solves the problem.
Check whether the functionality can be implemented cleanly with existing utilities or native browser/React APIs.
Consider the maintenance, bundle-size, and complexity cost.
Do not add libraries for trivial functionality.
If a new dependency is truly required, explain why it is needed before introducing it.
4. File Length Limit
Every file under frontend/src MUST be 150 lines or fewer.
This includes components, pages, hooks, layouts, utilities, slices, routes, configs, and other source files.
Types may be split by domain, but each type file must also remain at or below 150 lines.
App.tsx, router files, configuration files, and similar files are included in this limit.
Target approximately 140–150 lines maximum, but do not exceed 150.
If a file approaches the limit, proactively split it into logical smaller files.
Prefer extracting:
Reusable components
Sub-components
Hooks
Utility functions
Constants/data
Route configuration
Navigation configuration
Icons
Domain-specific types
Do not artificially compress code just to satisfy the line limit. Split it properly.
5. Form Validation
All forms MUST perform client-side validation before submission.
Use the shared helpers from:
frontend/src/lib/utils/validation.ts
frontend/src/lib/utils/useForm.ts
Do not introduce a separate validation pattern when the shared implementation can be used.
Display validation errors inline using the error prop on Input, Select, and other supported form controls.
Disable the submit button while isSubmitting is true.
Keep validation logic reusable when the same rules are used by multiple forms.
6. Performance
Use useMemo, useCallback, and React.memo where they provide meaningful value, especially for:
Large lists
Expensive derived data
Frequently re-rendered child components
Debounce API-backed search inputs by approximately 150–300ms.
Heavy pages should be lazy-loaded using React.lazy and Suspense.
Do not place new Date() or Math.random() directly inside render logic.
Avoid unnecessary API requests and unnecessary component re-renders.
Do not optimize prematurely; prioritize clear, maintainable code while addressing meaningful performance issues.
7. Responsiveness
Every page MUST work from 375px mobile through desktop.
Use Tailwind responsive prefixes such as sm, md, lg, and xl.
Forms must collapse to a single-column layout on mobile where appropriate.
Tables must use horizontal scrolling on small screens, such as overflow-x-auto.
Navigation bars and sidebars must provide an appropriate mobile-menu/hamburger experience.
Do not assume desktop-sized screens when creating layouts.
8. Keep Changes Focused
Make the smallest clean change that fully solves the requested problem.
Do not modify unrelated files or behavior.
Do not perform broad refactors unless they are required to safely implement the requested change.
Avoid speculative abstractions and premature generalization.
Remove dead code created by your change, but do not clean up unrelated legacy code.
9. Follow Existing Project Conventions
Match the project's existing:
Folder structure
Naming conventions
TypeScript patterns
React patterns
Tailwind/style conventions
State-management approach
API/data-fetching approach
Error-handling approach
Testing patterns
Consistency with the existing codebase takes priority over introducing a personal or preferred pattern.
Do not introduce a second way of solving the same architectural problem without a clear reason.
10. TypeScript and Code Quality
Keep TypeScript types explicit and meaningful.
Avoid any unless there is a documented, unavoidable reason.
Do not duplicate types that already exist.
Keep business logic out of presentation components when it can be cleanly extracted.
Prefer simple, readable functions over overly clever abstractions.
Avoid deeply nested conditionals and unnecessarily complex components.
11. Verification

Before considering a frontend change complete:

Check that every modified file under frontend/src is ≤150 lines.
Run:
npm run lint

Run:
npm run build

Fix lint, type, and build errors introduced by the change.
Verify responsive behavior for mobile and desktop layouts.
Verify form validation and loading/submitting states when applicable.
12. Dependency and Architecture Rule

Before adding something new, follow this order:

Existing component → Existing hook → Existing utility/helper → Existing dependency → Native React/browser API → New dependency only if genuinely necessary.

The default assumption should be:

Reuse first, compose second, extract third, create new functionality only when necessary.

Always prefer a small, clear change that fits the existing architecture over introducing a new pattern.
13. File Naming and File Organization
Use clear, descriptive, and predictable file names.
A file name should communicate what the file contains without requiring the developer to open it.
Follow the existing project's naming convention first. Do not introduce a different naming style.
Recommended Naming
React components: PascalCase
UserProfile.tsx
OrderTable.tsx
MobileSidebar.tsx
Hooks: camelCase with the use prefix
useForm.ts
useDebounce.ts
useUserProfile.ts
Utilities/helpers: descriptive camelCase
validation.ts
formatCurrency.ts
dateUtils.ts
Constants/data: descriptive names matching the existing project convention
navigation.ts
statusOptions.ts
routeConfig.ts
Types: use domain-specific names
user.types.ts
order.types.ts
api.types.ts
Pages: use a clear page name
Dashboard.tsx
UserDetails.tsx
Settings.tsx
Tests should clearly correspond to the file being tested
UserProfile.test.tsx
validation.test.ts
File Organization
Place files in the directory that best represents their responsibility.
Keep components close to the feature/page where they are primarily used.
Move genuinely shared components to the shared components directory.
Do not create generic folders such as misc, stuff, helpers2, or temp.
Avoid vague file names such as:
utils.ts
helpers.ts
common.ts
data.ts
component.tsx
thing.tsx
If a utility/helper file contains unrelated responsibilities, split it into focused files with meaningful names.
Before Creating a New File

Before creating any file:

Search for an existing file that already provides the required functionality.
Check whether the functionality belongs in an existing component, hook, utility, or feature.
Check the surrounding directory for established naming and organization patterns.
Create a new file only when it improves separation of responsibility or is genuinely required.
Give the new file a name that describes its responsibility, not how it happened to be implemented.

Rule of thumb:

A developer should be able to understand a file's purpose from its name alone.

Do not create files just to satisfy the line limit. Split files by responsibility, not arbitrarily.
