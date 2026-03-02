const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();
const host = '37.27.93.106';
const username = 'root';
const password = 'GironaFruits2026!';

async function ensureCatalogSchema() {
    try {
        console.log('Connecting to VPS...');
        await ssh.connect({ host, username, password });

        console.log('--- Creating catalog schema directly in production DB ---');

        const sqlCommand = `
        CREATE TABLE IF NOT EXISTS apple_varieties (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) UNIQUE NOT NULL,
            reference_fields UUID[] DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS apple_subvarieties (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            variety_id UUID REFERENCES apple_varieties(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(variety_id, name)
        );
        `;

        const res = await ssh.execCommand(`docker exec -i calibre_prod_db psql -U admin -d calibredb -c "${sqlCommand}"`);

        console.log(res.stdout);
        if (res.stderr) console.error(res.stderr);

        console.log('\n✅ Catalog schema ensured in DB!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
ensureCatalogSchema();
