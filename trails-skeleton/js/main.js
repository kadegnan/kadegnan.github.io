// Global objects go here (outside of any functions)
let data, scatterplot, barchart;
let difficultyFilter = [];
const dispatcher = d3.dispatch('filterCategories');

dispatcher.on('filterCategories', selectedCategories => {
    if (selectedCategories.length == 0) {
        scatterplot.data = data;
    } else {
        scatterplot.data = data.filter(d => selectedCategories.includes(d.difficulty));
    }
    scatterplot.updateVis();
});

/**
 * Load data from CSV file asynchronously and render charts
 */
d3.csv('data/vancouver_trails.csv')
    .then(_data => {
        data = _data; // for safety, so that we use a local copy of data.

        //data preprocessing
        // to fix: time and distance 
        _data.forEach(element => {
            element.time = +element.time;
            element.distance = +element.distance
        });
        console.log(_data);

        // Initialize scale
        // TODO: add an ordinal scale for the difficulty
        const colorScale = d3.scaleOrdinal()
            .domain(["Easy", "Intermediate", "Difficult"])
            .range(["#5cba5b", "#288028", "#034f02"]);

        scatterplot = new Scatterplot({ parentElement: '#scatterplot', colorScale: colorScale }, _data); //we will update config soon
        scatterplot.updateVis();

        barchart = new Barchart({ parentElement: '#barchart', colorScale: colorScale }, dispatcher, _data);
        barchart.updateVis();
    })
    .catch(error => console.error(error));


/**
 * Use bar chart as filter and update scatter plot accordingly
 */
// function filterData() {
//     if (difficultyFilter.length == 0) {
//         scatterplot.data = data;
//     } else {
//         scatterplot.data = data.filter(d =>
//             difficultyFilter.includes(d.difficulty));
//     }
//     scatterplot.updateVis();
// }

