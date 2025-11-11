import * as d3 from 'd3';

export async function tipsByTripAmountByScatterPlot(data, margens = { left: 60, right: 50, top: 25, bottom: 50 }) {
  const svg = d3.select('svg');

  if (!svg) {
    return;
  }

  const width = parseFloat(svg.attr('width'));
  const height = parseFloat(svg.attr('height'));

  const innerWidth = width - margens.left - margens.right;
  const innerHeight = height - margens.top - margens.bottom;

  // Conversão: transforma BigInt em Number
  data = data.map(obj =>
    Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])
    )
  );

  // ---- Escalas
  const dispersaoX = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.total_corridas)])
    .range([0, innerWidth]);

  const dispersaoY = d3.scaleLinear()
    .domain([d3.max(data, d => d.media_gorjeta + 0.5), d3.min(data, d => d.media_gorjeta - 0.5)])
    .range([0, innerHeight]);

  // ---- Eixos
  const g = svg.append('g')
    .attr('transform', `translate(${margens.left}, ${margens.top})`);

  const eixoX = d3.axisBottom(dispersaoX);

  g.append('g')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(eixoX)
    .attr('class', 'eixo-x');

  const eixoY = d3.axisLeft(dispersaoY);

  g.append('g')
    .call(eixoY)
    .attr('class', 'eixo-y');

  // ---- Estilização dos Eixos
  g.append('text')
    .attr('x', innerWidth / 2)
    .attr('y', innerHeight + 40)
    .attr('text-anchor', 'middle')
    .attr('class', 'rotulo-eixo')
    .style('font-size', '14px')
    .text('Total de Corridas');

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -innerHeight / 2)
    .attr('y', -40)
    .attr('text-anchor', 'middle')
    .attr('class', 'rotulo-eixo')
    .style('font-size', '14px')
    .text('Média de Gorjetas');

  // --- Plot
  g.selectAll('.ponto-dispersao')
    .data(data)
    .enter()
    .append('circle')
    .attr('class', 'ponto-dispersao')
    .attr('cx', d => dispersaoX(d.total_corridas))
    .attr('cy', d => dispersaoY(d.media_gorjeta))
    .attr('r', 8)
    .attr('fill', '#ec2e19ff')
    .attr('opacity', 0.7)
    .attr('stroke', '#8f291eff')
    .attr('stroke-width', 1, 5);

  // ---- Linha de tendência
  const n = data.length;
  const sumX = data.reduce((sum, d) => sum + d.total_corridas, 0);
  const sumY = data.reduce((sum, d) => sum + d.media_gorjeta, 0);
  const sumXY = data.reduce((sum, d) => sum + (d.total_corridas * d.media_gorjeta), 0);
  const sumX2 = data.reduce((sum, d) => sum + Math.pow(d.total_corridas, 2), 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - Math.pow(sumX, 2));
  const intercept = (sumY - slope * sumX) / n;

  const linhaTendencia = [
    { total_corridas: 0, media_gorjeta: intercept },
    { total_corridas: d3.max(data, d => d.total_corridas), media_gorjeta: slope * d3.max(data, d => d.total_corridas) + intercept }
  ];

  const geradorLinhaTendencia = d3.line()
    .x(d => dispersaoX(d.total_corridas))
    .y(d => dispersaoY(d.media_gorjeta));

  g.append('path')
    .datum(linhaTendencia)
    .attr('class', 'linha-tendencia')
    .attr('d', geradorLinhaTendencia)
    .attr('fill', 'none')
    .attr('stroke', '#2C3E50')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '5,5')
    .attr('opacity', 0.8);

}
