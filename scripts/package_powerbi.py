import argparse
import csv
import hashlib
import io
import json
import subprocess
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]


def package(destination):
    subprocess.run(['python3', 'scripts/build_data.py', '--web'], cwd=ROOT, check=True)
    subprocess.run(['node', '--experimental-strip-types', 'web/scripts/export-analytics.mjs'], cwd=ROOT, check=True)
    subprocess.run(['python3', 'scripts/build_attendance.py'], cwd=ROOT, check=True)
    subprocess.run(['python3', 'scripts/build_powerbi.py'], cwd=ROOT, check=True)
    files = {}
    for path in sorted((ROOT / 'powerbi').rglob('*')):
        if path.is_file() and not any(part.startswith('.') for part in path.relative_to(ROOT / 'powerbi').parts):
            files[path.relative_to(ROOT).as_posix()] = path.read_bytes()
    for filename in ['market_comparison.csv', 'scenarios.csv', 'curves.csv', 'attendance_games.csv']:
        files[f'data/processed/{filename}'] = (ROOT / 'data/processed' / filename).read_bytes()
    with (ROOT / 'data/processed/games.csv').open(newline='') as handle:
        reader = csv.DictReader(handle)
        columns = reader.fieldnames
        games = list(reader)
    games.extend(json.loads((ROOT / 'web/data/saints-schedule.json').read_text()))
    buffer = io.StringIO(newline='')
    writer = csv.DictWriter(buffer, fieldnames=columns)
    writer.writeheader()
    writer.writerows(sorted(games, key=lambda game: game['starts_at']))
    files['data/processed/games.csv'] = buffer.getvalue().encode()
    for path in sorted((ROOT / 'web/public/fonts').iterdir()):
        if path.suffix in ['.ttf', '.txt']:
            files[f'fonts/{path.name}'] = path.read_bytes()
    files['campaign-plans.json'] = (ROOT / 'web/data/campaign-plans.json').read_bytes()
    files['public-observations.json'] = (ROOT / 'web/data/franchise-evidence.json').read_bytes()
    files['START-HERE.md'] = (ROOT / 'powerbi/WINDOWS-CHECK.md').read_bytes()
    manifest = {name: hashlib.sha256(content).hexdigest() for name, content in sorted(files.items())}
    files['SHA256.json'] = (json.dumps(manifest, indent=2) + '\n').encode()
    destination.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(destination, 'w', compression=ZIP_DEFLATED) as archive:
        for name, content in sorted(files.items()):
            archive.writestr(f'NolaPulse/{name}', content)
    print(f'Packaged {len(files)} files: {destination}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=ROOT / 'artifacts/NolaPulse-Windows.zip')
    package(parser.parse_args().output)
