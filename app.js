// DDX Bricks Wiki - See https://developer.domo.com/docs/ddx-bricks/getting-started-using-ddx-bricks
// for tips on getting started, linking to Domo data and debugging your app
 


//
// Define which fields you want to be able to filter by here
//
var fields = ["name", "rank"]
let data; // Global variable to store the data

var domo = window.domo; // For more on domo.js: https://developer.domo.com/docs/dev-studio-guides/domo-js#domo.get
var datasets = window.datasets;

fetchData();

async function fetchData() {
    try {
        // clear existing filters
        domo.filterContainer([]);
        data = await getData();
        // Now you have access to the resolved data directly
        console.log(data);
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

async function getData(){
  // Get Data From Dataset
  var query = `/data/v1/${datasets[0]}?fields=${fields.join()}`;
  const data = await domo.get(query);
  return data;
}

var inputElement = document.getElementById('inputText');
var submitButton = document.getElementById('submitButton');
var clearButton = document.getElementById('clearButton');


 // Setup event listener on filter form
  submitButton.addEventListener('click', async function(event) {
      

      event.preventDefault();
      const inputValue = inputElement.value;
      console.log('Captured value:', inputValue);

      // Disable the submit button and show "Generating Filters" text
      submitButton.disabled = true;
      submitButton.innerText = 'Generating Filters';

      console.log('converting question to a prompt');

      console.log("data", data)

      var possibleValuesforColumns = getPossibleValuesForColumns(data, fields);

      console.log("GETTING POSSIBLE VALUES....")
      console.log("RESULT",possibleValuesforColumns)

      const prompt = constructPrompt(inputValue, fields, possibleValuesforColumns);

      console.log('prompting GPT to create filtersArray');
      try {
          const filtersArray = await getFiltersArray(prompt);
          console.log('applying filter');
          domo.filterContainer(filtersArray);
      } catch (error) {
          console.error('Error:', error);
      } finally {
          // Re-enable the submit button and restore its original text
          submitButton.disabled = false;
          submitButton.innerText = 'Submit';
      }
  });

domo.onFiltersUpdate(console.log);



clearButton.addEventListener('click', function() {
  
  console.log("clearing filters");
  domo.filterContainer([]);

});


function handleInputChange() {
    if (inputElement.value.length >= 5) {
        submitButton.removeAttribute('disabled');
    } else {
        submitButton.setAttribute('disabled', 'true');
    }
}

function constructPrompt(question, columns, possibleValuesforColumns) {

	const prompt = `Please respond with only valid JSON that can be passed to the domo.filterContainer method, which takes an array of objects that make up a filter configuration. Please don’t include anything else in the response aside from the valid JSON. Example of applying the method: 
					domo.filterContainer([{
            column: 'category',
            operator: 'IN',
            values: ['ALERT'],
            dataType: 'STRING'
          }]);

          column: a string representing the column name
          operator: the comparison operator that the filter will use. Possible values include:
          'IN', 'NOT_IN', 'GREATER_THAN', 'GREAT_THAN_EQUALS_TO', 'LESS_THAN', 'LESS_THAN_EQUALS_TO', 'BETWEEN', 'NOT_BETWEEN', 'LIKE', 'NOT_LIKE'

          values: an array of values to compare against.
          dataType: the type of data that is contained in the values array. Possible values include:
          'DATE', 'DATETIME', 'NUMERIC', 'STRING'

          The user has asked the question: "${question}"

          Possible column names include: ${columns} 

          Possible values for ${possibleValuesforColumns}`;
  
  return prompt;

}

function getPossibleValuesForColumns(data, columns) {
    const valueCounts = {};

    // Initialize valueCounts object with empty Sets for each column
    columns.forEach(column => {
        valueCounts[column] = new Set();
    });

    // Iterate through data to collect unique non-empty values for each column
    data.forEach(entry => {
        columns.forEach(column => {
            const value = entry[column];
            if (value !== undefined && value !== null && value !== "") {
                valueCounts[column].add(value);
            }
        });
    });

    // Convert Sets to arrays and construct the string representation
    let result = '';
    columns.forEach(column => {
        const possibleValues = Array.from(valueCounts[column]);
        result += `Possible values for '${column}' include: ${possibleValues.join(', ')}. \n`;
    });

    return result;
}


function generateText(prompt) {
  const body = {
    "input": prompt
  }

  return domo.post(`/domo/ai/v1/text/generation`, body)
}

async function getFiltersArray(prompt) {
  
  console.log(prompt);
  console.log("generating text");
  const gptResponse = await generateText(prompt);
  
  // Parse the JSON response and validate it
  try {
    const jsonResponse = gptResponse.choices[0].output;
    const parsedResponse = JSON.parse(jsonResponse);
    if (validateFilterConfig(parsedResponse)) {
      console.log("JSON response is valid and parsed successfully:", parsedResponse);
      return parsedResponse
    } else {
      console.log("JSON response is not valid.");
    }
  } catch (error) {
    console.error("Error parsing JSON response:", error.message);
  }
}

// Function to validate the JSON response
function validateFilterConfig(config) {
  if (!Array.isArray(config)) {
    return false;
  }

  for (const filter of config) {
    if (
      typeof filter.column !== "string" ||
      typeof filter.operator !== "string" ||
      !Array.isArray(filter.values) ||
      filter.values.length === 0 ||
      typeof filter.dataType !== "string" ||
      !["DATE", "DATETIME", "NUMERIC", "STRING"].includes(filter.dataType)
    ) {
      return false;
    }
  }

  return true;
}


