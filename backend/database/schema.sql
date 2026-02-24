-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'producer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Fields Table (Camps)
CREATE TABLE IF NOT EXISTS fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    polygon VARCHAR(100),
    parcel VARCHAR(100),
    area DECIMAL(10,2), -- en hectàrees
    row_width DECIMAL(5,2), -- ample de la fila en metres
    plantation_frame VARCHAR(50), -- marc de plantació (ex: 4x1.5m)
    tree_type VARCHAR(100), -- tipus d'arbre (ex: eix, doble eix, vas)
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Size Controls Table (Seguiment de Calibres)
CREATE TABLE IF NOT EXISTS size_controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- L'usuari que ha pres la mesura
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    average_size DECIMAL(5,2) NOT NULL, -- calibre mitjà en mm
    sample_size INTEGER NOT NULL, -- quantitat de pomes mesurades
    notes TEXT, -- observacions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
