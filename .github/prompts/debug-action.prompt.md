---
mode: "agent"
description: "Structured debugging workflow for a failing Adobe I/O Runtime action. Fetches activation logs, isolates the failure, diagnoses auth/state/deployment issues, and proposes a fix."
---

Load and follow the skill at `.agents/skills/appbuilder/debug/SKILL.md`.

Target action: ${input:action:Which action is failing? (e.g. manage-tokens)}

Additional context from the user: ${input:context:Describe what you expected vs what happened (optional)}

Start with Step 1 (establish context via `aio where`) and work through the skill sequentially.
Do not skip to a fix before the activation logs have been retrieved and analyzed.
