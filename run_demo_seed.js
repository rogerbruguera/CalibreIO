const { NodeSSH } = require('node-ssh');
const path = require('path');

const ssh = new NodeSSH();
const host = '37.27.93.106';
const username = 'root';
const password = 'GironaFruits2026!';

async function runDemoSeed() {
    try {
        console.log('Connecting to VPS...');
        await ssh.connect({ host, username, password });

        console.log('1. Uploading the demo script to the VPS...');
        await ssh.putFile(path.join(__dirname, 'backend', 'seed_demo_data.js'), '/opt/calibreio/backend/seed_demo_data.js');

        console.log('2. Running the script inside the backend Docker container...');
        // Copy to container and execute
        await ssh.execCommand('docker cp backend/seed_demo_data.js calibre_prod_backend:/app/seed_demo_data.js', { cwd: '/opt/calibreio' });
        const execRes = await ssh.execCommand('docker exec -i calibre_prod_backend node seed_demo_data.js', { cwd: '/opt/calibreio' });

        console.log('\n--- Script Output ---');
        console.log(execRes.stdout);
        if (execRes.stderr) console.error('Errors:', execRes.stderr);

        console.log('\n✅ Demo data insertion completed!');

        process.exit(0);
    } catch (err) {
        console.error('Execution Failed:', err);
        process.exit(1);
    }
}

runDemoSeed();
