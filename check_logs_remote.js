const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({
        host: '37.27.93.106',
        username: 'root',
        password: 'GironaFruits2026!'
    });

    console.log("=== NGINX PROXY LOGS ===");
    const proxy = await ssh.execCommand('docker logs nginx-proxy --tail 50');
    console.log(proxy.stdout);
    console.log(proxy.stderr);

    console.log("\n=== BACKEND LOGS ===");
    const backend = await ssh.execCommand('docker logs calibre_prod_backend --tail 50');
    console.log(backend.stdout);
    console.log(backend.stderr);

    process.exit(0);
}

check().catch(console.error);
