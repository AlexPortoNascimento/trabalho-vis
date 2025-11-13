import { Taxi } from "./taxi";
import { tipsByTripAmountByHour, clearChart } from './plot';
import { tipsByTripAmountByScatterPlot } from "./tipsByTripAmountScatterPlot";
// Mainoth
import { plotGraficoEstacoes } from "./estacoes";
// Mainoth
// Mainoth
function callbacks(data, taxi) {
// Mainoth    
    const loadBtn = document.querySelector('#loadBtn');
    const loadScatterPlot = document.querySelector("#tipsByTripAmountScatterPlot");
    const clearBtn = document.querySelector('#clearBtn');

    // Mainoth
    const botaoEstacoes = document.querySelector('#estacoesAnos');
    // Mainoth
    if (!loadBtn || !clearBtn) {
        return;
    }

    loadBtn.addEventListener('click', async () => {
        clearChart();
        await tipsByTripAmountByHour(data);
    });

    loadScatterPlot.addEventListener('click', async () => {
        clearChart();
        await tipsByTripAmountByScatterPlot(data);
    });

    clearBtn.addEventListener('click', async () => {
        clearChart();
    });

    // Mainoth

    botaoEstacoes?.addEventListener('click', async () => {
    try {
      clearChart();
      await plotGraficoEstacoes(taxi);
    } catch (e) {
      console.error(e);
    }
    });
    //Mainoth
}

window.onload = async () => {
    const taxi = new Taxi('2023', 'green');

    await taxi.init();
    await taxi.loadTaxi();

    //Mainoth
    await taxi.loadExtraYear('2022', 'green');
    window.taxi = taxi;
    window.q = (sql) => taxi.query(sql);   // atalho útil p/ consultas rápidas
    //Mainoth

    const sql = `
        SELECT
            EXTRACT(HOUR FROM lpep_pickup_datetime) AS hora,
            ROUND(AVG(tip_amount), 2) AS media_gorjeta,
            COUNT(*) AS total_corridas
        FROM ${taxi.table}
        WHERE tip_amount > 0
        GROUP BY hora
        ORDER BY hora;
    `;


    const data = await taxi.query(sql);
    console.log(data);
    //Mainoth
    callbacks(data,taxi);
    //Mainoth
};

