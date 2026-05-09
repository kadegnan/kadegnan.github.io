
function createCollapsibleTree(yearObj, countryColor) {
  
  // Clear previous tree
  d3.select("#collapsible-tree").selectAll("*").remove();
  
  const width = 2400;
  const marginTop = 120;
  const marginRight = 5;
  const marginBottom = 10;
  const marginLeft = 100;
 
  // Get top 5 countries by medal count
  const top5Countries = yearObj.children
    .sort((a, b) => b.medalCount - a.medalCount)
    .slice(0, 5);
  
  const countries = top5Countries.map(c => c.country);
  const color = d3.scaleOrdinal()
    .domain(countries)
    .range(d3.schemePaired);
 
  // Root is the year, children are top 5 countries
  const root = d3.hierarchy({ name: yearObj.year, children: top5Countries });
  console.log(root);
  const dx = 28;
  const dy = (width - marginRight - marginLeft -30) / (1 + root.height);
 
  const tree = d3.tree()
  .nodeSize([dx, dy])
  .separation((a, b) => {
      if (a.parent === b.parent) {
      if (a.depth === 1) return 2.5;   // countries — most spread out
      if (a.depth === 2) return 2;   // events — medium spacing
      if (a.depth >= 3) return 1.25;  // athletes — still readable
    }
    return 4; // nodes from different parents
  });
  const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);
 
  
  const svg = d3.select("#collapsible-tree").append("svg")
    .attr("width", width)
    .attr("height", dx)
    .attr("viewBox", [-marginLeft, -marginTop, width + 150, dx])
    .attr("style", "max-width: 100%; height: auto; font-family: McKinley; user-select: none;")
    .style("font-size", "40px")
    // Expose the interactive nodes to assistive tech; `role="img"` can cause
    // some screen readers to treat the SVG as a single image and ignore children.
    .attr("role", "tree")
    .attr("aria-orientation", "vertical")
    .attr("aria-label", `Collapsible tree showing top 5 countries and their medals for ${yearObj.year}`);

  const getCountryAncestor = (node) => {
    if (node?.data?.country) return `${node.data.country}`;
    if (node?.parent) return getCountryAncestor(node.parent);
    return "";
  };

  const nodeAriaExpanded = (d) => {
    // Only meaningful when the node can expand/collapse.
    const canToggle = Boolean(d._children || d.children);
    if (!canToggle) return null;
    return d.children ? "true" : "false";
  };

  const nodeAriaLabel = (d) => {
    const country = getCountryAncestor(d);
    const canToggle = Boolean(d._children || d.children);
    const toggleHint = canToggle ? (d.children ? "press Enter or Space to collapse" : "press Enter or Space to expand") : "";

    if (d.depth === 0) return `Root: ${d.data.name}. ${toggleHint}`.trim();
    if (d.data.country) return `${d.data.country}, ${d.data.medalCount} medals. ${toggleHint}`.trim();
    if (d.data.event) return d.data.type === "team"
      ? `${country}: Event: ${d.data.event}, ${d.data.gender}, ${d.data.medal}. ${toggleHint}`.trim()
      : `${country}: Event: ${d.data.event}, ${d.data.medalCount} medals. ${toggleHint}`.trim();
    if (d.data.athlete) return d.data.medal
      ? `${country}: Athlete: ${d.data.athlete}, ${d.data.medal} medal. ${toggleHint}`.trim()
      : `${country}: Athlete: ${d.data.athlete}. ${toggleHint}`.trim();
    return (d.data.name || "").trim();
  };


  const gLink = svg.append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 2);
 
  const gNode = svg.append("g")
    .attr("cursor", "pointer")
    .attr("pointer-events", "all");
 
  function update(event, source) {
    const duration = 750;
    const nodes = root.descendants().reverse();
    const links = root.links();
 
    tree(root);
 
    let left = root;
    let right = root;
    root.eachBefore(node => {
      if (node.x < left.x) left = node;
      if (node.x > right.x) right = node;
    });
 
    const height = right.x - left.x + marginTop + marginBottom;
 
    const transition = svg.transition()
      .duration(duration)
      .attr("height", height + 10)
      .attr("viewBox", [-marginLeft, left.x - marginTop + 50, width, height])
      .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"));
 
    const node = gNode.selectAll("g")
      .data(nodes, d => d.id);
 
    const nodeEnter = node.enter().append("g")
      .attr("transform", d => `translate(${source.y0},${source.x0})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0)
      .attr("role", "treeitem")
      .attr("tabindex", 0)
      .attr("focusable", true)
      .attr("aria-label", d => nodeAriaLabel(d))
      .attr("aria-expanded", d => nodeAriaExpanded(d))
      .on("keydown", (event, d) => {
        const key = event.key;
        if (key !== "Enter" && key !== " ") return;
        event.preventDefault();
        event.stopPropagation();

        d.children = d.children ? null : d._children;

        d3.select(event.currentTarget)
          .attr("aria-label", nodeAriaLabel(d))
          .attr("aria-expanded", nodeAriaExpanded(d));

        update(event, d);
      })
      .on("click", (event, d) => {
        d.children = d.children ? null : d._children;

      // toggle text side based on whether node is now expanded or collapsed
        d3.select(event.currentTarget).select("text")
          .attr("x", d.children ? -10 : 10)
          .attr("text-anchor", d.children ? "end" : "start");

      d3.select(event.currentTarget)
        .attr("aria-label", nodeAriaLabel(d))
        .attr("aria-expanded", nodeAriaExpanded(d));

      update(event, d);
    });
     
 
    nodeEnter.append("circle")
      .attr("r", 12)
      .attr("fill", d => d.data?.country ? color(d.data.country) : "#555")
      .attr("stroke-width", 10);
 
    nodeEnter.append("text")
      .attr("dy", "0.31em")
      .attr("x", d => {
          if (d.depth <= 1) return -10;
            return d.children ? -10 : 10;
      })
      .attr("text-anchor", d => d.depth <= 1 ? "end" : "start")
      // .attr("x", d => d._children ? -10 : 10)
      // .attr("text-anchor", d => d._children ? "end" : "start")
      .text(d => {
        if (d.depth === 0) return d.data.name;
        if (d.data.country) return `${d.data.country} (${d.data.medalCount})`;
        if (d.data.event)   return d.data.type === "team"
          ? `${d.data.event} – ${d.data.gender} (${d.data.medal}, ${d.data.medalCount})`
          : `${d.data.event} (${d.data.medalCount})`;
        if (d.data.athlete) {
          if (d.data.medal == undefined) return `${d.data.athlete}`;
          else return `${d.data.athlete} (${d.data.medal})`;
        }
        return d.data.athlete + ` (${d.data.medal}) ` || "";
      })
      .attr("stroke-linejoin", "round")
      // .attr("stroke-width", 7)
      // .attr("stroke", "white")
      .attr("paint-order", "stroke");
 
    node.merge(nodeEnter).transition(transition)
  .attr("transform", d => `translate(${d.y},${d.x})`)
  .attr("fill-opacity", 1)
  .attr("stroke-opacity", 1)
  .select("text")
  .attr("x", d => {
    if (d.depth <= 1) return -10;          // root and countries always left
    return d.children ? -10 : 10;          // events/athletes flip based on state
  })
  .attr("text-anchor", d => {
    if (d.depth <= 1) return "end";
    return d.children ? "end" : "start";
  });
 
    node.exit().transition(transition).remove()
      .attr("transform", d => `translate(${source.y},${source.x})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);
 
    const link = gLink.selectAll("path")
      .data(links, d => d.target.id);
 
    const linkEnter = link.enter().append("path")
      .attr("aria-hidden", "true")
      .attr("d", d => {
        const o = { x: source.x0, y: source.y0 };
        return diagonal({ source: o, target: o });
      });
 
    link.merge(linkEnter).transition(transition)
      .attr("d", diagonal);
 
    link.exit().transition(transition).remove()
      .attr("d", d => {
        const o = { x: source.x, y: source.y };
        return diagonal({ source: o, target: o });
      });
 
    root.eachBefore(d => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }
 
  root.x0 = dy / 2;
  root.y0 = 0;
  root.descendants().forEach((d, i) => {
    d.id = i;
    d._children = d.children;
    if (d.depth > 0) d.children = null;
  });
 
  update(null, root);
}

