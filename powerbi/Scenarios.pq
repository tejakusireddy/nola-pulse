let
    Source = Csv.Document(File.Contents(DataFolder & "scenarios.csv"), [Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
    Headers = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    Typed = Table.TransformColumnTypes(Headers, {{"scenario_id", type text}, {"label", type text}, {"budget", type number}, {"costPerOrder", type number}, {"ticketsPerOrder", type number}, {"contributionPerTicket", type number}, {"incrementality", type number}, {"fixedCosts", type number}, {"attributedOrders", type number}, {"incrementalOrders", type number}, {"incrementalTickets", type number}, {"grossContribution", type number}, {"totalCosts", type number}, {"netContribution", type number}, {"breakEvenShare", type number}, {"breakEvenOrders", type number}, {"maxCostPerOrder", type number}, {"minContributionPerTicket", type number}, {"marginOfSafety", type number}, {"feasible", type logical}, {"status", type text}}, "en-US")
in
    Typed
