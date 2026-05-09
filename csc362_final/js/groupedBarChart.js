function GroupedBarChart(data, onYearClick) {
  // Specify the chart’s dimensions.
  const width = 1500;
  const height = 1300;
  const marginTop = 47;
  const marginRight = 10;
  const marginBottom = 10;
  const marginLeft = 150;

  // Prepare the scales for positional and color encodings.
  // Fx encodes the year (vertical positioning).
  const yearMap = new Set(data.map(d => d.year)); 
  console.log(yearMap);
  const fx = d3.scaleBand()
      .domain(yearMap)
      .rangeRound([marginTop, height - marginBottom])
      .paddingInner(0.1);

  // Both x and color encode the country.
  const topCountries = new Set(data.map(d => d.country));
  console.log(topCountries);

  const x = d3.scaleBand()
      .domain(topCountries)
      .rangeRound([0, fx.bandwidth()])
      .padding(0.05);

  const color = d3.scaleOrdinal()
      .domain(topCountries)
      .range(d3.schemePaired);

  // X encodes the width of the bar (medal count).
  const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.medalCount)]).nice()
      .rangeRound([marginLeft, width - marginRight]);

  // A function to format the value in the tooltip.
  const formatValue = x => isNaN(x) ? "N/A" : x.toLocaleString("en")

  // Create the SVG container.
  const svg = d3.select("#grouped-bar-chart").append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width + 200, height])
      .attr("style", "max-width: 100%; height: auto;")
      .attr("role", "img")
      .attr("aria-label", "Grouped bar chart showing Olympic Track and Field medal counts by country per year");

  svg.append("text")
  .attr("x", width / 2)
  .attr("y", marginTop - 30)  // slightly above the chart area
  .attr("text-anchor", "middle")
  .style("font-size", "40px")
  .style("font-family", "McKinley")
  .style("font-weight", "bold")
  .text("Olympic Track & Field Medal Counts by Country");

  // Hide decorative elements from screen reader
  svg.selectAll(".tick line, .domain")
   .attr("aria-hidden", "true");

  // Append a group for each year, and a rect for each country.
  svg.append("g")
    .selectAll()
    .data(d3.group(data, d => d.year))
    .join("g")
      .attr("transform", ([year]) => `translate(0,${fx(year)})`)
    .selectAll()
    .data(([year, d]) => {
        const sorted = d.slice().sort((a, b) => d3.descending(a.medalCount, b.medalCount));
        const xYear = d3.scaleBand()
            .domain(sorted.map(d => d.country))
            .range([0, fx.bandwidth()])
            .padding(0.05);

        return sorted.map(d => ({ ...d, xYear }));
    })
    .join("rect")
      .attr("x", d => y(0)) // start at 0
      .attr("y", d => d.xYear(d.country)) // country position
      .attr("width", d => y(d.medalCount) - y(0)) // medal count extent
      .attr("height", d => d.xYear.bandwidth()) // country band height
      .attr("fill", d => color(d.country))
      .attr("class", "bar")
      .attr("role", "img")
      .attr("tabindex", "0")
      .style("stroke", "black")
      .style("stroke-width", "2px")
      .attr("aria-label", d => `${d.country}, ${d.medalCount} medals in ${d.year}`)
      .append("title")
      .text(d => `${d.country}: ${d.medalCount} medals in ${d.year}`);

  // Append the vertical axis (years).
  svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(fx).tickSizeOuter(0))
      .call(g => g.selectAll(".domain").remove())
      .selectAll("text")
      .style("font-size", "35px")
      .style("font-family", "McKinley")
      .style("cursor", onYearClick ? "pointer" : null)
      .on("click", function(event, year) {
        if (onYearClick) onYearClick(year);
      })
      .on("mouseover", function(event, year) {
        d3.select(this)
        .transition()
        .duration(250)
        .style("font-size", "50px")
      .style("font-family", "McKinley")
      .style("font-weight", "bold");
      })
      .on("mouseout", function(event, year) {
        d3.select(this)
        .transition()
        .duration(250)
        .style("font-size", "35px")
      .style("font-family", "McKinley")
      .style("font-weight", "normal");
      });


  // Append the horizontal axis (medal count).
  svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(y).ticks(null, "s"))
      .call(g => g.selectAll(".domain").remove())
      .selectAll("text")
      .style("font-size", "30px")
      .style("font-family", "McKinley");

  // Add axis labels
  
  // X-axis label (Medal Count)
  svg.append("text")
      .attr("transform", `translate(${width / 2}, ${height - marginBottom + 80})`)
      .style("text-anchor", "middle")
      .style("font-size", "45px")
      .style("font-family", "McKinley")
      .text("Medal Count");

  // Y-axis label (Year)
  svg.append("text")
      .attr("transform", `translate(${marginLeft - 100}, ${height / 2}) rotate(-90)`)
      .style("text-anchor", "middle")
      .style("font-size", "45px")
      .style("font-family", "McKinley")
      .text("Year");

// adds legend for color

  const legend = svg.append("g")
    .attr("transform", `translate(${width - 200}, ${marginTop + 200})`);

// Bind data and append elements
   const legendCountry = legend.selectAll(".legend-item")
    .data(topCountries)
    .enter().append("g")
    .attr("transform", (d, i) => `translate(0, ${i * 40})`);

// Adds colored squares
legendCountry.append("rect")
    .attr("width", 35)
    .attr("height", 35)
    .attr("fill", d=> color(d))
    .attr("role", "img")
    .style("stroke", "black")
    .style("stroke-width", "2px")
    .attr("aria-label", d => `Legend: ${d}, click to highlight`)
    .append("title")
    .text(d => `${d} — hover to highlight all bars for this country`);


// Adds text labels to legends
legendCountry.append("text")
    .attr("x", 55)
    .attr("y", 35)
    .text(d => d)
    .style("font-size", "35px")
    .style("font-family", "McKinley")
    .attr("aria-hidden", "true");

// Adds tooltip for legend
legendCountry.selectAll("rect")
  .on("mouseover", function(event, d) {
    // d is the country name string e.g. "USA"

    // dim all bars
    d3.selectAll("rect")
      .style("opacity", 0.2);

    // highlight bars matching this country
    d3.selectAll("rect")
      .filter(rect_d => rect_d.country === d)
      .style("opacity", 1)
      .style("stroke", "black")
      .style("stroke-width", "4px");
  })
  .on("mouseout", function(event, d) {
    // reset all bars
    d3.selectAll("rect")
      .style("opacity", 1)
      .style("stroke", "none")
      .style("stroke", "black")
      .style("stroke-width", "2px");
  });

// Add tooltip for bars in barchart
const tooltip = d3.select("body")
  .append("div")
  .style("opacity", 0)
  .attr("class", "tooltip")
  .style("position", "fixed")        // fixed so it follows cursor correctly
  .style("background-color", "#111111")
  .style("border", "solid")
  .style("border-width", "1px")
  .style("border-radius", "5px")
  .style("padding", "10px")
  .style("pointer-events", "none");  // prevents tooltip from blocking mouse events

  let tooltipTimeout;

  d3.selectAll(".bar") // 
  .on("mouseover", function(event, d) {
    clearTimeout(tooltipTimeout); // cancel any pending hide
    d3.select(this)
      .style("stroke", "black")
      .style("stroke-width", "5px");

      tooltip
      .style("opacity", 1)
      .style("font-family", "McKinley")
      .style("font-size", "14px")
      .style("color", "white")
      .style("font-weight", "bold")
      .html(`
        <strong>${d.country}</strong><br/>
        Medals: ${d.medalCount}
      `);
  })

  .on("mousemove", function(event, d) {
    // Keep tooltip near the cursor as the mouse moves
    tooltip
      .style("left", (event.clientX + 15) + "px")
      .style("top",  (event.clientY - 28) + "px");
  })

  .on("mouseout", function(event, d) {
    tooltipTimeout = setTimeout(() => {
      tooltip.style("opacity", 0);
    }, 100); // 100ms grace period
    d3.select(this)
      .style("stroke-width", "2px"); // Remove border
});


  // Return the chart with the color scale as a property (for the legend).
  return Object.assign(svg.node(), {scales: {color, x: y}});
}
