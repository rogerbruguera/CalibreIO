const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({
        host: '37.27.93.106',
        username: 'root',
        password: 'GironaFruits2026!'
    });

    console.log("=== ACME COMPANION ===");
    const proxy = await ssh.execCommand('docker logs nginx-proxy-acme --tail 50');
    console.log(proxy.stdout);
    console.log(proxy.stderr);

    process.exit(0);
}

check().catch(console.error);
