# OpenClaw Telemetry Agent Setup

Este guia explica como configurar o Agente de Telemetria para enviar dados reais do seu servidor para o Dashboard OpenClaw.

## Pré-requisitos

1.  **Node.js** instalado no servidor onde o OpenClaw está rodando.
2.  Acesso ao Console do Firebase do seu projeto.

## Passo 1: Obter Credenciais do Firebase (Service Account)

Para que o script possa escrever no Firestore de forma segura, precisamos de uma chave de conta de serviço.

1.  Acesse o [Console do Firebase](https://console.firebase.google.com/).
2.  Selecione seu projeto.
3.  Clique no ícone de engrenagem (Configurações) -> **Configurações do projeto**.
4.  Vá para a aba **Contas de serviço**.
5.  Clique em **Gerar nova chave privada**.
6.  Um arquivo JSON será baixado. Renomeie este arquivo para `serviceAccountKey.json`.

## Passo 2: Configurar o Script

1.  Copie o arquivo `scripts/telemetry-agent.js` para o seu servidor.
2.  Coloque o arquivo `serviceAccountKey.json` no mesmo diretório do script.
3.  Instale as dependências necessárias:

```bash
npm install firebase-admin
```

## Passo 3: Executar o Agente

Rode o script com Node.js:

```bash
node telemetry-agent.js
```

Você verá logs indicando que a telemetria está sendo enviada a cada 5 segundos:

```
Starting OpenClaw Telemetry Agent...
Target System ID: OC-PROD-SERVER-01
[2024-03-08T12:00:05.123Z] Telemetry sent. CPU: 12%, MEM: 45%
...
```

## Integração Real com OpenClaw

O script atual (`telemetry-agent.js`) coleta métricas reais de CPU e Memória do servidor, mas usa dados simulados para as métricas específicas do OpenClaw (tokens, sessões, logs).

Para integrar com sua aplicação real:

1.  Edite a função `getOpenClawMetrics()` no arquivo `telemetry-agent.js`.
2.  Substitua os valores simulados por chamadas à API interna do seu sistema, leitura de arquivos de log ou consulta ao banco de dados local da sua aplicação.

Exemplo:

```javascript
// Em vez de Math.random(), leia de uma API local
const response = await fetch('http://localhost:3000/api/internal/stats');
const realData = await response.json();

return {
  status: realData.status,
  rich: {
    token_usage: realData.tokens,
    sessions: realData.sessions
  },
  // ...
};
```

## Visualização no Dashboard

Assim que o script começar a enviar dados, o Dashboard OpenClaw detectará automaticamente a nova telemetria e passará a exibir os dados reais em vez da simulação. Certifique-se de que o "Modo Simulação" esteja desligado no dashboard.
