// src/seasons.js
// Linhas de corridas por mês (2022 vs 2023) + faixas por estação (HN)

import * as d3 from "d3";

function getSvgSize(svgSel, fallbackW = 800, fallbackH = 400) {
  const svg = svgSel;
  const width =
    parseFloat(svg.attr("width")) ||
    parseFloat(svg.style("width")) ||
    (svg.node()?.getBoundingClientRect?.().width ?? fallbackW);

  const height =
    parseFloat(svg.attr("height")) ||
    parseFloat(svg.style("height")) ||
    (svg.node()?.getBoundingClientRect?.().height ?? fallbackH);

  return { width, height };
}

// --- faixas de estações ---
function faixaDasEstacoes(g, x, innerHeight) {
  const bands = [
    { name: "Inverno",  start: 1,  end: 2,  color: "rgba(0, 90, 200, 0.25)" }, // azul
    { name: "Primavera",start: 3,  end: 5,  color: "rgba(0, 150, 50, 0.25)" }, // verde
    { name: "Verão",    start: 6,  end: 8,  color: "rgba(220, 50, 0, 0.25)" },  // vermelho
    { name: "Outono",   start: 9,  end: 11, color: "rgba(255, 190, 0, 0.35)" }, // amarelo
    { name: "Inverno",  start: 12, end: 12, color: "rgba(0, 90, 200, 0.25)" }   // azul
  ];

  const inicioFaixa = (m) => x(m - 0.5);
  const fimFaixa   = (m) => x(m + 0.5);

  g.selectAll(".season-band")
    .data(bands)
    .enter()
    .append("rect")
    .attr("class", "season-band")
    .attr("x", d => inicioFaixa(d.start))
    .attr("y", 0)
    .attr("width", d => fimFaixa(d.end) - inicioFaixa(d.start))
    .attr("height", innerHeight)
    .attr("fill", d => d.color);
}

// --- principal ---
export async function plotGraficoEstacoes(taxi) {
  // checa se tabelas existem
  async function tabelaExiste(name) {
    const rows = await taxi.query(`
      SELECT 1 AS ok FROM information_schema.tables
      WHERE table_name = '${name}' LIMIT 1;
    `);
    return rows.length > 0;
  }

  const ok2022 = await tabelaExiste("taxi_2022");
  const ok2023 = await tabelaExiste("taxi_2023");
  if (!ok2022 && !ok2023) throw new Error("Nenhuma tabela (taxi_2022/taxi_2023) encontrada.");

  
  const fatias = [];
  if (ok2022) {
    fatias.push(`
      SELECT 2022 AS y,
             DATE_TRUNC('month', lpep_pickup_datetime) AS ym
      FROM taxi_2022
    `);
  }
  if (ok2023) {
    fatias.push(`
      SELECT 2023 AS y,
             DATE_TRUNC('month', lpep_pickup_datetime) AS ym
      FROM taxi_2023
    `);
  }

  const sql = `
    WITH base AS (
      ${fatias.join(" UNION ALL ")}
    ),
    agg AS (
      SELECT y, EXTRACT(MONTH FROM ym) AS m, COUNT(*) AS trips
      FROM base
      WHERE ym IS NOT NULL
      GROUP BY y, m
    )
    SELECT y, m, trips FROM agg ORDER BY y, m;
  `;
  const rows = await taxi.query(sql);

  // Normaliza BigInt -> Number
  const normRows = rows.map(r => ({
    y: Number(r.y),
    m: Number(r.m),
    trips: Number(r.trips),
  }));

  const months = d3.range(1, 13);

  const padMonths = (yr) => {
    const mp = new Map(normRows.filter(r => r.y === yr).map(r => [r.m, r.trips]));
    return months.map(m => ({ m, trips: mp.get(m) ?? 0 }));
  };

  const series = [];
  if (ok2022) series.push({ year: 2022, data: padMonths(2022), color: "#1f77b4" });
  if (ok2023) series.push({ year: 2023, data: padMonths(2023), color: "#ff7f0e" });

  // === desenho ===
  const svg = d3.select("svg");
  svg.selectAll("*").remove();

  const { width, height } = getSvgSize(svg);
  const margin = { top: 48, right: 110, bottom: 40, left: 72 };
  const innerWidth  = width  - margin.left - margin.right;
  const innerHeight = height - margin.top  - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // IMPORTANTE: domínio [0.5, 12.5] para alinhar faixas + ticks
  const x = d3.scaleLinear().domain([0.5, 12.5]).range([0, innerWidth]);
  const yMax = d3.max(series.flatMap(s => s.data.map(d => d.trips))) || 0;
  const y = d3.scaleLinear().domain([0, yMax]).nice().range([innerHeight, 0]);

  faixaDasEstacoes(g, x, innerHeight);

  const monthsLabels = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(
      d3.axisBottom(x)
        .tickValues(months)              // ticks em 1..12
        .tickFormat(m => monthsLabels[m - 1])
    );

  g.append("g")
    .call(d3.axisLeft(y).ticks(6))
    .append("text")
    .attr("x", -margin.left + 8)
    .attr("y", -10)
    .attr("fill", "currentColor")
    .attr("text-anchor", "start")
    .style("font-weight", 600)
    .text("Corridas (mês)");

  const line = d3.line()
    .x(d => x(d.m))
    .y(d => y(d.trips))
    .curve(d3.curveMonotoneX);

  for (const s of series) {
    g.append("path")
      .datum(s.data)
      .attr("fill", "none")
      .attr("stroke", s.color)
      .attr("stroke-width", 2.2)
      .attr("d", line);

    g.selectAll(`circle.dot-${s.year}`)
      .data(s.data)
      .enter()
      .append("circle")
      .attr("class", `dot-${s.year}`)
      .attr("cx", d => x(d.m))
      .attr("cy", d => y(d.trips))
      .attr("r", 3.5)
      .attr("fill", s.color);
  }

  // título
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top * 0.6)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", 700)
    .text("Corridas por Mês e Estações (2022 vs 2023)");

  // legenda dos anos
  const legendaAno = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 20}, ${margin.top - 20})`);

  series.forEach((s, i) => {
    const row = legendaAno.append("g").attr("transform", `translate(0, ${i * 18})`);
    row.append("line")
      .attr("x1", 0).attr("x2", 22).attr("y1", 6).attr("y2", 6)
      .attr("stroke", s.color).attr("stroke-width", 2.2);
    row.append("circle")
      .attr("cx", 11).attr("cy", 6).attr("r", 3.5).attr("fill", s.color);
    row.append("text")
      .attr("x", 30).attr("y", 10)
      .text(String(s.year))
      .style("font-size", "12px");
  });

  // legenda das estações (embaixo, alinhada à esquerda)
  const legendaEstacoes = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${height - 10})`);

  const seasons = [
    { name: "Inverno",  color: "rgba(0, 90, 200, 0.8)" },
    { name: "Primavera",color: "rgba(0, 150, 50, 0.8)" },
    { name: "Verão",    color: "rgba(220, 50, 0, 0.8)" },
    { name: "Outono",   color: "rgba(255, 190, 0, 0.9)" },
  ];

  seasons.forEach((s, i) => {
    const row = legendaEstacoes.append("g").attr("transform", `translate(${i * 110}, 0)`);
    row.append("rect")
      .attr("x", 0).attr("y", -10).attr("width", 20).attr("height", 10)
      .attr("fill", s.color);
    row.append("text")
      .attr("x", 26).attr("y", 0)
      .text(s.name)
      .style("font-size", "12px");
  });
}