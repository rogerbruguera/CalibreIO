# Documentació del Projecte CalibreIO

Aquest document detalla l'arquitectura, la configuració dels servidors i les funcions principals de l'aplicació CalibreIO en el seu entorn de desenvolupament i producció.

---

## 1. Arquitectura de l'Aplicació

L'aplicació CalibreIO està dividida en dues parts principals que es comuniquen mitjançant una API REST:

1.  **Frontend (L'aplicació web):** 
    - Creat amb **React** i empaquetat amb **Vite**.
    - La interfície d'usuari es basa en components reutilitzables i utilitza Tailwind CSS (o Vanilla CSS) per l'estil.
    - L'aplicació utilitza `axios` per fer les crides a l'API del backend de forma dinàmica: o bé a l'entorn de desenvolupament (`localhost:3000`) o bé cap a la IP del servidor de producció.

2.  **Backend (El servidor):**
    - Creat amb **Node.js** i el framework d'enrutament **Express.js**.
    - S'encarrega d'oferir els *endpoints* `/api/users`, `/api/fields`, i `/api/size-controls`.
    - Mitjançant `pg`, es connecta i interactua amb la Base de Dades.

3.  **Base de Dades:**
    - Motor de base de dades relacional: **PostgreSQL (versió 15)**.
    - S'utilitza l'extensió nativa per a generació d'identificadors únics `gen_random_uuid()`. 
    - L'esquema de dades inclou el registre d'usuaris (`users`), finques d'explotació agrària (`fields`) i les mesures del calibre (`size_controls`).

---

## 2. Configuració de Producció al VPS

A l'entorn de producció, tota l'aplicació està paquetitzada amb **Docker**. L'ús de Docker garanteix que l'aplicació funcioni exactament igual en el servidor que com funciona al teu ordinador, isolant-la del mateix sistema operatiu.

L'arxiu que gestiona l'orquestració és `docker-compose.prod.yml`. Aixeca 3 serveis en paral·lel interconnectats entre ells en una xarxa local tancada:

### Serveis Docker
*   **Contenidor `db` (Postgres):** 
    Executa la versió `postgres:15-alpine`. Fa servir variables d'entorn per auto-configurar l'usuari `admin` i la bdd `calibredb`. Persisteix totes les dades agràries al disc dur de la màquina gràcies als **volumes de Docker** (`pgdata`), així les dades mai s'esborren encara que es reinicii el contenidor. Aquest contenidor no exposa les seves dades a l'exterior del servidor.
*   **Contenidor `backend` (Node.js):** 
    Té un procés Node.js funcionant des d'una base `node:18-alpine` directament al servidor a través del port `3000`. Es comunica amb el contenidor `db` a través del seu nom intern "db" dins la pròpia xarxa.
*   **Contenidor `frontend` (Nginx):** 
    Usa el popular servidor web `nginx:alpine` per servir el codi React compilat ubicat a la carpeta interna `dist/`. Exposa el port `80` a l'exterior, per on entren totes les peticions dels correus i navegadors web dels usuaris (mòbils i ordinadors) al demanar l'adreça `www.calibreio.cat`.

---

## 3. Autenticació Inicial BBDD

El sistema fa ús d'un script d'inici per asegurar-se que sempre hi ha un *Admin* per entrar per primera vegada al panell. El procés de validació segueix els següents passos durant un desplegament:

1. Es crida automàticament des de l'script Node l'arxiu de taules de PostgreSQL en la ruta `backend/database/schema.sql` utilitzant els paràmetres `-e PGPASSWORD`.
2. Aquest genera la taula `users`, on el perfil principal adquireix el rol `'admin'` o `'producer'`.
3. Es corre l'arxiu `seed_admin.js` a través del Terminal SSH, el qual encripta (mitjançant *bcrypt.js*) la contrasenya `admin` i assegura l'email `admin` per al primer accés a l'aplicació web utilitzant `ON CONFLICT DO NOTHING` per poder-lo executar tantes vegades com calgui.

---

## 4. Desplegament Automatitzat (`deploy.js`)

L'aplicació es puja completament autogestionada al servidor gràcies a l'arxiu de Node.js `deploy.js`. Està configurat de la següent manera per minimitzar temps d'inactivitat del servei web a internet:

1. **Empaquetat Local (tar.exe):** Empaqueta tot el codi del `frontend`, `backend` i els manifests Docker excloent tot el que és brossa (carpetes internes tipus `node_modules` i carpetes pre-compilades).
2. **Transferència al Servidor via SSH:** A través de la IP directa del root. L'script transforma l'arxiu compilat general en *Base64*, puja'n trossos successivament mitjançant Bash a la consola i els recomprimeix manualment a format Linux Unzip un cop estigui sencer a la carpeta `/opt/calibreio/` ubicada dins el teu Hetzner VPS.
3. **Instal·lació dels recursos:** Executa `apt-get` als sistemes Debian del servidor per tenir garantit que Docker està funcionant abans de continuar.
4. **Construcció de Docker:** Demana a Docker que executi un *build* sencer llegint tots els teus arxius React i de NodeJS de forma asíncrona (un procés complex que triga força estona però l'inicia al servidor sencer). Baixa l'antiga versió que el servidor tenia instal·lada de cop i aixeca la nova amb `docker-compose -f docker-compose.prod.yml up -d --build`.
5. **Configuració de BBDD:** Un cop la instrucció s'ha engegat, envia les instruccions estructurals de base de dades explicades a la Secció 3 directament a la màquina per preparar la primera visita de l'usuari.

---

## 5. El teu Domini (DNS)

La teva pàgina web CalibreIO funciona a través del panell de l'emissari DonDominio utilitzant registres "A" apuntant cap al teu servidor actiu 24h a Hetzner Cloud perquè un humà recordi de forma fàcil com accedir-hi (ex, `www.calibreio.cat` -> Registre DNS de DonDominio Tradueix -> `37.27.93.106` VPS Port 80 Exposat).

Si cal moure l'espai físic del servidor en un futur o instal·lar un nou certificat de seguretat SSL (`https`), totes les opcions del teu lloc i els components de comunicacions restaran centralitzats dins del contenidor `nginx` frontal de forma independent d'on allotgis els teus programes `backend` en Docker.
