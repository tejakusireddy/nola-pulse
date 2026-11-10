import argparse
import csv
import hashlib
import json
import sqlite3
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def build(output):
    started = time.perf_counter()
    output.mkdir(parents=True, exist_ok=True)
    database = output / 'pulse.sqlite3'
    if database.exists():
        database.unlink()
    connection = sqlite3.connect(database)
    connection.row_factory = sqlite3.Row
    connection.executescript((ROOT / 'sql/schema.sql').read_text())
    inputs = ROOT / 'data/reference'
    with (inputs / 'markets.csv').open(newline='') as handle:
        rows = list(csv.DictReader(handle))
    with connection:
        for row in rows:
            keys = ','.join(row)
            placeholders = ','.join('?' for _ in row)
            connection.execute(f'INSERT INTO markets ({keys}) VALUES ({placeholders})', list(row.values()))
        schedule = json.loads((inputs / 'games.json').read_text())
        for row in schedule['games']:
            connection.execute(
                'INSERT INTO games VALUES (?, ?, ?, ?, ?, ?, ?)',
                [row[k] for k in ['game_id', 'franchise', 'opponent', 'starts_at', 'venue', 'source_url', 'retrieved_at']],
            )
        elapsed = round((time.perf_counter() - started) * 1000, 2)
        connection.execute('INSERT INTO source_runs VALUES (?, ?, ?, ?, ?, ?)',
                           ['snapshot-build', 'reviewed-reference-snapshot', datetime.now(timezone.utc).isoformat(), len(rows) + len(schedule['games']), elapsed, 'passed'])
    markets = [dict(row) for row in connection.execute('SELECT * FROM market_comparison ORDER BY market_id')]
    assert len(markets) == 6
    assert all(row['population'] > row['households'] for row in markets)
    assert connection.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
    games = [dict(row) for row in connection.execute('SELECT * FROM games ORDER BY starts_at')]
    sources = json.loads((inputs / 'sources.json').read_text())
    dataset = {
        'snapshot_date': '2026-11-09',
        'version': '1.0.0',
        'markets': markets,
        'games': games,
        'sources': sources,
        'limitations': [
            'Regional figures describe residents, not franchise fans or customer penetration.',
            'ACS household and income estimates cover 2020–2024; population estimates are July 2025.',
            'QuickFacts does not expose margins of error here; small income differences are not tested for significance.',
            'Ticket inventory, transaction prices, historical resale observations, and campaign outcomes are unavailable.',
            'No demand forecast, elasticity estimate, or statistically optimal market allocation is claimed.',
        ],
        'input_sha256': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(inputs.iterdir()) if p.is_file()},
    }
    (output / 'intelligence.json').write_text(json.dumps(dataset, indent=2) + '\n')
    for table in ['markets', 'games', 'market_comparison', 'source_runs']:
        cursor = connection.execute(f'SELECT * FROM {table}')
        with (output / f'{table}.csv').open('w', newline='') as handle:
            writer = csv.writer(handle)
            writer.writerow([column[0] for column in cursor.description])
            writer.writerows(cursor)
    connection.close()
    return dataset


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=ROOT / 'data/processed')
    parser.add_argument('--web', action='store_true')
    args = parser.parse_args()
    result = build(args.output)
    if args.web:
        destination = ROOT / 'web/data/intelligence.json'
        destination.parent.mkdir(exist_ok=True)
        destination.write_text(json.dumps(result, indent=2) + '\n')
    print(f"Validated {len(result['markets'])} markets and {len(result['games'])} games.")
