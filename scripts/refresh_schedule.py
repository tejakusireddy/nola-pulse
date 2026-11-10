import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'https://www.nba.com/pelicans/'


def extract(html, retrieved_at):
    match = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
    if not match:
        raise ValueError('NBA page no longer exposes the expected schedule payload')
    data = json.loads(match.group(1))['props']['pageProps']['scheduleData']
    games = []
    for game in data:
        if game['homeTeam']['teamId'] != 1610612740 or game['gameStatus'] != 1:
            continue
        if game['arenaCity'] != 'New Orleans':
            continue
        games.append({
            'game_id': game['gameId'], 'franchise': 'Pelicans',
            'opponent': game['awayTeam']['teamName'], 'starts_at': game['gameDateUTC'],
            'venue': game['arenaName'], 'source_url': SOURCE, 'retrieved_at': retrieved_at,
        })
    if not games:
        raise ValueError('No upcoming New Orleans home games in the source payload')
    if len({game['game_id'] for game in games}) != len(games):
        raise ValueError('Duplicate game identifiers')
    return {'source_url': SOURCE, 'retrieved_at': retrieved_at, 'coverage': 'Upcoming home games exposed on the team homepage; not the complete season.', 'games': games}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--html', type=Path)
    args = parser.parse_args()
    if args.html:
        html = args.html.read_text()
    else:
        with urlopen(Request(SOURCE, headers={'User-Agent': 'Mozilla/5.0'}), timeout=30) as response:
            html = response.read().decode()
    result = extract(html, datetime.now(timezone.utc).isoformat())
    destination = ROOT / 'data/reference/games.json'
    destination.write_text(json.dumps(result, indent=2) + '\n')
    print(f"Saved {len(result['games'])} upcoming home games")
