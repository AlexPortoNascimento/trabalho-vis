import * as d3 from 'd3';

// ATENÇÃO: A assinatura da função agora inclui 'zonesData' como segundo argumento
export async function topPickupLocationsChart(data, zonesData, margens = { left: 80, right: 30, top: 40, bottom: 60 }) {
    const svg = d3.select('svg');

    if (!svg) return;

    const width = parseFloat(svg.attr('width'));
    const height = parseFloat(svg.attr('height'));

    const innerWidth = width - margens.left - margens.right;
    const innerHeight = height - margens.top - margens.bottom;

    // --- Mapeamento de Zonas (Lógica da branch f97d) ---
    // Extrai corretamente os dados das zonas, independente se é GeoJSON ou Array
    const zonesArray = Array.isArray(zonesData)
        ? zonesData
        : zonesData.features.map(f => f.properties);

    // Cria o mapa de location_id -> zone
    const zoneMap = new Map(
        zonesArray.map(z => [Number(z.location_id || z.LocationID), z.zone || z.Zone])
    );

    // Conversão: transforma BigInt em Number
    data = data.map(obj =>
        Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])
        )
    );

    // Ordenar dados por total de embarques (decrescente)
    data.sort((a, b) => d3.descending(a.total_embarques, b.total_embarques));

    // --- Escalas (Corrigidas) ---
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.total_embarques)])
        .range([0, innerWidth])
        .nice();

    const yScale = d3.scaleBand()
        // Agora usa o zoneMap para obter os nomes
        .domain(data.map(d => zoneMap.get(Number(d.location_id)) || `Zona ${d.location_id}`))
        .range([0, innerHeight])
        .padding(0.2);

    // Grupo principal
    const g = svg.append('g')
        .attr('transform', `translate(${margens.left}, ${margens.top})`);

    // --- Eixos (Corrigidos) ---
    const xAxis = d3.axisBottom(xScale)
        .ticks(8)
        .tickFormat(d3.format("~s"));

    g.append('g')
        .attr('transform', `translate(0, ${innerHeight})`)
        .call(xAxis)
        .attr('class', 'eixo-x');

    const yAxis = d3.axisLeft(yScale);
    g.append('g')
        .call(yAxis)
        .attr('class', 'eixo-y')
        .selectAll('text')
        .style('font-size', '8px') // Ajuste o tamanho da fonte se necessário
        .style('fill', '#2C3E50');

    // --- Rótulos dos eixos ---
    g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 40) // Posição abaixo do eixo X
        .attr('text-anchor', 'middle')
        .attr('class', 'rotulo-eixo')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Total de Embarques');

    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -margens.left + 15) // Posição à esquerda do eixo Y
        .attr('text-anchor', 'middle')
        .attr('class', 'rotulo-eixo')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Zonas de Embarque');

    // --- Barras horizontais (Corrigidas) ---
    const bars = g.selectAll('.barra-regiao')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'barra-regiao')
        .attr('x', 0)
        // Usa o zoneMap para o posicionamento Y
        .attr('y', d => yScale(zoneMap.get(Number(d.location_id)) || `Zona ${d.location_id}`))
        .attr('width', d => xScale(d.total_embarques))
        .attr('height', yScale.bandwidth())
        .attr('fill', '#27AE60')
        .attr('opacity', 0.8)
        .attr('rx', 3)
        .attr('ry', 3);

    // --- Título do gráfico ---
    g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', -15) // Posição acima do gráfico
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .style('fill', '#2C3E50')
        .text('Top 15 Regiões de Embarque (Táxis Verdes 2023)');

    // --- Caixa de informações (Corrigida) ---
    // Posicionada de forma dinâmica
    const infoBox = g.append('g')
        .attr('transform', `translate(${innerWidth - 200}, ${innerHeight - 50})`);

    infoBox.append('rect')
        .attr('width', 190)
        .attr('height', 40)
        .attr('fill', '#F8F9FA')
        .attr('stroke', '#BDC3C7')
        .attr('stroke-width', 1)
        .attr('rx', 5)
        .attr('ry', 5);

    infoBox.append('text')
        .attr('x', 95)
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .text('Total de Registros (Top 15):');

    infoBox.append('text')
        .attr('x', 95)
        .attr('y', 28)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#27AE60')
        .text(d3.format(",")(d3.sum(data, d => d.total_embarques)));

    // --- Efeito de hover nas barras (Corrigido) ---
    bars.on('mouseover', function(event, d) {
        d3.select(this)
            .transition()
            .duration(200)
            .attr('opacity', 1)
            .attr('fill', '#229954');

        const tooltip = g.append('g')
            .attr('class', 'tooltip')
            .attr('transform', `translate(${xScale(d.total_embarques) / 2}, ${yScale(zoneMap.get(Number(d.location_id)) || `Zona ${d.location_id}`) + yScale.bandwidth() / 2})`);

        tooltip.append('rect')
            .attr('width', 150)
            .attr('height', 40)
            .attr('x', -75)
            .attr('y', -20)
            .attr('fill', '#2C3E50')
            .attr('opacity', 0.9)
            .attr('rx', 5)
            .attr('ry', 5);

        tooltip.append('text')
            .attr('text-anchor', 'middle')
            .attr('y', -8)
            .style('font-size', '10px')
            .style('fill', 'white')
            .text(zoneMap.get(Number(d.location_id)) || `Zona ${d.location_id}`);

        tooltip.append('text')
            .attr('text-anchor', 'middle')
            .attr('y', 8)
            .style('font-size', '11px')
            .style('fill', 'white')
            .style('font-weight', 'bold')
            .text(`Embarques: ${d3.format(",")(d.total_embarques)}`);
    })
    .on('mouseout', function() {
        d3.select(this)
            .transition()
            .duration(200)
            .attr('opacity', 0.8)
            .attr('fill', '#27AE60');

        g.selectAll('.tooltip').remove();
    });
}