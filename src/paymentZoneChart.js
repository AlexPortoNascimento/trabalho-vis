// src/paymentZoneChart.js
import * as d3 from 'd3';

export async function paymentByZoneChart(data, margens = { left: 60, right: 50, top: 50, bottom: 90 }) {
    const svg = d3.select('svg');
    if (!svg) return;

    // Limpar gráfico anterior explicitamente ou assumir que clearChart já foi chamado
    svg.selectAll('*').remove();

    const width = parseFloat(svg.attr('width'));
    const height = parseFloat(svg.attr('height'));
    const innerWidth = width - margens.left - margens.right;
    const innerHeight = height - margens.top - margens.bottom;

    // --- Carregamento Opcional dos Nomes das Zonas ---
    // Tenta carregar o JSON de zonas para mostrar nomes em vez de IDs
    let zoneMap = {};
    try {
        // Ajuste o caminho conforme sua estrutura de pastas "public" ou "data"
        const response = await fetch('data/yellow/taxi_zones.json'); 
        const zones = await response.json();
        // Cria um mapa: ID -> "Borough - Zone"
        zones.forEach(z => {
            zoneMap[z.LocationID] = `${z.Borough} - ${z.Zone}`;
        });
    } catch (e) {
        console.warn("Não foi possível carregar os nomes das zonas. Usando IDs.", e);
    }

    // Conversão de BigInt para Number
    data = data.map(d => ({
        local: zoneMap[d.PULocationID] || `Zona ${d.PULocationID}`, // Usa o nome ou o ID
        credito: Number(d.qtd_credito),
        dinheiro: Number(d.qtd_dinheiro)
    }));

    // Preparar dados para o formato de barras agrupadas
    const grupos = ['credito', 'dinheiro'];
    const locais = data.map(d => d.local);

    // --- Escalas ---
    const x0 = d3.scaleBand()
        .domain(locais)
        .range([0, innerWidth])
        .padding(0.2);

    const x1 = d3.scaleBand()
        .domain(grupos)
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => Math.max(d.credito, d.dinheiro))])
        .nice()
        .range([innerHeight, 0]);

    const color = d3.scaleOrdinal()
        .domain(grupos)
        .range(['#2980b9', '#27ae60']); // Azul (Crédito) e Verde (Dinheiro)

    // --- Elemento G Principal ---
    const g = svg.append('g')
        .attr('transform', `translate(${margens.left}, ${margens.top})`);

    // --- Eixos ---
    const eixoX = d3.axisBottom(x0);
    const eixoY = d3.axisLeft(y);

    // Renderiza Eixo X
    g.append('g')
        .attr('transform', `translate(0, ${innerHeight})`)
        .call(eixoX)
        .selectAll('text') // Rotacionar texto para caber nomes longos
            .attr('transform', 'translate(-10,0)rotate(-45)')
            .style('text-anchor', 'end')
            .style('font-size', '10px');

    // Renderiza Eixo Y
    g.append('g')
        .call(eixoY)
        .append('text') // Label do eixo Y
            .attr('x', 10)
            .attr('y', -10)
            .attr('fill', 'black')
            .style('text-anchor', 'start')
            .text('Qtd. Viagens');

    // --- Barras ---
    g.append('g')
        .selectAll('g')
        .data(data)
        .join('g')
            .attr('transform', d => `translate(${x0(d.local)},0)`)
        .selectAll('rect')
        .data(d => grupos.map(key => ({key, value: d[key]})))
        .join('rect')
            .attr('x', d => x1(d.key))
            .attr('y', d => y(d.value))
            .attr('width', x1.bandwidth())
            .attr('height', d => innerHeight - y(d.value))
            .attr('fill', d => color(d.key));

    // --- Legenda ---
    const legend = g.append('g')
        .attr('font-family', 'sans-serif')
        .attr('font-size', 12)
        .attr('text-anchor', 'end')
        .selectAll('g')
        .data(grupos.slice().reverse())
        .join('g')
        .attr('transform', (d, i) => `translate(0,${i * 20})`);

    legend.append('rect')
        .attr('x', innerWidth - 19)
        .attr('width', 19)
        .attr('height', 19)
        .attr('fill', color);

    legend.append('text')
        .attr('x', innerWidth - 24)
        .attr('y', 9.5)
        .attr('dy', '0.32em')
        .text(d => d === 'credito' ? 'Cartão de Crédito' : 'Dinheiro');
        
    // Título
    g.append("text")
        .attr("x", (innerWidth / 2))             
        .attr("y", 0 - (margens.top / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .style("text-decoration", "underline")  
        .text("Pagamento por Zona (Top 15 Locais)");
}