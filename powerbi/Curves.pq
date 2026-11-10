let
    Source = Csv.Document(File.Contents(DataFolder & "curves.csv"), [Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
    Headers = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    Typed = Table.TransformColumnTypes(Headers, {{"scenario_id", type text}, {"incremental_share", type number}, {"net_contribution", type number}}, "en-US")
in
    Typed
