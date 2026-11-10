PRAGMA foreign_keys = ON;
CREATE TABLE home_games (
    event_id TEXT PRIMARY KEY,
    franchise TEXT NOT NULL CHECK (franchise IN ('Saints', 'Pelicans')),
    season INTEGER NOT NULL,
    season_label TEXT NOT NULL,
    starts_at TEXT NOT NULL,
    opponent TEXT NOT NULL,
    venue TEXT NOT NULL,
    attendance INTEGER NOT NULL CHECK (attendance > 0),
    source_id TEXT NOT NULL,
    source_url TEXT NOT NULL,
    corrected INTEGER NOT NULL CHECK (corrected IN (0, 1))
);
CREATE VIEW attendance_seasons AS
SELECT franchise, season, season_label,
       COUNT(*) AS home_games,
       SUM(attendance) AS total_attendance,
       AVG(attendance) AS average_attendance,
       MIN(attendance) AS minimum_attendance,
       MAX(attendance) AS maximum_attendance
FROM home_games
GROUP BY franchise, season, season_label;
