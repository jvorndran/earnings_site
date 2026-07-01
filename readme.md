# Earnings Insights Website

This project pairs a Django backend with an Angular frontend to display upcoming earnings releases and a few
derived statistics for public companies.

## Highlights

- Upcoming earnings calendar grouped by report date
- Per-day company detail pages sorted by market capitalization
- Local SQLite dataset that can be refreshed with `backend/populate_db.py`

## Methodology

The backend uses the Alpha Vantage earnings calendar plus Yahoo Finance data to calculate the metrics shown on
each report date. One of the custom statistics is the implied one-week move, estimated from the at-the-money call
and put prices around the earnings event.

## Local setup

1. Create and activate a Python virtual environment.
2. Install backend dependencies with `pip install -r backend/requirements.txt`.
3. Install frontend dependencies with `cd frontend && npm install`.
4. Set `ALPHA_API_KEY` in your environment or a local `.env` file before refreshing data.
5. Optional: rebuild the local SQLite dataset with `python backend/populate_db.py`.
6. Start Django from the repository root with `python backend/manage.py runserver`.
7. In a second shell, start the Angular dev server from `frontend` with `npx ng serve`.

## Notes

- The Angular app currently calls the deployed API URLs in `frontend/src/app/services/get-calender.service.ts`
  and `frontend/src/app/components/report-date-table/report-date-table.component.ts`.
- To point the frontend at a local Django instance, update those URLs or add a frontend proxy to
  `http://127.0.0.1:8000`.
