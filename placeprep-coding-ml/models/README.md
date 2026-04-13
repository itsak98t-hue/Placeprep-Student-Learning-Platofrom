# Models

This MVP does not use a trained ranking model yet.

The current recommendation engine is explainable and built from:

- per-topic user mastery statistics
- candidate feature engineering
- configurable recommendation weights
- configurable penalties for unsafe recommendations

This folder is reserved for future artifacts such as:

- `xgboost_ranker.json`
- `lightgbm_ranker.txt`
- feature metadata
- calibration files
- offline evaluation reports

The current backend is intentionally structured so the weighted scorer can later be replaced by XGBoost or LightGBM without changing the FastAPI request and response contract.
