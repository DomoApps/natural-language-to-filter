# Natural Language to Filter
Sample code for a simple widget that converts natural language queries into Domo filter events using Domo's AI Service Layer.

To configure this app, you just need to adjust the list of the columns to filter by in `app.js`. This app will use whichever LLM you have configured as the default for the text generation service in Domo's AI Service Layer. Typically, the default is set to DomoGPT, Domo's LLM hosted, to ensure that your data never leaves the Domo environment.


## Disclaimers

Please be aware that if you chose to leverage an externally hosted LLM, this app will send both column information as well as the possible values for each column to that LLM for translation into a Domo filter event object.

Please also be aware that the more columns and possible values that you include in the app, the longer the prompt you will send. DomoGPT has a very large context window so this typically won't cause any issues, but the query will fail if the prompt exceeds the size of the context window for the LLM that you are using.

As with all generative AI applications, please carefully review the output to ensure the expected behavior.

## Contributing

This is an experimental component. Feel free to open pull requests or log issues to contribute to this repo.


## Known limitations

- This app won't be able to programatically adjust global date filters, but can filter on columns with date types.


