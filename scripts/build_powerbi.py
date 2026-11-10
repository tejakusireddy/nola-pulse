import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'powerbi'


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + '\n')


def expression(value):
    literal = f"'{value}'" if isinstance(value, str) else ('true' if value is True else 'false' if value is False else str(value))
    return {'expr': {'Literal': {'Value': literal}}}


def build():
    model_path = DEST / 'NolaPulse.SemanticModel'
    report = DEST / 'NolaPulse.Report'
    measures = [
        ('Curve Net Contribution', 'IF(HASONEVALUE(Scenarios[scenario_id]), SUM(Curves[net_contribution]), BLANK())', '$#,0;($#,0);$0'),
        ('Attributed Orders', 'DIVIDE(SELECTEDVALUE(Scenarios[budget]), SELECTEDVALUE(Scenarios[costPerOrder]))', '#,0.0'),
        ('Incremental Orders', '[Attributed Orders] * SELECTEDVALUE(Scenarios[incrementality])', '#,0.0'),
        ('Campaign Costs', 'SELECTEDVALUE(Scenarios[budget]) + SELECTEDVALUE(Scenarios[fixedCosts])', '$#,0;($#,0);$0'),
        ('Net Contribution', '[Incremental Orders] * SELECTEDVALUE(Scenarios[ticketsPerOrder]) * SELECTEDVALUE(Scenarios[contributionPerTicket]) - [Campaign Costs]', '$#,0;($#,0);$0'),
        ('Break-even Share', 'DIVIDE([Campaign Costs], [Attributed Orders] * SELECTEDVALUE(Scenarios[ticketsPerOrder]) * SELECTEDVALUE(Scenarios[contributionPerTicket]))', '0.0%'),
        ('Decision', 'IF(NOT HASONEVALUE(Scenarios[scenario_id]), "Select one scenario", IF(SELECTEDVALUE(Scenarios[budget]) = 0, "No active campaign", IF(ABS([Net Contribution]) < 0.000001, "Break-even", IF([Net Contribution] > 0, "Conditional test", "Revise before launch"))))', ''),
    ]
    files = {'Markets': 'market_comparison.csv', 'Games': 'games.csv', 'Scenarios': 'scenarios.csv', 'Curves': 'curves.csv'}
    text_columns = {'market_id', 'name', 'short_name', 'state', 'source_url', 'population_vintage', 'income_vintage', 'reviewed_on', 'game_id', 'franchise', 'opponent', 'starts_at', 'venue', 'retrieved_at', 'scenario_id', 'label', 'status'}
    tables = []
    for name, filename in files.items():
        with (ROOT / 'data/processed' / filename).open(newline='') as handle:
            headers = next(csv.reader(handle))
        cols = [{'name': h, 'dataType': 'string' if h in text_columns else 'boolean' if h == 'feasible' else 'double', 'sourceColumn': h, 'summarizeBy': 'none'} for h in headers]
        transforms = ', '.join('{"' + h + '", ' + ('type text' if h in text_columns else 'type logical' if h == 'feasible' else 'type number') + '}' for h in headers)
        query = [
            'let',
            f'    Source = Csv.Document(File.Contents(DataFolder & "{filename}"), [Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),',
            '    Headers = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),',
            f'    Typed = Table.TransformColumnTypes(Headers, {{{transforms}}}, "en-US")',
            'in', '    Typed',
        ]
        table = {'name': name, 'columns': cols, 'partitions': [{'name': name, 'mode': 'import', 'source': {'type': 'm', 'expression': query}}]}
        if name == 'Scenarios':
            table['measures'] = [{'name': n, 'expression': e, 'formatString': f} for n, e, f in measures]
        tables.append(table)
        (DEST / f'{name}.pq').write_text('\n'.join(query) + '\n')
    model = {'name': 'NolaPulse', 'compatibilityLevel': 1600, 'model': {
        'culture': 'en-US', 'defaultPowerBIDataSourceVersion': 'powerBI_V3',
        'expressions': [{'name': 'DataFolder', 'kind': 'm', 'expression': '"C:\\NolaPulse\\data\\processed\\" meta [IsParameterQuery=true, Type="Text", IsParameterQueryRequired=true]'}],
        'tables': tables,
        'relationships': [{'name': 'Scenarios_Curves', 'fromTable': 'Curves', 'fromColumn': 'scenario_id', 'toTable': 'Scenarios', 'toColumn': 'scenario_id', 'crossFilteringBehavior': 'oneDirection'}],
    }}
    save(model_path / 'model.bim', model)
    save(model_path / 'definition.pbism', {'version': '4.0', 'settings': {}})
    save(DEST / 'NolaPulse.pbip', {'version': '1.0', 'artifacts': [{'report': {'path': 'NolaPulse.Report'}}], 'settings': {'enableAutoRecovery': True}})
    save(report / 'definition.pbir', {'version': '4.0', 'datasetReference': {'byPath': {'path': '../NolaPulse.SemanticModel'}}})
    definition = report / 'definition'
    save(definition / 'version.json', {'$schema': 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/versionMetadata/1.0.0/schema.json', 'version': '4.0.0'})
    save(definition / 'report.json', {'$schema': 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/report/3.0.0/schema.json', 'themeCollection': {'customTheme': {'name': 'NolaPulse_theme', 'type': 'RegisteredResources', 'reportVersionAtImport': {'visual': '2.1.0', 'page': '2.0.0', 'report': '3.0.0'}}}, 'resourcePackages': [{'name': 'RegisteredResources', 'type': 'RegisteredResources', 'items': [{'name': 'NolaPulse_theme', 'path': 'theme.json', 'type': 'CustomTheme'}]}]})
    save(report / 'StaticResources/RegisteredResources/theme.json', json.loads((DEST / 'theme.json').read_text()))
    save(definition / 'pages/pages.json', {'$schema': 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/pagesMetadata/1.0.0/schema.json', 'pageOrder': ['decision'], 'activePageName': 'decision'})
    page = definition / 'pages/decision'
    save(page / 'page.json', {'$schema': 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.0.0/schema.json', 'name': 'decision', 'displayName': 'NOLA PULSE · Decision economics', 'displayOption': 'FitToPage', 'width': 1280, 'height': 720})

    def field(table, column, measure=False):
        return {('Measure' if measure else 'Column'): {'Expression': {'SourceRef': {'Entity': table}}, 'Property': column}}

    def visual(name, visual_type, x, y, width, height, roles, title):
        query = {'queryState': {role: {'projections': [{'field': field(t, c, m), 'queryRef': f'{t}.{c}', 'nativeQueryRef': c} for t, c, m in fields]} for role, fields in roles.items()}}
        config = {'visualType': visual_type, 'query': query, 'drillFilterOtherVisuals': True,
                  'visualContainerObjects': {'title': [{'properties': {'show': expression(True), 'text': expression(title)}}]}}
        save(page / f'visuals/{name}/visual.json', {'$schema': 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json', 'name': name, 'position': {'x': x, 'y': y, 'width': width, 'height': height, 'z': y+x, 'tabOrder': y+x}, 'visual': config})

    visual('scenario', 'slicer', 25, 20, 420, 90, {'Values': [('Scenarios', 'label', False)]}, 'Select one scenario · all inputs are assumed')
    visual('decision', 'card', 470, 20, 785, 90, {'Values': [('Scenarios', 'Decision', True)]}, 'Campaign decision · conditional economics')
    visual('net', 'card', 25, 130, 390, 110, {'Values': [('Scenarios', 'Net Contribution', True)]}, 'Net incremental contribution')
    visual('threshold', 'card', 445, 130, 390, 110, {'Values': [('Scenarios', 'Break-even Share', True)]}, 'Incrementality reversal threshold')
    visual('costs', 'card', 865, 130, 390, 110, {'Values': [('Scenarios', 'Campaign Costs', True)]}, 'Total campaign costs')
    visual('curve', 'lineChart', 25, 265, 610, 300, {'Category': [('Curves', 'incremental_share', False)], 'Y': [('Scenarios', 'Curve Net Contribution', True)]}, 'Decision reversal · other inputs held fixed')
    visual('markets', 'tableEx', 660, 265, 595, 300, {'Values': [('Markets', 'name', False), ('Markets', 'population', False), ('Markets', 'population_change_pct', False), ('Markets', 'median_income', False)]}, 'Census context · population 2025 / income ACS 2020–24')
    visual('assumptions', 'tableEx', 25, 585, 1230, 110, {'Values': [('Scenarios', c, False) for c in ['label', 'budget', 'costPerOrder', 'incrementality', 'ticketsPerOrder', 'contributionPerTicket', 'fixedCosts']]}, 'Explicit assumptions · not team campaign results')
    (DEST / 'measures.dax').write_text('\n\n'.join(f'{n} =\n{e}' for n,e,_ in measures) + '\n')
    print(f'Generated {len(tables)} model tables, {len(measures)} measures, and 8 report visuals. Desktop verification pending.')


if __name__ == '__main__':
    build()
