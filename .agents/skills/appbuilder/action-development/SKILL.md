---
name: "Action Development"
description: "TDD workflow for building or modifying Adobe App Builder Runtime actions in the AramarkEDSTaskrunner project. Covers action structure, auth patterns, state store usage, param validation, and testing."
---

# Skill: Action Development

## Purpose

Build or modify Adobe I/O Runtime actions following project conventions with test coverage.

## When to Use

- Adding a new Runtime action
- Modifying an existing action's behavior
- Adding I/O State read/write to an action
- Wiring a new GitHub API call through publish-tokens

---

## Step 1 — Understand the Action Contract

Before writing code, define:
1. **HTTP method** — GET, POST, DELETE, PUT?
2. **Required params** — what must the caller provide?
3. **Auth** — does it need `require-adobe-auth: true`? (yes for all non-public actions)
4. **State keys** — what keys does it read/write in `@adobe/aio-lib-state`?
5. **Response shape** — `{ statusCode, body }` always

---

## Step 2 — Write the Test First

Create `test/<action-name>.test.js` before the action code.

```js
// test/my-action.test.js
const { main } = require('../actions/my-action/index.js');

jest.mock('@adobe/aio-lib-state');
jest.mock('node-fetch');

describe('my-action', () => {
  test('returns 400 when required param is missing', async () => {
    const result = await main({ __ow_headers: { authorization: 'Bearer test' } });
    expect(result.statusCode).toBe(400);
    expect(result.body.error).toBeDefined();
  });

  test('returns 200 with valid params', async () => {
    // arrange, act, assert
  });
});
```

Run: `npm test` — confirm tests fail before implementation.

---

## Step 3 — Scaffold the Action

```js
// actions/my-action/index.js
const { Core } = require('@adobe/aio-sdk');
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } =
  require('../utils');

async function main(params) {
  const logger = Core.Logger('my-action', { level: params.LOG_LEVEL || 'info' });

  try {
    logger.debug(stringParameters(params));

    // 1. Validate auth
    const token = getBearerToken(params);

    // 2. Validate required params
    const requiredParams = ['brand'];
    const requiredHeaders = [];
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
    if (errorMessage) {
      return errorResponse(400, errorMessage, logger);
    }

    // 3. Business logic
    const { brand } = params;
    // ...

    // 4. Return success
    return {
      statusCode: 200,
      body: { result: 'ok' },
    };
  } catch (e) {
    logger.error(e);
    return errorResponse(500, e.message, logger);
  }
}

module.exports = { main };
```

---

## Step 4 — Register in app.config.yaml

```yaml
my-action:
  function: actions/my-action/index.js
  web: "yes"
  runtime: nodejs:22
  inputs:
    LOG_LEVEL: debug
  annotations:
    require-adobe-auth: true
    final: true
```

---

## Step 5 — State Store Pattern (if needed)

```js
const stateLib = require('@adobe/aio-lib-state');

// Initialize (once per action invocation)
const state = await stateLib.init();

// Read
const entry = await state.get(`${brand}:tokens`);
const value = entry?.value ?? null;

// Write (TTL in seconds; 0 = use default ~1 year)
await state.put(`${brand}:tokens`, JSON.stringify(data), { ttl: 0 });

// Delete
await state.delete(`${brand}:tokens`);
```

Key naming convention: `{brand}:{category}` — e.g. `aramark:tokens`, `aramark:config`

---

## Step 6 — Lint and Test

```bash
npm run lint:fix
npm test
```

All tests must pass before proceeding.

---

## Step 7 — Build and Verify

```bash
aio app:build
```

Check the bundle output in `dist/` — verify no unexpected large dependencies were bundled.

---

## Step 8 — Deploy and Smoke Test

```bash
aio app:deploy

# Invoke directly to verify
aio rt:action:invoke AramarkTrailhead/my-action --param brand test --result

# Check activation log
aio rt:activation:list --limit 5
aio rt:activation:logs <id>
```
