
import { loadDb } from './config';

export class Taxi {
    constructor(year, color) {
        this.color = color;
        this.year = year
        this.table = `taxi_${year}`;
    }
    
    async init() {
        this.db = await loadDb();
        this.conn = await this.db.connect();
    }

    async loadTaxi(months = 12) {
        if (!this.db || !this.conn)
            throw new Error('Database not initialized. Please call init() first.');

        const files = [];

        for (let id = 1; id <= months; id++) {
            const sId = String(id).padStart(2, '0')
            files.push({
                key: `Y${this.year}M${sId}`,
                url: `data/${this.color}/${this.color}_tripdata_${this.year}-${sId}.parquet`
            });


            const res = await fetch(files[files.length - 1].url);
            await this.db.registerFileBuffer(files[files.length - 1].key, new Uint8Array(await res.arrayBuffer()));
        }

        await this.conn.query(`
            CREATE TABLE ${this.table} AS
                SELECT * 
                FROM read_parquet([${files.map(d => d.key).join(",")}], union_by_name=true);
        `);
    }

    async query(sql) {
        if (!this.db || !this.conn)
            throw new Error('Database not initialized. Please call init() first.');

        let result = await this.conn.query(sql);
        return result.toArray().map(row => row.toJSON());
    }
}