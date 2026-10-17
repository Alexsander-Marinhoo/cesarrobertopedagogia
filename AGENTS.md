# Diretrizes do Projeto / Regras do Agente

- **Execução Automática de Comandos**: Sempre execute diretamente todos os comandos de terminal, scripts de build/dev, operações do banco de dados/Supabase MCP e modificações de arquivos necessárias para cumprir a solicitação sem perguntar previamente ao usuário se pode rodar.
- **Proatividade**: Não solicite confirmação prévia para comandos rotineiros de desenvolvimento (npm, git, migrações SQL, scripts, etc.), realize a ação diretamente e reporte o resultado.
