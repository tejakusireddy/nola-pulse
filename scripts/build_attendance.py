import csv
import hashlib
import json
import sqlite3
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def build():
    inputs = ROOT / 'data/attendance'
    metadata = json.loads((inputs / 'sources.json').read_text())
    source_ids = {source['id'] for source in metadata['sources']}
    with (inputs / 'home-games.csv').open(newline='') as handle:
        rows = list(csv.DictReader(handle))
    output = ROOT / 'data/processed'
    output.mkdir(parents=True, exist_ok=True)
    database = output / 'attendance.sqlite3'
    database.unlink(missing_ok=True)
    connection = sqlite3.connect(database)
    connection.row_factory = sqlite3.Row
    connection.executescript((ROOT / 'sql/attendance.sql').read_text())
    for row in rows:
        assert row['source_id'] in source_ids
        assert row['source_url'].startswith(('https://www.espn.com/', 'https://www.nba.com/'))
        datetime.fromisoformat(row['starts_at'].replace('Z', '+00:00'))
        connection.execute('INSERT INTO home_games VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', list(row.values()))
    connection.commit()
    assert connection.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
    dataset = {
        'as_of': metadata['as_of'],
        'definition': 'Published attendance for completed regular-season home games played in New Orleans. Not gate scans, unique customers, realized revenue, or available inventory.',
        'method': 'Filter by event season and regular-season type, home competitor, completed status, positive attendance, New Orleans venue, and non-neutral site. Deduplicate event IDs. Zero or missing attendance blocks ingestion unless an explicit sourced correction exists. Do not trust the feed envelope season for historical requests.',
        'games': [dict(row) for row in connection.execute('SELECT * FROM home_games ORDER BY franchise, starts_at, event_id')],
        'seasons': [dict(row) for row in connection.execute('SELECT * FROM attendance_seasons ORDER BY franchise, season')],
        'sources': metadata['sources'], 'excluded': metadata['excluded'],
        'input_sha256': {path.name: hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(inputs.iterdir()) if path.is_file()},
    }
    (ROOT / 'web/data/attendance.json').write_text(json.dumps(dataset, indent=2) + '\n')
    (output / 'attendance.json').write_text(json.dumps(dataset, indent=2) + '\n')
    cursor = connection.execute('SELECT *, ROW_NUMBER() OVER (PARTITION BY franchise, season ORDER BY starts_at, event_id) AS game_number FROM home_games ORDER BY franchise, season, starts_at, event_id')
    with (output / 'attendance_games.csv').open('w', newline='') as handle:
        writer = csv.writer(handle)
        writer.writerow([column[0] for column in cursor.description])
        writer.writerows(cursor)
    connection.close()
    print(f"Validated {len(dataset['games'])} attendance records and {len(dataset['seasons'])} SQL season aggregates.")
    return dataset


if __name__ == '__main__':
    build()
