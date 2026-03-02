const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();
const host = '37.27.93.106';
const username = 'root';
const password = 'GironaFruits2026!';

async function checkDb() {
    try {
        console.log('Connecting to VPS...');
        await ssh.connect({ host, username, password });

        console.log('\n--- Checking Fields Count ---');
        const c1 = await ssh.execCommand('docker exec -i calibre_prod_db psql -U admin -d calibredb -c "SELECT count(*) FROM fields;"');
        console.log(c1.stdout);

        console.log('\n--- Checking Controls Count ---');
        const c2 = await ssh.execCommand('docker exec -i calibre_prod_db psql -U admin -d calibredb -c "SELECT count(*) FROM size_controls;"');
        console.log(c2.stdout);

        console.log('\n--- Checking Varieties ---');
        const c3 = await ssh.execCommand('docker exec -i calibre_prod_db psql -U admin -d calibredb -c "SELECT * FROM apple_varieties;"');
        console.log(c3.stdout);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkDb();
