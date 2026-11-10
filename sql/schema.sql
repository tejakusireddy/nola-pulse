PRAGMA foreign_keys = ON;

CREATE TABLE markets (
    market_id TEXT PRIMARY KEY CHECK (length(market_id) = 5),
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    state TEXT NOT NULL,
    population INTEGER NOT NULL CHECK (population > 0),
    population_change_pct REAL NOT NULL,
    households INTEGER NOT NULL CHECK (households > 0),
    median_income INTEGER NOT NULL CHECK (median_income > 0),
    source_url TEXT NOT NULL,
    population_vintage TEXT NOT NULL,
    income_vintage TEXT NOT NULL,
    reviewed_on TEXT NOT NULL
);

CREATE TABLE games (
    game_id TEXT PRIMARY KEY,
    franchise TEXT NOT NULL CHECK (franchise IN ('Pelicans', 'Saints')),
    opponent TEXT NOT NULL,
    starts_at TEXT NOT NULL,
    venue TEXT NOT NULL,
    source_url TEXT NOT NULL,
    retrieved_at TEXT NOT NULL
);

CREATE TABLE source_runs (
    run_id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    retrieved_at TEXT NOT NULL,
    record_count INTEGER NOT NULL,
    elapsed_ms REAL NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('passed', 'failed'))
);

CREATE VIEW market_comparison AS
SELECT
    m.*,
    ROUND(100.0 * (m.median_income - base.median_income) / base.median_income, 2)
        AS income_difference_vs_orleans_pct,
    ROUND(m.population_change_pct - base.population_change_pct, 2)
        AS growth_difference_vs_orleans_pp
FROM markets m
CROSS JOIN markets base
WHERE base.market_id = '22071';
