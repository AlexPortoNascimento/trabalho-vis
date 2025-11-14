// import { Taxi } from "./taxi";
// import { tipsByTripAmountByHour, clearChart } from './plot';
// import { tipsByTripAmountByScatterPlot } from "./tipsByTripAmountScatterPlot";
// import { paymentByZoneChart } from "./paymentZoneChart";

// function callbacks(data, dataScatter, dataPayment) {
//     const loadBtn = document.querySelector('#loadBtn');
//     const loadScatterPlot = document.querySelector("#tipsByTripAmountScatterPlot");
//     const paymentBtn = document.querySelector('#paymentByZoneBtn');
//     const clearBtn = document.querySelector('#clearBtn');

//     if (!loadBtn || !clearBtn) return;

//     if (loadBtn){
//         loadBtn.addEventListener('click', async () => {
//             clearChart();
//             await tipsByTripAmountByHour(data);
//         });
//     }

//     if(loadScatterPlot){
//         loadScatterPlot.addEventListener('click', async () => {
//             clearChart();
//             await tipsByTripAmountByScatterPlot(dataScatter);
//         });
//     }

//     if (paymentBtn) {
//         paymentBtn.addEventListener('click', async () => {
//             clearChart();
//             await paymentByZoneChart(dataPayment);
//         });
//     }

//     clearBtn.addEventListener('click', async () => {
//         clearChart();
//     });
// }

// window.onload = async () => {
//     const taxi = new Taxi('2023', 'green');
//     await taxi.init();
//     await taxi.loadTaxi();

//     // Consulta tip por hora
//     const sqlHour = `
//         SELECT
//             EXTRACT(HOUR FROM lpep_pickup_datetime) AS hora,
//             ROUND(AVG(tip_amount), 2) AS media_gorjeta,
//             COUNT(*) AS total_corridas
//         FROM ${taxi.table}
//         WHERE tip_amount > 0
//         GROUP BY hora
//         ORDER BY hora;
//     `;
//     const data = await taxi.query(sqlHour);

//     // Consulta Scatter media de tip por distancia
//     const sqlScatter = `
//         SELECT 
//             total_amount as media_gorjeta, 
//             trip_distance as total_corridas 
//         FROM ${taxi.table} 
//         LIMIT 100
//     `; 

//     const dataScatter = await taxi.query(sqlScatter);


//     // Consultua Pagamento para Região por Payment_type: 1=Credit Card, 2=Cash
//     const sqlPayment = `
//         SELECT
//             PULocationID,
//             SUM(CASE WHEN payment_type = 1 THEN 1 ELSE 0 END) AS qtd_credito,
//             SUM(CASE WHEN payment_type = 2 THEN 1 ELSE 0 END) AS qtd_dinheiro,
//             COUNT(*) as total
//         FROM ${taxi.table}
//         WHERE payment_type IN (1, 2)
//         GROUP BY PULocationID
//         ORDER BY total DESC
//         LIMIT 15;
//     `;
//     const dataPayment = await taxi.query(sqlPayment);

//     console.log("Dados Pagamento:", dataPayment);

//     // Passa todos os dados para a função de callbacks
//     callbacks(data, dataScatter, dataPayment);
// };