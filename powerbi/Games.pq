let
    Source = Csv.Document(File.Contents(DataFolder & "games.csv"), [Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
    Headers = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    Typed = Table.TransformColumnTypes(Headers, {{"game_id", type text}, {"franchise", type text}, {"opponent", type text}, {"starts_at", type text}, {"venue", type text}, {"source_url", type text}, {"retrieved_at", type text}}, "en-US")
in
    Typed
