import { Taxi } from "./taxi";
import { tipsByTripAmountByHour, clearChart } from './plot';
import { tipsByTripAmountByScatterPlot } from "./tipsByTripAmountScatterPlot";
import { topPickupLocationsChart } from "./topPickupLocationsChart";

function callbacks(data, pickupLocationsData) {
    const loadBtn = document.querySelector('#loadBtn');
    const loadScatterPlot = document.querySelector("#tipsByTripAmountScatterPlot");
    const loadPickupLocations = document.querySelector("#topPickupLocations");
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
        
        await tipsByTripAmountByScatterPlot(data);
    });

     // callback para a visualização de regiões
    loadPickupLocations.addEventListener('click', async () => {
        clearChart();
        await topPickupLocationsChart(pickupLocationsData);
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

    //Consulta para regiões de embarque
    const pickupLocationsSql = `
        SELECT
            PULocationID AS location_id,
            COUNT(*) AS total_embarques
        FROM ${taxi.table}
        WHERE PULocationID IS NOT NULL
        GROUP BY PULocationID
        ORDER BY total_embarques DESC
        LIMIT 15;  -- Top 15 regiões
    `;

    const data = await taxi.query(sql);
    const pickupLocationsData = await taxi.query(pickupLocationsSql); // Nova consulta

    console.log("Dados de gorjetas por hora:", data);
    console.log("Top regiões de embarque:", pickupLocationsData);

    callbacks(data, pickupLocationsData);
};

