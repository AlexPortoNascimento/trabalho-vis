import { Taxi } from "./taxi";
import { tipsByTripAmountByHour, clearChart } from './plot';
import { tipsByTripAmountByScatterPlot } from "./tipsByTripAmountScatterPlot";
//import { tipsByTripAmountScatterPlot } from './tipsByTripAmountScatterPlot.js';

function callbacks(data) {
    const loadBtn = document.querySelector('#loadBtn');
    const loadScatterPlot = document.querySelector("#tipsByTripAmountScatterPlot");
    const clearBtn = document.querySelector('#clearBtn');

    if (!loadBtn || !clearBtn) {
        return;
    }

    loadBtn.addEventListener('click', async () => {
        clearChart();
        await tipsByTripAmountByHour(data);
    });

    loadScatterPlot.addEventListener('click', async () => {
        clearChart();
        //o ano inteiro de 2023
        await tipsByTripAmountByScatterPlot(data);
    });

    clearBtn.addEventListener('click', async () => {
        clearChart();
    });
}

window.onload = async () => {
    const taxi = new Taxi('2023', 'green');

    await taxi.init();
    await taxi.loadTaxi();

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

    callbacks(data);
};

