// set the dimensions and margins of the graph
const width = 150;
const height = 150;

// The radius of the pieplot is half the width or half the height (smallest one).
const radius = Math.min(width, height) / 2;

function getColor(key) {
  switch (key) {
    case "yes":
      return "#30a64a";
    case "no":
      return "#da3848";
    case "skip":
      return "#25a1b7";
    default:
      break;
  }
}
// append the svg object to the div called 'my_dataviz'
const svg = d3
  .select("#votes-pie")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .append("g")
  .attr("transform", `translate(${width / 2},${height / 2})`);

// Create dummy data
const data = {
  yes: 50,
  no: 30,
  skip: 20,
};

// Compute the position of each group on the pie:
const pie = d3.pie().value((d) => d.value);
const data_ready = pie(d3.entries(data));
// Now I know that group A goes from 0 degrees to x degrees and so on.

// shape helper to build arcs:
const arcGenerator = d3.arc().innerRadius(0).outerRadius(radius);

// Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
svg
  .selectAll("mySlices")
  .data(data_ready)
  .enter()
  .append("path")
  .attr("d", arcGenerator)
  .attr("fill", (d) => getColor(d.data.key))
  .attr("stroke", "black")
  .style("stroke-width", "1px")
  .style("opacity", 0.7);

// Now add the annotation. Use the centroid method to get the best coordinates
svg
  .selectAll("mySlices")
  .data(data_ready)
  .enter()
  .append("text")
  .text((d) => `${d.data.key} ${d.data.value}%`)
  .attr("transform", (d) => `translate(${arcGenerator.centroid(d)})`)
  .style("text-anchor", "middle")
  .style("font-size", 17);
