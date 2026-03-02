const { NodeSSH } = require('node-ssh');
const path = require('path');
const { execSync } = require('child_process');

const ssh = new NodeSSH();
const host = '37.27.93.106';
const username = 'root';
const password = 'GironaFruits2026!';

async function deploy() {
    try {
        console.log('0. Packing application files (excluding node_modules)...');
        execSync('tar.exe --exclude=backend/node_modules --exclude=frontend/node_modules --exclude=frontend/dist -czf CalibreIO_deploy.tar.gz backend frontend docker-compose.prod.yml package.json');
        console.log('Packaging successful!');

        console.log('1. Connecting to VPS (37.27.93.106)...');
        await ssh.connect({ host, username, password });
        console.log('Connected successfully!');

        console.log('2. Installing Docker and Docker Compose v2...');
        await ssh.execCommand('apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io curl wget', { cwd: '/root' });
        await ssh.execCommand('curl -SL https://github.com/docker/compose/releases/download/v2.32.4/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose', { cwd: '/root' });

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
        await ssh.execCommand('rm -rf frontend backend docker* package*', { cwd: '/opt/calibreio' });
        await ssh.execCommand('tar -xzf archive.tar.gz', { cwd: '/opt/calibreio' });
        await ssh.execCommand('rm archive.tar.gz', { cwd: '/opt/calibreio' });

        console.log('6. Building and starting Docker containers in production mode...');
        await ssh.execCommand('docker-compose -f docker-compose.prod.yml down --remove-orphans', { cwd: '/opt/calibreio' });
        const dockerRes = await ssh.execCommand('docker-compose -f docker-compose.prod.yml up -d --build', { cwd: '/opt/calibreio' });
        console.log(dockerRes.stdout);
        if (dockerRes.stderr) console.log('Docker logs:', dockerRes.stderr);

        console.log('7. Initializing database schema (waiting 5s for DB to be ready)...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        const s1 = await ssh.execCommand('docker exec -i -e PGPASSWORD=mysecretpassword calibre_prod_db psql -U admin -d calibredb < backend/database/schema.sql', { cwd: '/opt/calibreio' });
        if (s1.stderr) console.error('Schema Error:', s1.stderr);

        // Include catalog creation
        const catalogSql = `
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
        );`;
        const s_cat = await ssh.execCommand(`docker exec -i -e PGPASSWORD=mysecretpassword calibre_prod_db psql -U admin -d calibredb -c "${catalogSql}"`, { cwd: '/opt/calibreio' });
        if (s_cat.stderr) console.error('Catalog Error:', s_cat.stderr);

        const s2 = await ssh.execCommand('docker exec -i -e PGPASSWORD=mysecretpassword calibre_prod_db psql -U admin -d calibredb < backend/database/add_field_props.sql', { cwd: '/opt/calibreio' });
        if (s2.stderr) console.error('Add field props Error:', s2.stderr);

        const s3 = await ssh.execCommand('docker exec -i -e PGPASSWORD=mysecretpassword calibre_prod_db psql -U admin -d calibredb < backend/database/add_measurements.sql', { cwd: '/opt/calibreio' });
        if (s3.stderr) console.error('Add measurements Error:', s3.stderr);

        const s4 = await ssh.execCommand('docker exec -i -e PGPASSWORD=mysecretpassword calibre_prod_db psql -U admin -d calibredb < backend/database/add_performance_indexes.sql', { cwd: '/opt/calibreio' });
        if (s4.stderr) console.error('Add indexes Error:', s4.stderr);

        console.log('8. Seeding initial admin user...');
        const seedRes = await ssh.execCommand('docker exec -i calibre_prod_backend node seed_admin.js', { cwd: '/opt/calibreio' });
        console.log(seedRes.stdout);
        if (seedRes.stderr) console.error('Seed Error:', seedRes.stderr);

        console.log('✅ Deployment to VPS completed successfully! Application is live.');
        process.exit(0);

    } catch (err) {
        console.error('❌ Deployment Failed:', err);
        process.exit(1);
    }
}

deploy();
