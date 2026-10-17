# PROJECT-WIDE STANDARD: EXCEPTIONAL REFERENCE-DRIVEN UI

## Mission
Build original, production-quality digital products with the visual craft of a leading product design studio.
I care about exceptional art direction, precise composition, typography, whitespace, visual hierarchy, responsive behavior, and functional completeness.
A technically correct but visually generic interface is a failed deliverable.

## 1. Reference-first design
Whenever I provide a reference URL, screenshot, or design:
- Inspect the reference visually using available browser tools. Do not rely on its textual content or a superficial description alone.
- Examine the relevant page from top to bottom, including navigation, major sections, footers, and meaningful interaction states.
- Identify the reference's design principles, composition, spacing, typography, color relationships, image treatment, and interaction patterns.
- If browser access or the reference is unavailable, state that explicitly and use any supplied screenshots as evidence.
- Never claim to have inspected pages or states that you did not actually see.
- Produce an original product design informed by the reference. Do not mechanically clone its appearance or blindly reuse its layout.

## 2. No generic AI design
Do not default to:
- Generic SaaS dashboards and template layouts.
- Oversized gradient headlines and glowing backgrounds.
- Excessive rounded cards, nested surfaces, and pill-shaped controls.
- Decorative blobs, floating UI, or gratuitous glassmorphism.
- Repetitive three-column feature grids.
- Random typography, inconsistent spacing, and meaningless icons.
- Placeholder copy, fabricated statistics, fake testimonials, or invented product capabilities.

These patterns are not universally forbidden, but every use must be justified by the product and design direction.
Choose a distinct visual concept before writing components. Every major section should have a reason to exist and a deliberate compositional role.

## 3. Design specification before code
Before implementation, create `docs/DESIGN_AUDIT.md` containing:
- Reference observations and limitations.
- Product audience, primary task, and key user journey.
- Chosen art direction and why it fits the product.
- Typography and type scale.
- Layout, content widths, grid, and spacing system.
- Color, surfaces, borders, shadows, and imagery.
- Component and interaction conventions.
- Responsive behavior.
- Five visual acceptance criteria.

Use real, appropriate design assets and fonts where available. Avoid introducing a large component library solely for convenience when it undermines the chosen art direction.

## 4. Build the actual product
- Inspect the repository and select an appropriate stack based on the project's needs.
- Implement real pages, navigation, interactions, and application states.
- Use semantic HTML, accessible controls, keyboard support, and appropriate contrast.
- Design mobile layouts intentionally rather than shrinking desktop layouts.
- Use genuine product data and real functionality where required.
- Keep components consistent and maintainable.
- Do not silently replace requirements with static mockups or fake interactions.

## 5. Mandatory visual verification
After implementing a meaningful page or design change:
- Start the application using its actual development command.
- Open the running application in the available browser.
- Capture screenshots of the rendered interface.
- Inspect the screenshots yourself.
- Compare the result against the reference and docs/DESIGN_AUDIT.md.
- Identify the five highest-impact visual defects.
- Fix those defects and inspect the updated screenshots.
- Repeat until the acceptance criteria are met or a real limitation prevents further work.
- Inspect the full page, not just the hero. Test desktop, tablet, and mobile layouts, including narrow widths, and verify important interactive states.
- Do not fabricate screenshot evidence. If a screenshot, browser check, or automated test was not performed, report it as unverified.

## 6. Quality gates
Before calling a project complete:
- Confirm every required route works.
- Check for horizontal overflow, broken images, and layout defects.
- Verify forms, navigation, and important user journeys.
- Inspect console errors and relevant network failures.
- Run available lint, type checks, tests, and the production build.
- Check accessibility and reduced-motion behavior.
- Review loading, empty, error, and success states where relevant.
- Review the actual final screenshots after the last code change.
- Use automated visual regression tests where they provide value, but do not mistake a pixel-diff pass for good design.

## 7. Deployment
When Vercel deployment is required:
- Inspect the project and determine whether an existing Vercel project must be preserved.
- Use the intended project, framework settings, environment variables, and production domain.
- Validate the production build before deployment.
- Prefer a preview deployment for final review before production.
- Inspect deployment status and logs.
- Open the actual deployed URL and test the critical user journey.
- Verify the final live result after the last relevant code change.
- Never expose secrets, overwrite an unrelated project, or claim a successful deployment without evidence.

## 8. Execution and communication
- Do the work, not just the planning.
- Use professional judgment instead of asking for approval on every minor decision. Ask only when missing information materially changes the result or a consequential action needs authorization.
- At completion, report:
  - What was implemented.
  - Which visual checks were actually performed.
  - Which tests passed or failed.
  - The verified preview or production URL, if deployed.
  - Any unresolved defects or limitations.
- Do not claim perfection. Demonstrate quality through the rendered result and verified behavior.
