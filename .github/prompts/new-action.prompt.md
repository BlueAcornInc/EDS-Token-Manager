---
mode: "agent"
description: "Scaffold a new Adobe I/O Runtime action following project conventions: action file, test file, app.config.yaml registration, and lint/test validation."
---

Load and follow the skill at `.agents/skills/appbuilder/action-development/SKILL.md`.

Action name: ${input:name:Name for the new action (e.g. get-brands)}

Description: ${input:description:What should this action do?}

Required params: ${input:params:What params must the caller provide? (comma-separated, e.g. brand,method)}

Start at Step 1 (define the contract) and work through the full TDD workflow.
Write the test first, then implement, then register in app.config.yaml.
Run `npm test` and `npm run lint:fix` before finishing.
