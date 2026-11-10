import copy
import unittest

from scripts.build_geography import MARKETS, project_topology


def topology():
    def geometry(code, arcs=None):
        return {'id': code, 'properties': {'name': code}, 'type': 'Polygon', 'arcs': [[0]] if arcs is None else arcs}
    return {
        'transform': {'scale': [0.1, 0.1], 'translate': [-90, 30]},
        'arcs': [[[0, 0], [10, 0], [0, 10], [-10, 0], [0, -10]]],
        'objects': {'counties': {'geometries': [geometry(code) for code in sorted(MARKETS)]},
                    'states': {'geometries': [geometry(code) for code in ['01', '22', '28']]}},
    }


class GeographyTest(unittest.TestCase):
    def test_decodes_deltas_and_preserves_reversed_arc_direction(self):
        source = topology()
        projected = project_topology(source)
        forward = projected['counties'][0]['path']
        self.assertTrue(forward.startswith('M507.0,471.2 L637.0,471.2'))
        self.assertEqual({c['id'] for c in projected['counties']}, MARKETS)
        source['objects']['counties']['geometries'][0]['arcs'] = [[-1]]
        backward = project_topology(source)['counties'][0]['path']
        self.assertTrue(backward.startswith('M507.0,471.2 L507.0,326.2'))
        self.assertNotEqual(forward, backward)

    def test_multipolygon_rings_remain_separate_and_missing_counties_fail(self):
        source = topology()
        county = source['objects']['counties']['geometries'][0]
        county.update(type='MultiPolygon', arcs=[[[0], [-1]], [[0]]])
        result = project_topology(source)['counties'][0]['path']
        self.assertEqual(result.count('M'), 3)
        self.assertEqual(result.count('Z'), 3)
        missing = copy.deepcopy(source)
        missing['objects']['counties']['geometries'].pop()
        with self.assertRaisesRegex(ValueError, 'six candidate counties'):
            project_topology(missing)
