import importlib.util
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('build_data', ROOT / 'scripts/build_data.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PipelineTest(unittest.TestCase):
    def test_snapshot_rebuild_and_sql_lineage(self):
        with tempfile.TemporaryDirectory() as directory:
            destination = Path(directory)
            data = module.build(destination)
            self.assertEqual(len(data['markets']), 6)
            self.assertEqual(len({g['game_id'] for g in data['games']}), len(data['games']))
            northshore = next(m for m in data['markets'] if m['market_id'] == '22103')
            self.assertEqual(northshore['growth_difference_vs_orleans_pp'], 11.2)
            self.assertAlmostEqual(northshore['income_difference_vs_orleans_pct'], 43.39)
            self.assertEqual(len(data['input_sha256']), 3)
            for m in data['markets']:
                self.assertTrue(m['source_url'].startswith('https://www.census.gov/quickfacts/'))
            connection = sqlite3.connect(destination / 'pulse.sqlite3')
            with self.assertRaises(sqlite3.IntegrityError):
                connection.execute("UPDATE markets SET population = -1 WHERE market_id = '22103'")
            connection.close()
            self.assertEqual(json.loads((destination / 'intelligence.json').read_text()), data)


if __name__ == '__main__':
    unittest.main()
