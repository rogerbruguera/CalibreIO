const { NodeSSH } = require('node-ssh');
const path = require('path');

const ssh = new NodeSSH();
const host = '37.27.93.106';
const username = 'root';
const password = 'ibnUN9imEETcT4f7uL4J';

async function deploy() {
    try {
        console.log('1. Connecting to VPS (37.27.93.106)...');
        await ssh.connect({ host, username, password });
        console.log('Connected successfully!');

        console.log('2. Installing Docker and Docker Compose...');
        const aptRes = await ssh.execCommand('apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io docker-compose', { cwd: '/root' });

        console.log('3. Preparing environment...');
        await ssh.execCommand('mkdir -p /opt/calibreio', { cwd: '/root' });

        console.log('4. Uploading CalibreIO Platform Archive via chunked Base64 stream (bypass SFTP)...');
        const fs = require('fs');
        const fileStr = fs.readFileSync(path.join(__dirname, 'CalibreIO_deploy.tar.gz')).toString('base64');
        const chunkSize = 10000;

        await ssh.execCommand('rm -f /opt/calibreio/archive.b64', { cwd: '/opt/calibreio' });

        for (let i = 0; i < fileStr.length; i += chunkSize) {
            const chunk = fileStr.slice(i, i + chunkSize);
            await ssh.execCommand(`echo -n "${chunk}" >> /opt/calibreio/archive.b64`, { cwd: '/opt/calibreio' });
        }

        await ssh.execCommand('base64 -d /opt/calibreio/archive.b64 > /opt/calibreio/archive.tar.gz', { cwd: '/opt/calibreio' });
        await ssh.execCommand('rm /opt/calibreio/archive.b64', { cwd: '/opt/calibreio' });

        console.log('5. Extracting Platform...');
        await ssh.execCommand('tar -xzf archive.tar.gz', { cwd: '/opt/calibreio' });
        await ssh.execCommand('rm archive.tar.gz', { cwd: '/opt/calibreio' });

        console.log('6. Building and starting Docker containers in production mode...');
        const dockerRes = await ssh.execCommand('docker-compose -f docker-compose.prod.yml up -d --build', { cwd: '/opt/calibreio' });
        console.log(dockerRes.stdout);
        if (dockerRes.stderr) console.log('Docker logs:', dockerRes.stderr);

        console.log('✅ Deployment to VPS completed successfully! Application is live.');
        process.exit(0);

    } catch (err) {
        console.error('❌ Deployment Failed:', err);
        process.exit(1);
    }
}

deploy();
