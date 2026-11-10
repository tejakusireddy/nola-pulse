let
    Source = Csv.Document(File.Contents(DataFolder & "market_comparison.csv"), [Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
    Headers = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    Typed = Table.TransformColumnTypes(Headers, {{"market_id", type text}, {"name", type text}, {"short_name", type text}, {"state", type text}, {"population", type number}, {"population_change_pct", type number}, {"households", type number}, {"median_income", type number}, {"source_url", type text}, {"population_vintage", type text}, {"income_vintage", type text}, {"reviewed_on", type text}, {"income_difference_vs_orleans_pct", type number}, {"growth_difference_vs_orleans_pp", type number}}, "en-US")
in
    Typed
