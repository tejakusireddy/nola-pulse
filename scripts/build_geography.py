"""Project Census-derived TopoJSON boundaries into the application's regional map."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARKETS = {'22071', '22051', '22103', '22033', '28047', '01097'}


def project_topology(topology):
    transform = topology['transform']
    arcs = []
    for raw in topology['arcs']:
        x = y = 0
        points = []
        for dx, dy in raw:
            x += dx
            y += dy
            lon = x * transform['scale'][0] + transform['translate'][0]
            lat = y * transform['scale'][1] + transform['translate'][1]
            points.append(((lon + 93.9) * 130, (33.25 - lat) * 145))
        arcs.append(points)

    def path(geometry):
        polygons = geometry['arcs'] if geometry['type'] == 'MultiPolygon' else [geometry['arcs']]
        rings = []
        for polygon in polygons:
            for ring in polygon:
                points = []
                for index in ring:
                    arc = arcs[index] if index >= 0 else list(reversed(arcs[~index]))
                    points.extend(arc if not points else arc[1:])
                rings.append(' '.join(f'{"M" if i == 0 else "L"}{x:.1f},{y:.1f}' for i, (x, y) in enumerate(points)) + 'Z')
        return ' '.join(rings)

    counties = [{'id': g['id'], 'name': g['properties']['name'], 'path': path(g)}
                for g in topology['objects']['counties']['geometries'] if g['id'] in MARKETS]
    if {c['id'] for c in counties} != MARKETS:
        raise ValueError('The boundary source must contain all six candidate counties')
    states = [{'id': g['id'], 'name': g['properties']['name'], 'path': path(g)}
              for g in topology['objects']['states']['geometries'] if g['id'] in {'22', '28', '01'}]
    return {'source': 'https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/counties-10m.json',
            'attribution': 'U.S. Census Bureau cartographic boundaries via us-atlas 3.0.1 (ISC). Equirectangular projection. Boundaries are geographic, not fan catchments.',
            'states': states, 'counties': counties}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('topology', type=Path, help='Reviewed us-atlas 3.0.1 counties-10m.json')
    args = parser.parse_args()
    output = project_topology(json.loads(args.topology.read_text()))
    output['source_sha256'] = hashlib.sha256(args.topology.read_bytes()).hexdigest()
    (ROOT / 'web/data/geography.json').write_text(json.dumps(output, indent=2) + '\n')
    print('Projected three states and six candidate county boundaries.')
