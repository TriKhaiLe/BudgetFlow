# BudgetFlow Backend API Contracts (Detailed)

This is a concrete request/response template pack to hand to a backend implementation agent.

## Global Conventions

- Base URL: `${NEXT_PUBLIC_API_BASE_URL}`
- Auth header for protected routes:
  - `Authorization: Bearer <SUPABASE_ACCESS_TOKEN>`
- Content type:
  - `Content-Type: application/json`
- Time format:
  - ISO 8601 in UTC (`2026-04-19T10:20:00.000Z`)
- Money values:
  - Number (same as frontend currently), e.g. `1000000`

## Error Envelope

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

Common codes:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION_FAILED`
- `VERSION_CONFLICT`
- `INTERNAL_ERROR`

---

## 1) GET /api/profile

Purpose: get profile for current Supabase user.

### Request

```http
GET /api/profile HTTP/1.1
Host: api.example.com
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
```

### Success Response (200)

```json
{
  "id": "6f7e8d22-94c5-4c96-bf6f-a55ad0e3818e",
  "email": "user@example.com",
  "username": "john_budget",
  "avatarId": "avatar-2",
  "createdAt": "2026-04-10T08:00:00.000Z",
  "updatedAt": "2026-04-19T09:30:00.000Z"
}
```

### Not Found (404)

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Profile not found"
  }
}
```

---

## 2) PUT /api/profile

Purpose: create/update profile for current user.

### Request

```http
PUT /api/profile HTTP/1.1
Host: api.example.com
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "username": "john_budget",
  "avatarId": "avatar-2"
}
```

### Success Response (200)

```json
{
  "id": "6f7e8d22-94c5-4c96-bf6f-a55ad0e3818e",
  "email": "user@example.com",
  "username": "john_budget",
  "avatarId": "avatar-2",
  "createdAt": "2026-04-10T08:00:00.000Z",
  "updatedAt": "2026-04-19T09:45:00.000Z"
}
```

---

## 3) GET /api/budget/months

Purpose: list all months user has data for.

### Request

```http
GET /api/budget/months HTTP/1.1
Host: api.example.com
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
```

### Success Response (200)

```json
{
  "months": [
    {
      "month": "2026-03",
      "label": "March 2026",
      "updatedAt": "2026-03-31T15:10:00.000Z"
    },
    {
      "month": "2026-04",
      "label": "April 2026",
      "updatedAt": "2026-04-19T09:45:00.000Z"
    }
  ]
}
```

---

## 4) GET /api/budget/state?month=YYYY-MM

Purpose: fetch full `BudgetState` for one month.

### Request

```http
GET /api/budget/state?month=2026-04 HTTP/1.1
Host: api.example.com
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
```

### Success Response (200)

```json
{
  "month": "2026-04",
  "version": 12,
  "updatedAt": "2026-04-19T09:45:00.000Z",
  "state": {
    "moneySources": [
      {
        "id": "source-1",
        "name": "Momo",
        "budget": 1000000,
        "spent": 120000,
        "balance": 880000,
        "lastBalanceUpdate": "2026-04-19T09:20:00.000Z"
      }
    ],
    "templates": [
      {
        "id": "tpl-1",
        "name": "Weekly transfer",
        "description": "Transfer to savings",
        "changes": {
          "source-1": -200000
        }
      }
    ],
    "history": [
      {
        "id": "hist-1",
        "description": "Budget log: Transfer",
        "timestamp": "2026-04-19T09:21:00.000Z"
      }
    ],
    "budgetLog": [
      {
        "id": "log-1",
        "description": "Initial budget",
        "changes": {
          "source-1": 1000000
        },
        "isInitial": true,
        "createdAt": "2026-04-01T00:00:00.000Z"
      }
    ],
    "budgetLogSnapshot": {
      "id": "snap-1",
      "createdAt": "2026-04-19T09:40:00.000Z",
      "entryCount": 8,
      "entries": []
    },
    "budgetLogBalanceLocks": {
      "source-1": false
    },
    "currentMonth": "2026-04-01T00:00:00.000Z",
    "monthDescription": "April planning"
  }
}
```

### Not Found (404)

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "No budget state found for month 2026-04"
  }
}
```

---

## 5) PUT /api/budget/state?month=YYYY-MM

Purpose: replace full month state with optimistic concurrency.

### Request

```http
PUT /api/budget/state?month=2026-04 HTTP/1.1
Host: api.example.com
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "version": 12,
  "state": {
    "moneySources": [],
    "templates": [],
    "history": [],
    "budgetLog": [],
    "budgetLogSnapshot": null,
    "budgetLogBalanceLocks": {},
    "currentMonth": "2026-04-01T00:00:00.000Z",
    "monthDescription": ""
  }
}
```

### Success Response (200)

```json
{
  "month": "2026-04",
  "version": 13,
  "updatedAt": "2026-04-19T10:00:00.000Z",
  "state": {
    "moneySources": [],
    "templates": [],
    "history": [],
    "budgetLog": [],
    "budgetLogSnapshot": null,
    "budgetLogBalanceLocks": {},
    "currentMonth": "2026-04-01T00:00:00.000Z",
    "monthDescription": ""
  }
}
```

### Version Conflict (409)

```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "State has been updated by another device",
    "details": {
      "serverVersion": 13,
      "serverUpdatedAt": "2026-04-19T10:01:30.000Z",
      "serverState": {
        "moneySources": []
      }
    }
  }
}
```

---

## 6) POST /api/budget/start-next-month

Purpose: create next month from current balances.

### Request

```http
POST /api/budget/start-next-month HTTP/1.1
Host: api.example.com
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "fromMonth": "2026-04"
}
```

### Success Response (201)

```json
{
  "createdMonth": "2026-05",
  "version": 1,
  "state": {
    "moneySources": [
      {
        "id": "source-1",
        "name": "Momo",
        "budget": 880000,
        "spent": 0,
        "balance": 880000
      }
    ],
    "templates": [],
    "history": [
      {
        "id": "hist-1",
        "description": "Started new month (May 2026)",
        "timestamp": "2026-05-01T00:00:00.000Z"
      }
    ],
    "budgetLog": [
      {
        "id": "log-init",
        "description": "Last month balance",
        "changes": {
          "source-1": 880000
        },
        "isInitial": true,
        "createdAt": "2026-05-01T00:00:00.000Z"
      }
    ],
    "budgetLogSnapshot": null,
    "budgetLogBalanceLocks": {},
    "currentMonth": "2026-05-01T00:00:00.000Z",
    "monthDescription": ""
  }
}
```

---

## 7) POST /api/budget/snapshot

Purpose: save snapshot of current month budget log.

### Request

```http
POST /api/budget/snapshot HTTP/1.1
Host: api.example.com
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "month": "2026-04",
  "snapshot": {
    "id": "snap-2",
    "createdAt": "2026-04-19T10:05:00.000Z",
    "entryCount": 9,
    "entries": [
      {
        "id": "log-1",
        "description": "Initial budget",
        "changes": {
          "source-1": 1000000
        },
        "isInitial": true,
        "createdAt": "2026-04-01T00:00:00.000Z"
      }
    ]
  }
}
```

### Success Response (201)

```json
{
  "month": "2026-04",
  "snapshot": {
    "id": "snap-2",
    "createdAt": "2026-04-19T10:05:00.000Z",
    "entryCount": 9,
    "entries": []
  }
}
```

---

## 8) GET /api/budget/snapshot?month=YYYY-MM

Purpose: get latest snapshot for one month.

### Request

```http
GET /api/budget/snapshot?month=2026-04 HTTP/1.1
Host: api.example.com
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
```

### Success Response (200)

```json
{
  "month": "2026-04",
  "snapshot": {
    "id": "snap-2",
    "createdAt": "2026-04-19T10:05:00.000Z",
    "entryCount": 9,
    "entries": [
      {
        "id": "log-1",
        "description": "Initial budget",
        "changes": {
          "source-1": 1000000
        },
        "isInitial": true,
        "createdAt": "2026-04-01T00:00:00.000Z"
      }
    ]
  }
}
```

### Not Found (404)

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "No snapshot found for month 2026-04"
  }
}
```
