# PlacePrep ML

`placeprep-ml` is a standalone Python AI/ML module for behavioral interview answer evaluation. It is completely separate from the main PlacePrep Next.js application and can be opened, run, and tested independently in VS Code on Windows.

## What this subproject does

This module is designed to support behavioral interview answer evaluation by:

- storing curated seed behavioral interview samples
- generating larger synthetic datasets from those seeds
- cleaning and exporting the final dataset
- training a lightweight NLP classifier
- serving predictions through FastAPI

The target use case is behavioral answer evaluation for labels such as:

- weak
- average
- strong

## Project structure

```text
placeprep-ml/
├── seed_data/
├── generated_data/
├── cleaned_data/
├── scripts/
├── models/
├── api/
├── config/
├── tests/
├── .env.example
├── requirements.txt
├── README.md
└── .gitignore
```

## How to create a virtual environment on Windows

Open VS Code in the `placeprep-ml` folder, then run:

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, you can allow local scripts for the current user:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then activate again:

```powershell
.venv\Scripts\Activate.ps1
```

## How to install dependencies

With the virtual environment activated:

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## How to place seed data

Put your initial behavioral dataset here:

```text
seed_data/behavioral_seed.json
```

Each record should follow this schema:

```json
{
  "id": 1,
  "question": "Tell me about a time you handled conflict.",
  "category": "conflict",
  "answer": "Your answer text here",
  "label": "average",
  "score_clarity": 6,
  "score_structure": 5,
  "score_impact": 5,
  "missing": ["metrics"]
}
```

## How to run scripts

Synthetic generation:

```powershell
python scripts\generate_synthetic_behavioral_data.py --count 1200
```

Merge datasets:

```powershell
python scripts\merge_datasets.py
```

Clean dataset:

```powershell
python scripts\clean_behavioral_dataset.py
```

Export CSV:

```powershell
python scripts\export_dataset_csv.py
```

## How to train the model

Run:

```powershell
python scripts\train_behavioral_model.py
```

This will:

- load the cleaned dataset
- vectorize answer text using TF-IDF
- train a Logistic Regression classifier
- print accuracy and classification report
- save the trained model to:

```text
models/behavioral_model.joblib
```

## How to run FastAPI

Start the API locally with:

```powershell
uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```

Then open:

```text
http://127.0.0.1:8000/docs
```

to test the API in Swagger UI.

## Example API request

```json
{
  "question": "Tell me about a time you took ownership.",
  "answer": "During my internship a release blocker kept bouncing between teams. I took ownership of the issue, mapped dependencies, followed up with each owner, and documented the resolution steps. We cleared the blocker before the release."
}
```

## Important note

This AI/ML module is fully standalone. It does not modify or depend on the main PlacePrep frontend or backend runtime.
