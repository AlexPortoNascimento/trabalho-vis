import * as d3 from 'd3';

export async function tipsByTripAmountByHour(data, margens = { left: 60, right: 50, top: 25, bottom: 50 }) {
    const svg = d3.select('svg');

    if (!svg) {
        return;
    }

    const width = parseFloat(svg.attr('width'));
    const height = parseFloat(svg.attr('height'));

    const innerWidth = width - margens.left - margens.right;
    const innerHeight = height - margens.top - margens.bottom;

    // Conversão: transforma BigInt em Number logo no começo
    data = data.map(obj =>
        Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])
        )
    );

    // ---- Escalas
    const mapX = d3.scaleBand()
        .domain(data.map(d => d.hora.toString()))
        .range([0, innerWidth])
        .padding(0.1);

    const mapYEsquerda = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.total_corridas)])
        .range([innerHeight, 0]);
    
    const mapYDireita = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.media_gorjeta + 1)])
        .range([innerHeight, 0]);
    

    // ---- Eixos
    const g = svg.append('g')
        .attr('transform', `translate(${margens.left}, ${margens.top})`);

    const eixoX = d3.axisBottom(mapX);

    g.append('g')
        .attr('transform', `translate(0, ${innerHeight})`)
        .call(eixoX)
        .attr('class', 'eixo-x')
    
    const eixoYEsquerdo = d3.axisLeft(mapYEsquerda);
    
    g.append('g') 
        .call(eixoYEsquerdo)
        .attr('class', 'eixo-y');
    
    const eixoYDireito = d3.axisRight(mapYDireita)
        .ticks(5);
    
    g.append('g')
        .attr('transform', `translate(${innerWidth}, 0)`)
        .call(eixoYDireito)
        .attr('class', 'eixo-y-direito')

    // ---- Estilização dos Eixos
    g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 40)
        .attr('text-anchor', 'middle')
        .attr('class', 'rotulo-eixo')
        .style('font-size', '14px')
        .text('Hora do Dia');

    g.append('text')
        .attr('transform', 'rotate(-90)') 
        .attr('x', -innerHeight / 2)
        .attr('y', -50)
        .attr('text-anchor', 'middle')
        .attr('class', 'rotulo-eixo')
        .style('font-size', '14px')
        .text('Total de Corridas');
    
    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', innerWidth + 45)
        .attr('text-anchor', 'middle')
        .attr('class', 'rotulo-eixo')
        .style('font-size', '14px')
        .text('Média de Gorjetas ($)');

    // ---- Barras - total de corridas
    g.selectAll('.barra') // CORREÇÃO: adicionei o ponto aqui
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'barra')
        .attr('x', d => mapX(d.hora.toString()))
        .attr('y', d => mapYEsquerda(d.total_corridas))
        .attr('width', mapX.bandwidth())
        .attr('height', d => innerHeight - mapYEsquerda(d.total_corridas))
        .attr('fill', '#006A71')
        .attr('opacity', 0.8);
    
    // ---- Linhas - média de gorjeta
    const geradorLinha = d3.line()
        .x(d => mapX(d.hora.toString()) + mapX.bandwidth() / 2)
        .y(d => mapYDireita(d.media_gorjeta));
    
    g.append('path')
        .datum(data)
        .attr('class', 'linha-gorjetas')
        .attr('d', geradorLinha)
        .attr('fill', 'none')
        .attr('stroke', '#E74C3C')
        .attr('stroke-width', 3)
        .attr('stroke-linecap', 'round');

    // ---- Legenda 
    
    const legenda = g.append('g')
        .attr('transform', `translate(${innerWidth - 675}, 5)`);


    legenda.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', '#006A71')
        .attr('opacity', 0.8);

    legenda.append('text')
        .attr('x', 25)
        .attr('y', 12)
        .attr('text-anchor', 'start')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text('Total de Corridas');

    legenda.append('line')
        .attr('x1', 0)
        .attr('y1', 25)
        .attr('x2', 15)
        .attr('y2', 25)
        .attr('stroke', '#E74C3C')
        .attr('stroke-width', 3)
        .attr('stroke-linecap', 'round');

    legenda.append('text')
        .attr('x', 25)
        .attr('y', 27)
        .attr('text-anchor', 'start')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text('Média de Gorjetas');

    legenda.insert('rect', ':first-child')
        .attr('x', -5)
        .attr('y', -5)
        .attr('width', 160)
        .attr('height', 40)
        .attr('fill', 'white')
        .attr('opacity', 0.9)
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('stroke', '#ccc')
        .attr('stroke-width', 1);

}

export function clearChart() {
    const svg = d3.select('svg');
    svg.selectAll('*').remove();
}