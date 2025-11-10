import * as d3 from 'd3';


export async function loadChart(data, margens = { left: 60, right: 25, top: 25, bottom: 50 }) {
    const svg = d3.select('svg');

    if (!svg) {
        return;
    }

    const width = parseFloat(svg.attr('width'));
    const height = parseFloat(svg.attr('height'));

    const innerWidth = width - margens.left - margens.right;
    const innerHeight = height - margens.top - margens.bottom;

    console.log("Dimensões: ", { width, height, innerWidth, innerHeight });

    //Conversão: transforma BigInt em Number logo no começo
    data = data.map(obj =>
        Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])
        )
    );

    console.log("Dados processados: ", data);

    // ---- Escalas
    const mapX = d3.scaleBand()
        .domain(data.map(d => d.hora.toString()))
        .range([0, innerWidth])
        .padding(0.1);

    const mapY = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.total_corridas)])
        .range([innerHeight, 0]);
    

    // ---- Eixos
    const g = svg.append('g')
        .attr('transform', `translate(${margens.left}, ${margens.top})`);

    const eixoX = d3.axisBottom(mapX);

    g.append('g')
        .attr('transform', `translate(0, ${innerHeight})`)
        .call(eixoX)
        .attr('class', 'eixo-x')
    
    const eixoY = d3.axisLeft(mapY);
    
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
        .text('Hora do Dia');

    g.append('text')
        .attr('transform', 'rotate(-90)') 
        .attr('x', -innerHeight / 2)
        .attr('y', -50)
        .attr('text-anchor', 'middle')
        .attr('class', 'rotulo-eixo')
        .style('font-size', '14px')
        .text('Total de Corridas');

    // ---- Barras
    g.selectAll('barra')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'barra')
        .attr('x', d => mapX(d.hora.toString()))
        .attr('y', d => mapY(d.total_corridas))
        .attr('width', mapX.bandwidth())
        .attr('height', d => innerHeight - mapY(d.total_corridas))
        .attr('fill', '#006A71')
        .attr('opacity', 0.8)
 

}

export function clearChart() {
    const svg = d3.select('svg');
    svg.selectAll('*').remove();
}