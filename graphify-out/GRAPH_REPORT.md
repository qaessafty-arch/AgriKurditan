# Graph Report - AgriKurditan  (2026-11-23)

## Corpus Check
- 2 files · ~5,591 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 170 nodes · 416 edges · 8 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `258713d8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Request
- backend.py
- audit
- get_current_user
- UserRegister
- security_headers_and_body_guard
- list_crops
- 🚜 AgriKurdistan

## God Nodes (most connected - your core abstractions)
1. `get_db()` - 19 edges
2. `audit()` - 18 edges
3. `_client_ip()` - 18 edges
4. `list_crops()` - 17 edges
5. `update_crop()` - 16 edges
6. `list_my_transactions()` - 16 edges
7. `settle_transaction()` - 16 edges
8. `refresh_token()` - 15 edges
9. `login()` - 14 edges
10. `login_form()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `audit()` --calls--> `_scrub()`  [EXTRACTED]
  backend.py → backend.py  _Bridges community 3 → community 2_
- `security_headers_and_body_guard()` --references--> `Any`  [EXTRACTED]
  backend.py →   _Bridges community 3 → community 5_
- `create_crop()` --calls--> `audit()`  [EXTRACTED]
  backend.py → backend.py  _Bridges community 2 → community 0_
- `_rate_limit_handler()` --calls--> `audit()`  [EXTRACTED]
  backend.py → backend.py  _Bridges community 2 → community 5_
- `get_current_user()` --references--> `get_db()`  [EXTRACTED]
  backend.py → backend.py  _Bridges community 0 → community 3_

## Import Cycles
- None detected.

## Communities (8 total, 0 thin omitted)

### Community 0 - "Request"
Cohesion: 0.15
Nodes (15): _client_ip(), create_crop(), create_transaction(), Crop, delete_crop(), get_crop(), get_db(), get_transaction() (+7 more)

### Community 1 - "backend.py"
Cohesion: 0.07
Nodes (11): CropPublic, CropUpdate, hash_password(), _is_revoked(), _load_secret_key(), _prehash(), TransactionCreate, TransactionPublic (+3 more)

### Community 2 - "audit"
Cohesion: 0.13
Nodes (12): as_aware(), audit(), _authenticate(), _issue_token_pair(), lifespan(), login(), login_form(), refresh_token() (+4 more)

### Community 3 - "get_current_user"
Cohesion: 0.11
Nodes (8): _decode_token(), get_current_user(), require_roles(), _guard(), _scrub(), _sqlite_hardening(), Transaction, User

### Community 4 - "UserRegister"
Cohesion: 0.15
Nodes (6): CropCreate, Region, TransactionStatus, UserRegister, UserRole, validate_password_strength()

### Community 5 - "security_headers_and_body_guard"
Cohesion: 0.14
Nodes (5): _encode_token(), _rate_limit_handler(), security_headers_and_body_guard(), sqlalchemy_exception_handler(), validation_exception_handler()

### Community 6 - "list_crops"
Cohesion: 0.18
Nodes (3): list_crops(), Paginated, sanitize_text()

### Community 7 - "🚜 AgriKurdistan"
Cohesion: 0.33
Nodes (5): 🚜 AgriKurdistan, Features, Files, Hosting the UI on GitHub Pages, How to run the backend locally

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `list_crops()` connect `list_crops` to `Request`, `backend.py`, `UserRegister`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Should `Request` be split into smaller, more focused modules?**
  _Cohesion score 0.14634146341463414 - nodes in this community are weakly interconnected._
- **Why does `UserRegister` connect `UserRegister` to `Request`, `backend.py`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Should `backend.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06585365853658537 - nodes in this community are weakly interconnected._
- **Why does `list_my_transactions()` connect `Request` to `backend.py`, `UserRegister`, `list_crops`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Should `audit` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `get_current_user` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._