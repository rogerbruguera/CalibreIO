const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();
const host = '37.27.93.106';
const username = 'root';
const password = 'GironaFruits2026!';

async function checkDb() {
    try {
        console.log('Connecting to VPS...');
        await ssh.connect({ host, username, password });

        console.log('\n--- Checking Tables ---');
        const tablesRes = await ssh.execCommand('docker exec -i calibre_prod_db psql -U admin -d calibredb -c "\\dt"');
        console.log(tablesRes.stdout);
        if (tablesRes.stderr) console.error(tablesRes.stderr);

        console.log('\n--- Checking Users ---');
        const usersRes = await ssh.execCommand('docker exec -i calibre_prod_db psql -U admin -d calibredb -c "SELECT email, role, created_at FROM users;"');
        console.log(usersRes.stdout);
        if (usersRes.stderr) console.error(usersRes.stderr);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkDb();
