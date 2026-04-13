# PlacePrep Coding Recommendation Engine

`placeprep-coding-ml` is a standalone FastAPI backend for adaptive coding practice recommendations.

It stays fully separate from the behavioral backend and keeps the recommendation engine deterministic and dataset-driven. Groq is used only for optional AI-assisted hinting and post-attempt explanations.

This project does not compile code, execute user submissions, or scrape copyrighted problem statements. It only stores question metadata, external links, user attempts, hints, and recommendation logic for external coding platforms such as LeetCode, GeeksforGeeks, and Codeforces.

## What This Backend Does

For a given user, the engine recommends the next best coding question based on:

- topic weakness
- success rate
- average time spent
- recent struggles
- company goal
- difficulty fit
- prerequisite fit
- novelty versus repetition balance

It returns:

- a primary recommended question
- a ranked easier ladder when available
- a ranked harder ladder when available
- optional similar questions
- a human-readable reason

Groq is used only for:

- smart progressive hints
- post-attempt explanations
- optional future rewriting of explanation text

Groq is not used to rank or choose questions.

## Folder Structure

```text
placeprep-coding-ml/
|
|-- api/
|   `-- main.py
|
|-- data/
|   |-- questions.json
|   |-- company_topic_weights.json
|   `-- sample_user_attempts.json
|
|-- models/
|   `-- README.md
|
|-- scripts/
|   |-- compute_topic_stats.py
|   |-- build_candidate_features.py
|   |-- recommend_next_question.py
|   `-- seed_sample_data.py
|
|-- tests/
|   `-- sample_requests.json
|
|-- utils/
|   |-- data_loader.py
|   |-- feature_engineering.py
|   |-- filters.py
|   |-- groq_client.py
|   |-- prompt_builder.py
|   `-- scoring.py
|
|-- .env.example
|-- requirements.txt
`-- README.md
```

## Data Files

### `data/questions.json`

Each question contains:

- `id`
- `title`
- `platform`
- `external_link`
- `topic`
- `subtopic`
- `difficulty` where `1 = easy`, `2 = medium`, `3 = hard`
- `pattern`
- `companies`
- `prerequisites`
- `estimated_time_min`
- `hint_levels`
- `fallback_question_ids`
- `upgrade_question_ids`
- `similar_question_ids`

Only metadata and external links are stored.

### `data/sample_user_attempts.json`

Each attempt contains:

- `user_id`
- `question_id`
- `topic`
- `difficulty`
- `status` (`solved`, `partial`, `failed`, `skipped`)
- `time_spent_min`
- `hints_used`
- `confidence`
- `attempted_at`

## Recommendation Logic

The recommendation engine remains deterministic and local-data-driven.

### 1. Topic Stats

For each user and topic, the backend computes:

- attempted
- solved
- failed
- partial
- skipped
- success_rate
- avg_time_spent
- avg_hints_used
- recent_fail_rate
- recent_partial_rate
- mastery_score
- weakness_score
- inferred_topic_level

### 2. Candidate Features

For each candidate question, the engine computes:

- `topic_weakness`
- `success_rate_in_topic`
- `avg_time_ratio`
- `recent_struggle_score`
- `company_match_score`
- `difficulty_fit_score`
- `prerequisite_fit_score`
- `novelty_score`
- `repetition_need_score`
- `already_attempted_recently`

### 3. Scoring

```text
recommendation_score =
0.30 * topic_weakness
+ 0.20 * recent_struggle_score
+ 0.15 * company_match_score
+ 0.15 * difficulty_fit_score
+ 0.10 * prerequisite_fit_score
+ 0.05 * novelty_score
+ 0.05 * repetition_need_score
```

## Groq Integration

Groq is optional and backend-only.

### Purpose

- `POST /coding/hint`:
  returns one progressive hint without revealing the full answer
- `POST /coding/explain`:
  returns a short explanation of likely struggle plus practical focus areas

### Environment Variables

Add these to your backend environment:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
```

If `GROQ_MODEL` is omitted, the backend defaults to `llama-3.1-8b-instant`.

### Fallback Behavior

If Groq is unavailable, missing an API key, or returns an invalid response:

- `/coding/hint` falls back to static dataset hints from `questions.json`
- `/coding/explain` falls back to a local template-based explanation

This means the core coding recommendation flow does not depend on Groq.

## API Endpoints

### `GET /health`

Returns service health.

### `POST /coding/recommend`

Request:

```json
{
  "user_id": "u1",
  "target_company": "Amazon"
}
```

### `POST /coding/attempt`

Request:

```json
{
  "user_id": "u1",
  "question_id": "graph_001",
  "status": "failed",
  "time_spent_min": 35,
  "hints_used": 2,
  "confidence": 2
}
```

### `POST /coding/hint`

Request:

```json
{
  "user_id": "demo-user-1",
  "question_id": "arr_002",
  "status": "failed",
  "hint_level": 1
}
```

Response:

```json
{
  "hint": "Track the best state you need from earlier positions before deciding at the current index.",
  "hint_level": 1,
  "source": "groq"
}
```

If Groq is unavailable:

```json
{
  "hint": "Track the minimum so far.",
  "hint_level": 1,
  "source": "static"
}
```

### `POST /coding/explain`

Request:

```json
{
  "user_id": "demo-user-1",
  "question_id": "arr_002",
  "status": "failed",
  "time_spent_min": 24,
  "hints_used": 2,
  "confidence": 2
}
```

Response:

```json
{
  "explanation": "You likely got stuck recognizing the simplest running state to maintain. Focus on how prefix minima reduces each step to one comparison.",
  "focus_areas": [
    "Name the running value you must preserve.",
    "Practice the prefix minima pattern.",
    "Dry run one small example before coding."
  ],
  "source": "groq"
}
```

If Groq is unavailable, the endpoint returns a local fallback with `source: "fallback"`.

## Local Setup

Install dependencies:

```powershell
cd C:\Users\abhin\placePrep\placeprep-coding-ml
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Copy env values:

```powershell
Copy-Item .env.example .env
```

Run locally:

```powershell
cd C:\Users\abhin\placePrep
uvicorn api.main:app --app-dir placeprep-coding-ml --reload --host 127.0.0.1 --port 8000
```

Swagger / OpenAPI:

- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/redoc`
- `http://127.0.0.1:8000/openapi.json`

## Example cURL

### Recommend

```powershell
curl -X POST "http://127.0.0.1:8000/coding/recommend" ^
  -H "Content-Type: application/json" ^
  -d "{\"user_id\":\"u1\",\"target_company\":\"Amazon\"}"
```

### Hint

```powershell
curl -X POST "http://127.0.0.1:8000/coding/hint" ^
  -H "Content-Type: application/json" ^
  -d "{\"user_id\":\"demo-user-1\",\"question_id\":\"arr_002\",\"status\":\"failed\",\"hint_level\":1}"
```

### Explain

```powershell
curl -X POST "http://127.0.0.1:8000/coding/explain" ^
  -H "Content-Type: application/json" ^
  -d "{\"user_id\":\"demo-user-1\",\"question_id\":\"arr_002\",\"status\":\"failed\",\"time_spent_min\":24,\"hints_used\":2,\"confidence\":2}"
```

## Notes

- The frontend should call these new endpoints through the FastAPI backend only.
- Never expose `GROQ_API_KEY` in the Next.js frontend.
- Question selection and ranking still come entirely from local metadata and scoring logic.
