const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();
const host = '37.27.93.106';
const username = 'root';
const password = 'GironaFruits2026!';

async function checkLogs() {
    try {
        await ssh.connect({ host, username, password });
        const res = await ssh.execCommand('docker logs calibre_prod_backend', { cwd: '/opt/calibreio' });
        console.log(res.stdout);
        if (res.stderr) console.error(res.stderr);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkLogs();
