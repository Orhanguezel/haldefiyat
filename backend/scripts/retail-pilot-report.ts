import { writeRetailPilotReport } from "../src/modules/etl/retail-pilot-report";
import { pool } from "../src/db/client";
try { console.log(JSON.stringify(await writeRetailPilotReport(), null, 2)); }
finally { await pool.end(); }
