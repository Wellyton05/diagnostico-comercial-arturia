# DiagComercial — Sistema de Diagnóstico Comercial

Uma ferramenta consultiva completa para levantamento da política comercial de indústrias e distribuidores.

## Arquitetura
Este projeto utiliza:
- **Frontend:** HTML, CSS, JavaScript Vanilla
- **Backend:** Node.js com Express
- **Banco de Dados:** MySQL
- **Autenticação:** JSON Web Tokens (JWT)

## Funcionalidades
- **Autenticação:** Login e cadastro de usuários.
- **Formulário Passo a Passo:** 12 etapas cobrindo identificação, clientes, risco & crédito, frete, preços, etc.
- **Dashboard:** Visualize e acesse os diagnósticos anteriores.
- **Auto-Save:** O progresso do diagnóstico é salvo automaticamente no banco de dados enquanto você digita.
- **Geração de Documento:** Geração automática de documento Word (.docx) com resumo executivo, tabela de parametrizações e respostas.

## Como rodar o projeto localmente

1. **Pré-requisitos:**
   - Node.js instalado (v16+)
   - Servidor MySQL rodando localmente

2. **Configuração do Banco de Dados:**
   Crie o banco e as tabelas usando o script fornecido no MySQL:
   ```sql
   source server/init.sql;
   ```

3. **Configuração do Ambiente:**
   Configure as credenciais do banco de dados no arquivo `.env` localizado na raiz do projeto:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=sua_senha
   DB_NAME=diagcomercial
   JWT_SECRET=super_secret_jwt_key_diagcomercial
   ```

4. **Instalação das dependências:**
   ```bash
   npm install
   ```

5. **Iniciando o Servidor:**
   ```bash
   npm start
   ```

6. **Acesso:**
   Abra o navegador e acesse: `http://localhost:3000`
