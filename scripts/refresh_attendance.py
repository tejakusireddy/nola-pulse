import argparse
import csv
import hashlib
import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEASONS = {'Pelicans': [2025, 2026, 2027], 'Saints': [2024, 2025, 2026]}
SPORTS = {'Pelicans': ('basketball/nba', '3'), 'Saints': ('football/nfl', '18')}
COLUMNS = ['event_id', 'franchise', 'season', 'season_label', 'starts_at', 'opponent', 'venue', 'attendance', 'source_id', 'source_url', 'corrected']


def normalize(payload, franchise, season, source_id, source_url, corrections, as_of):
    team_id = SPORTS[franchise][1]
    games, excluded = [], []
    for event in payload.get('events', []):
        if event.get('season', {}).get('year') != season or event.get('seasonType', {}).get('type') != 2:
            continue
        for competition in event.get('competitions', []):
            home = next((team for team in competition.get('competitors', []) if team.get('id') == team_id and team.get('homeAway') == 'home'), None)
            if not home or event['date'][:10] > as_of:
                continue
            venue = competition.get('venue', {})
            reason = None
            if competition.get('neutralSite') or venue.get('address', {}).get('city') != 'New Orleans':
                reason = 'Outside New Orleans or neutral site'
            elif not competition.get('status', {}).get('type', {}).get('completed'):
                reason = 'Not completed; postponed or cancelled record'
            if reason:
                excluded.append({'event_id': event['id'], 'franchise': franchise, 'season': season, 'date': event['date'], 'venue': venue.get('fullName'), 'reason': reason})
                continue
            opponent = next(team for team in competition['competitors'] if team.get('id') != team_id)
            value = competition.get('attendance')
            correction = corrections.get(event['id'])
            if correction and (not isinstance(value, int) or value <= 0):
                value = correction['attendance']
            else:
                correction = None
            if not isinstance(value, int) or isinstance(value, bool) or value <= 0:
                raise ValueError(f"Missing positive attendance for completed home game {event['id']}; no source correction exists.")
            games.append({
                'event_id': event['id'], 'franchise': franchise, 'season': season,
                'season_label': event['season']['displayName'], 'starts_at': event['date'],
                'opponent': opponent['team']['displayName'], 'venue': venue['fullName'],
                'attendance': value, 'source_id': correction['source_id'] if correction else source_id,
                'source_url': correction['source_url'] if correction else f"https://www.espn.com/{SPORTS[franchise][0].split('/')[1]}/game/_/gameId/{event['id']}",
                'corrected': int(correction is not None),
            })
    return games, excluded


def refresh(cache=None):
    directory = ROOT / 'data/attendance'
    corrections = json.loads((directory / 'corrections.json').read_text())
    reviewed = datetime.now(timezone.utc).isoformat()
    as_of = reviewed[:10]
    games, exclusions, sources = [], [], []
    for franchise, seasons in SEASONS.items():
        sport, team = SPORTS[franchise]
        for season in seasons:
            source_id = f'{franchise.lower()}-{season}'
            url = f'https://site.api.espn.com/apis/site/v2/sports/{sport}/teams/{team}/schedule?season={season}&seasontype=2'
            if cache:
                path = cache / f'nola-{source_id}.json'
                raw = path.read_bytes()
                retrieved = datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat()
            else:
                with urllib.request.urlopen(url, timeout=25) as response:
                    raw = response.read()
                retrieved = datetime.now(timezone.utc).isoformat()
                raw_directory = ROOT / 'data/raw/attendance'
                raw_directory.mkdir(parents=True, exist_ok=True)
                (raw_directory / f'{source_id}.json').write_bytes(raw)
            payload = json.loads(raw)
            rows, omitted = normalize(payload, franchise, season, source_id, url, corrections, as_of)
            games.extend(rows)
            exclusions.extend(omitted)
            sources.append({'id': source_id, 'provider': 'ESPN public schedule feed', 'url': url, 'franchise': franchise, 'requested_season': season, 'retrieved_at': retrieved, 'provider_updated_at': payload.get('timestamp'), 'payload_sha256': hashlib.sha256(raw).hexdigest()})
    sources.extend({
        'id': row['source_id'], 'provider': 'NBA Game Info', 'url': row['source_url'],
        'retrieved_at': reviewed, 'method': row['reason'],
    } for row in corrections.values())
    with (directory / 'home-games.csv').open('w', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=COLUMNS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(sorted(games, key=lambda row: (row['franchise'], row['starts_at'], row['event_id'])))
    (directory / 'sources.json').write_text(json.dumps({'as_of': as_of, 'sources': sources, 'excluded': exclusions}, indent=2) + '\n')
    print(f'Reviewed {len(games)} completed New Orleans home games; {len(exclusions)} records excluded.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--from-cache', type=Path)
    args = parser.parse_args()
    refresh(args.from_cache)
