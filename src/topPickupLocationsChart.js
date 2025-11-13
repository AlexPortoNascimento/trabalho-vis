import * as d3 from 'd3';

export async function topPickupLocationsChart(data, zonesData, margens = { left: 80, right: 30, top: 25, bottom: 100 }) {
    const svg = d3.select('svg');

    if (!svg) return;

    const width = parseFloat(svg.attr('width'));
    const height = parseFloat(svg.attr('height'));

    const innerWidth = width - margens.left - margens.right;
    const innerHeight = height - margens.top - margens.bottom;

    // Extrai corretamente o formato GeoJSON (usando chaves minúsculas)
    const zonesArray = Array.isArray(zonesData)
        ? zonesData
        : zonesData.features.map(f => f.properties);

    //Cria o mapa de location_id → zone (minúsculas)
    const zoneMap = new Map(
        zonesArray.map(z => [Number(z.location_id), z.zone])
    );

    // Conversão: transforma BigInt em Number
    data = data.map(obj =>
        Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])
        )
    );

    // Ordenar dados por total de embarques (decrescente)
    data.sort((a, b) => d3.descending(a.total_embarques, b.total_embarques));

    // Escalas
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.total_embarques)])
        .range([0, innerWidth])
        .nice();

    const yScale = d3.scaleBand()
        .domain(data.map(d => zoneMap.get(Number(d.location_id)) || `Zona ${d.location_id}`))
        .range([0, innerHeight])
        .padding(0.2);

    // Grupo principal
    const g = svg.append('g')
        .attr('transform', `translate(${margens.left}, ${margens.top})`);

    // Eixos
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
        .style('font-size', '5px')   // 🔹 tamanho da fonte das zonas
        .style('font-family', 'sans-serif')
        .style('fill', '#2C3E50');

    // Rótulos dos eixos
    g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 50)
        .attr('text-anchor', 'middle')
        .attr('class', 'rotulo-eixo')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Total de Embarques');

    g.append('text')
        .attr('x', -40)         // canto esquerdo
        .attr('y', -10)       // ligeiramente acima do gráfico
        .attr('text-anchor', 'start') // alinhado à esquerda
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Zonas');

    // Barras horizontais
    const bars = g.selectAll('.barra-regiao')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'barra-regiao')
        .attr('x', 0)
        .attr('y', d => yScale(zoneMap.get(Number(d.location_id)) || `Zona ${d.location_id}`))
        .attr('width', d => xScale(d.total_embarques))
        .attr('height', yScale.bandwidth())
        .attr('fill', '#27AE60')
        .attr('opacity', 0.8)
        .attr('rx', 3)
        .attr('ry', 3);

    // Valores nas barras
    g.selectAll('.rotulo-valor')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'rotulo-valor')
        .attr('x', d => xScale(d.total_embarques) + 5)
        .attr('y', d => yScale(zoneMap.get(Number(d.location_id)) || `Zona ${d.location_id}`) + yScale.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'start')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .style('fill', '#2C3E50')
        .text(d => d3.format(",")(d.total_embarques));

    // Título do gráfico
    g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .style('fill', '#2C3E50')
        .text('Top 15 Regiões de NYC com Maior Número de Embarques - Táxis Verdes 2023');

    // Caixa de informações (infoBox)
    const infoBoxY = innerHeight + 80;
    const infoBox = svg.append('g')
        .attr('transform', `translate(${margens.left + innerWidth / 2 - 95}, ${margens.top + infoBoxY})`);

    /*infoBox.append('rect')
        .attr('width', 190)
        .attr('height', 40)
        .attr('fill', '#F8F9FA')
        .attr('stroke', '#BDC3C7')
        .attr('stroke-width', 1)
        .attr('rx', 5)
        .attr('ry', 5);*/

    infoBox.append('text')
        .attr('x', 335)
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .text('Total de Registros:');

    infoBox.append('text')
        .attr('x', 400)
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#27AE60')
        .text(d3.format(",")(d3.sum(data, d => d.total_embarques)));

    // Efeito de hover nas barras
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
