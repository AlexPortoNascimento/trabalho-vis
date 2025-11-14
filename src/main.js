import { Taxi } from "./taxi";
import { tipsByTripAmountByHour, clearChart } from './plot';
import { tipsByTripAmountByScatterPlot } from "./tipsByTripAmountScatterPlot";
import { paymentByZoneChart } from "./paymentZoneChart"; // Vindo da branch 'davis'
import { topPickupLocationsChart } from "./topPickupLocationsChart"; // Vindo da branch 'MatheusSena'/'f97d'
import { plotGraficoEstacoes } from "./estacoes"; // Vindo da branch 'mainoth'
import { exportPNG } from "./export";

/**
 * Função responsável por gerenciar os eventos de clique (Control Flow)
 * Recebe todos os datasets pré-calculados ou o objeto taxi para consultas dinâmicas
 */
function callbacks(dataHour, dataScatter, dataPayment, dataPickup, zonesData, taxi) {
    
    // Seleção dos botões no DOM
    const loadBtn = document.querySelector('#loadBtn'); // Gráfico de Barras/Linhas (Hora)
    const loadScatterPlot = document.querySelector("#tipsByTripAmountScatterPlot"); // Dispersão
    const paymentBtn = document.querySelector('#paymentByZoneBtn'); // Pagamento por Zona (Davis)
    const loadPickupLocations = document.querySelector("#topPickupLocations"); // Top Regiões (MatheusSena)
    const botaoEstacoes = document.querySelector('#estacoesAnos'); // Estações do Ano (Mainoth)
    const exportPng = document.querySelector("#exportPNG");
    const clearBtn = document.querySelector('#clearBtn');

    // Verificação de segurança básica
    if (!clearBtn) return;

    // 1. Evento: Gorjeta por Hora (Padrão)
    if (loadBtn) {
        loadBtn.addEventListener('click', async () => {
            clearChart();
            await tipsByTripAmountByHour(dataHour);
        });
    }

    // 2. Evento: Scatter Plot (Dispersão)
    if (loadScatterPlot) {
        loadScatterPlot.addEventListener('click', async () => {
            clearChart();
            await tipsByTripAmountByScatterPlot(dataScatter);
        });
    }

    // 3. Evento: Pagamento por Zona (Branch Davis)
    if (paymentBtn) {
        paymentBtn.addEventListener('click', async () => {
            clearChart();
            // Nota: O paymentByZoneChart original do Davis faz o fetch do JSON internamente,
            // mas se você ajustou para receber zonesData, pode passar aqui. 
            // Por padrão, passamos apenas os dados SQL conforme a branch original.
            await paymentByZoneChart(dataPayment); 
        });
    }

    // 4. Evento: Top Regiões de Embarque (Branch MatheusSena/f97d)
    if (loadPickupLocations) {
        loadPickupLocations.addEventListener('click', async () => {
            clearChart();
            // Passamos zonesData pois o gráfico da branch f97d utiliza para mapear IDs para Nomes
            await topPickupLocationsChart(dataPickup, zonesData);
        });
    }

    // 5. Evento: Estações do Ano (Branch Mainoth)
    if (botaoEstacoes) {
        botaoEstacoes.addEventListener('click', async () => {
            try {
                clearChart();
                // Este gráfico faz suas próprias consultas internas, então passamos o objeto 'taxi'
                await plotGraficoEstacoes(taxi);
            } catch (e) {
                console.error("Erro ao plotar gráfico de estações:", e);
            }
        });
    }

    // 6. Funcionalidades Utilitárias
    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            clearChart();
        });
    }

    if (exportPng) {
        exportPng.addEventListener('click', exportPNG);
    }
}

window.onload = async () => {
    // --- 1. Inicialização do Banco de Dados ---
    const taxi = new Taxi('2023', 'green');
    
    // Carregamento do JSON de zonas (usado pelo gráfico de Top Locations)
    // Ajuste o caminho 'data/taxi-zones.json' conforme sua estrutura real se necessário
    let zonesData = [];
    try {
        const zonesResponse = await fetch('data/taxi_zones.json'); 
        zonesData = await zonesResponse.json();
    } catch (error) {
        console.warn("Não foi possível carregar o taxi_zones.json na main:", error);
    }

    await taxi.init();
    console.log("DuckDB Inicializado.");

    // Carrega dados principais (2023)
    await taxi.loadTaxi();
    
    // Carrega dados extras (2022) - Lógica da branch Mainoth para o gráfico de estações
    try {
        await taxi.loadExtraYear('2022', 'green');
    } catch (e) {
        console.warn("Aviso: Dados de 2022 não carregados (necessário para gráfico de estações).");
    }

    // Disponibiliza no console para debug
    window.taxi = taxi;
    window.q = (sql) => taxi.query(sql);

    // --- 2. Execução das Consultas SQL Unificadas ---

    console.log("Executando consultas SQL...");

    // A) Consulta: Gorjeta/Corrida por Hora (Padrão)
    const sqlHour = `
        SELECT
            EXTRACT(HOUR FROM lpep_pickup_datetime) AS hora,
            ROUND(AVG(tip_amount), 2) AS media_gorjeta,
            COUNT(*) AS total_corridas
        FROM ${taxi.table}
        WHERE tip_amount > 0
        GROUP BY hora
        ORDER BY hora;
    `;
    const dataHour = await taxi.query(sqlHour);

    // B) Consulta: Scatter Plot (Lógica da branch Davis - Distância vs Gorjeta)
    // A branch Davis usava uma consulta específica para o Scatter diferente da branch f97d
    const sqlScatter = `
        SELECT
            EXTRACT(HOUR FROM lpep_pickup_datetime) AS hora,
            ROUND(AVG(tip_amount), 2) AS media_gorjeta,
            COUNT(*) AS total_corridas
        FROM ${taxi.table}
        WHERE tip_amount > 0
        GROUP BY hora
        ORDER BY hora;
    `; 
    const dataScatter = await taxi.query(sqlScatter);

    // C) Consulta: Pagamento por Zona (Lógica da branch Davis)
    const sqlPayment = `
        SELECT
            PULocationID,
            SUM(CASE WHEN payment_type = 1 THEN 1 ELSE 0 END) AS qtd_credito,
            SUM(CASE WHEN payment_type = 2 THEN 1 ELSE 0 END) AS qtd_dinheiro,
            COUNT(*) as total
        FROM ${taxi.table}
        WHERE payment_type IN (1, 2)
        GROUP BY PULocationID
        ORDER BY total DESC
        LIMIT 15;
    `;
    const dataPayment = await taxi.query(sqlPayment);

    // D) Consulta: Top Regiões de Embarque (Lógica da branch MatheusSena/f97d)
    const sqlPickup = `
        SELECT
            PULocationID AS location_id,
            COUNT(*) AS total_embarques
        FROM ${taxi.table}
        WHERE PULocationID IS NOT NULL
        GROUP BY PULocationID
        ORDER BY total_embarques DESC
        LIMIT 15;
    `;
    const dataPickup = await taxi.query(sqlPickup);

    console.log("Consultas finalizadas. Configurando callbacks.");

    // --- 3. Chamada dos Callbacks ---
    callbacks(dataHour, dataScatter, dataPayment, dataPickup, zonesData, taxi);
};