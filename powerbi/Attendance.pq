let
    Source = Csv.Document(File.Contents(DataFolder & "attendance_games.csv"), [Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
    Headers = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    Typed = Table.TransformColumnTypes(Headers, {{"event_id", type text}, {"franchise", type text}, {"season", type number}, {"season_label", type text}, {"starts_at", type text}, {"opponent", type text}, {"venue", type text}, {"attendance", type number}, {"source_id", type text}, {"source_url", type text}, {"corrected", type number}, {"game_number", type number}}, "en-US")
in
    Typed
