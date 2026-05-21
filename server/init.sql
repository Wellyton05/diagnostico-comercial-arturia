CREATE DATABASE IF NOT EXISTS diagcomercial;
USE diagcomercial;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS diagnosticos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nome VARCHAR(255),
    cnpj VARCHAR(20),
    segmento VARCHAR(255),
    cidade VARCHAR(255),
    data_diag VARCHAR(50),
    consultor VARCHAR(255),
    participantes TEXT,
    erp VARCHAR(255),
    faturamento VARCHAR(255),
    vendedores VARCHAR(255),
    clientes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS respostas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    diagnostico_id INT NOT NULL,
    question_id VARCHAR(50) NOT NULL,
    valor JSON, -- using JSON to store both simple string and arrays
    observacao TEXT,
    UNIQUE KEY diag_question (diagnostico_id, question_id),
    FOREIGN KEY (diagnostico_id) REFERENCES diagnosticos(id) ON DELETE CASCADE
);
