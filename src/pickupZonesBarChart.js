import * as d3 from "d3";

export function pickupZonesBarChart(data) {
  const width = 800;
  const height = 500;
  const margin = { top: 30, right: 30, bottom: 120, left: 100 };

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3.scaleBand()
    .domain(data.map(d => d.zone_name))
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.num_trips)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", d => x(d.zone_name))
    .attr("y", d => y(d.num_trips))
    .attr("height", d => y(0) - y(d.num_trips))
    .attr("width", x.bandwidth())
    .attr("fill", "seagreen");

  // Eixo X
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  // Eixo Y
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // Título
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .text("Top 20 zonas de embarque (Green Taxi - NYC)");
}
