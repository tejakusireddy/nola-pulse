import copy
import unittest

from scripts.refresh_attendance import normalize


class AttendanceNormalizationTests(unittest.TestCase):
    def setUp(self):
        self.payload = {
            'season': {'year': 2027},
            'events': [{
                'id': 'test-game', 'date': '2025-01-01T01:00Z',
                'season': {'year': 2025, 'displayName': '2024-25'},
                'seasonType': {'type': 2},
                'competitions': [{
                    'attendance': 15000, 'neutralSite': False,
                    'status': {'type': {'completed': True}},
                    'venue': {'fullName': 'Smoothie King Center', 'address': {'city': 'New Orleans'}},
                    'competitors': [
                        {'id': '3', 'homeAway': 'home', 'team': {'displayName': 'New Orleans Pelicans'}},
                        {'id': '2', 'homeAway': 'away', 'team': {'displayName': 'Boston Celtics'}},
                    ],
                }],
            }],
        }

    def normalize(self, payload, corrections=None):
        return normalize(payload, 'Pelicans', 2025, 'source', 'https://example.com', corrections or {}, '2026-11-10')

    def test_event_season_overrides_stale_envelope_and_cannot_cross_franchise(self):
        games, excluded = self.normalize(self.payload)
        self.assertEqual(len(games), 1)
        self.assertEqual(games[0]['season'], 2025)
        self.assertEqual(excluded, [])
        games, _ = normalize(self.payload, 'Saints', 2025, 'source', 'https://example.com', {}, '2026-11-10')
        self.assertEqual(games, [])

    def test_zero_or_missing_attendance_blocks_ingestion_without_verified_correction(self):
        for missing in [0, None, False, -1]:
            payload = copy.deepcopy(self.payload)
            payload['events'][0]['competitions'][0]['attendance'] = missing
            with self.assertRaises(ValueError):
                self.normalize(payload)
        corrections = {'test-game': {'attendance': 18581, 'source_id': 'nba', 'source_url': 'https://www.nba.com/game/source'}}
        games, _ = self.normalize(payload, corrections)
        self.assertEqual(games[0]['source_id'], 'nba')
        self.assertEqual(games[0]['attendance'], 18581)

    def test_neutral_venues_away_games_and_postponed_placeholders_do_not_count(self):
        for patch in [{'neutralSite': True}, {'venue': {'fullName': 'Stade de France', 'address': {'city': 'Paris'}}}, {'status': {'type': {'completed': False}}}]:
            payload = copy.deepcopy(self.payload)
            payload['events'][0]['competitions'][0].update(patch)
            games, excluded = self.normalize(payload)
            self.assertEqual(games, [])
            self.assertEqual(len(excluded), 1)
        payload = copy.deepcopy(self.payload)
        payload['events'][0]['competitions'][0]['competitors'][0]['homeAway'] = 'away'
        games, excluded = self.normalize(payload)
        self.assertEqual(games, [])
        self.assertEqual(excluded, [])
