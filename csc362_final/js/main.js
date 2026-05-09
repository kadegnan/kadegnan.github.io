
// Global objects
let data, collapsibleTree, groupedBarchart;

// Main JavaScript file for data visualization

d3.json("data/athletics_medals.json").then(data => {
  // Flatten the data for the grouped bar chart
  const flatData = data.flatMap(yearObj =>
    yearObj.children.map(country => ({
      year: yearObj.year,
      country: country.country,
      medalCount: country.medalCount
    }))
  );

  // Define color scale
  const countries = Array.from(new Set(flatData.map(d => d.country)));
  const color = d3.scaleOrdinal()
    .domain(countries)
    .range(d3.schemeSet1);

  // Initialize tree controller
  const treeController = {
    updateYear: (year) => {
      const yearObj = data.find(d => d.year == year);
      if (yearObj) createCollapsibleTree(yearObj, color);
    }
  };

  // Initialize with first year
  treeController.updateYear(data[0].year);

  console.log(flatData);
  GroupedBarChart(flatData, year => treeController.updateYear(year));

  // Add help icon
  const helpIcon = d3.select("body").append("svg")
    .attr("class", "help-icon")
    .attr("width", 175)
    .attr("height", 45);

  helpIcon.append("circle")
    .attr("cx", 19)
    .attr("cy", 19)
    .attr("r", 17)
    .style("fill", "#f0f0f0")
    .style("stroke", "black")
    .style("stroke-width", 2);

  helpIcon.append("text")
    .attr("x", 20)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("fill", "black")
    .style("font-family", "Arial, sans-serif")
    .text("?");

  helpIcon.append("text")
  .attr("x", 45)        // starts just after the circle
  .attr("y", 25)
  .attr("text-anchor", "start")
  .style("font-size", "16px")
  .style("fill", "black")
  .style("font-family", "Comic Sans MS")
  .text("Click me for help");

  helpIcon.on("click", () => {
  const popup = d3.select("#help-popup");
  popup.classed("show", !popup.classed("show")); // toggle
});

d3.select("#close-help").on("click", (e) => {
  e.stopPropagation(); // stop click bubbling up to helpIcon
  d3.select("#help-popup").classed("show", false);
});

}).catch(error => console.error(error));
