# Mini Inbox

Aplicação local de gerenciamento de tickets de atendimento, desenvolvida como desafio técnico. O projeto reúne uma API em FastAPI, persistência SQLite, uma interface Next.js, métricas geradas com pandas e uma automação n8n acionada por webhook.

## Funcionalidades

- Lista e busca tickets por cliente, canal, assunto, status e prioridade.
- Exibe detalhes do ticket e permite atualizar status e prioridade.
- Persiste tickets em SQLite e cria 20 tickets de exemplo quando o banco está vazio.
- Exibe no dashboard as métricas produzidas pelo ETL.
- Envia um evento ao n8n quando um ticket muda para `closed` ou passa para prioridade `high`.

## Tecnologias

- Python, FastAPI, SQLite e pandas
- Next.js, React e TypeScript
- n8n para automação via webhook
- Dataset [Customer Support Ticket Dataset no Kaggle](https://www.kaggle.com/datasets/suraj520/customer-support-ticket-dataset)

## Estrutura

```text
mini-inbox/
├── backend/
│   ├── main.py                    # composição da API FastAPI
│   ├── api/                       # rotas e schemas HTTP
│   ├── application/               # casos de uso e contratos
│   ├── domain/                    # entidade e regras de negócio
│   ├── infrastructure/            # SQLite, métricas e webhook n8n
│   ├── requirements.txt
│   └── tickets.db                 # criado automaticamente ao iniciar a API
├── data/
│   ├── raw/
│   │   └── customer_support_tickets.csv
│   ├── processed/
│   │   └── metrics.json           # gerado pelo ETL
│   └── etl.py
├── frontend/
│   └── app/
├── n8n/
│   └── workflow.json             # exporte o workflow do n8n para este caminho
├── screenshots/
│   ├── tickets.png               # capturas da interface
│   └── n8n-workflow.png          # captura do workflow/execution no n8n
└── README.md
```

O arquivo `tickets.db` é criado pela API; `metrics.json` é gerado pelo ETL. O CSV utilizado está incluído em `data/raw/customer_support_tickets.csv`.

## Requisitos

- Python instalado
- Node.js e npm
- n8n local para testar a integração

## Como executar

Execute cada serviço em um terminal separado, mantendo o diretório atual na raiz do projeto.

### 1. Backend

No PowerShell, na raiz do projeto:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
```

Gere as métricas a partir do CSV:

```powershell
python data\etl.py
```

Inicie a API:

```powershell
python -m uvicorn main:app --reload --app-dir backend
```

A API ficará disponível em `http://127.0.0.1:8000`. A documentação interativa fica em `http://127.0.0.1:8000/docs`.

### 2. Frontend

Em outro terminal:

```powershell
Set-Location .\frontend
npm install
npm run dev
```

Abra `http://localhost:3000/tickets`. A página possui link para o dashboard; também é possível acessar diretamente `http://localhost:3000/dashboard`.

### 3. n8n

Em outro terminal, inicie o n8n:

```powershell
npx n8n
```

Abra `http://localhost:5678`, importe `n8n/workflow.json` ou monte o workflow com os seguintes nós:

1. **Webhook**: método `POST`, caminho `mini-inbox-ticket-event` e autenticação desativada para execução local.
2. **HTTP Request** conectado ao Webhook: método `POST`, URL `https://httpbin.org/post`, enviando o corpo JSON recebido pelo webhook.

Publique/ative o workflow para usar a URL de produção. O backend chama:

```text
http://localhost:5678/webhook/mini-inbox-ticket-event
```

Na URL de teste (`/webhook-test/...`), o n8n exige que a opção de escuta de evento de teste esteja ativa; para a integração normal do backend, deixe o workflow publicado e use a URL de produção acima.

## API

### `GET /tickets`

Retorna a lista de tickets.

### `GET /tickets/{id}`

Retorna os detalhes de um ticket. Responde `404` se ele não existir.

### `PATCH /tickets/{id}`

Atualiza `status`, `priority` ou ambos. Os valores permitidos são:

- `status`: `open`, `in_progress`, `closed`
- `priority`: `low`, `medium`, `high`

Exemplo de requisição:

```powershell
$payload = @{ priority = "high" } | ConvertTo-Json
Invoke-RestMethod `
  -Method Patch `
  -Uri "http://localhost:8000/tickets/1" `
  -ContentType "application/json" `
  -Body $payload
```

Quando o status muda para `closed` ou a prioridade muda para `high`, o backend envia ao webhook um evento semelhante a este:

```json
{
  "event": "ticket_updated",
  "ticket_id": 1,
  "status": "closed",
  "priority": "high",
  "customer_name": "Ana Souza",
  "subject": "Solicitação de reembolso"
}
```

Se o n8n estiver indisponível, a API registra a falha no terminal e ainda devolve a atualização do ticket. Assim, a integração externa não impede a persistência da alteração.

### `GET /metrics`

Retorna o conteúdo de `data/processed/metrics.json`. Se o arquivo ainda não existir, execute `python data\etl.py` na raiz do projeto.

## ETL e métricas

O script `data/etl.py` lê `data/raw/customer_support_tickets.csv`, converte `Date of Purchase` para data e grava `data/processed/metrics.json`. O arquivo contém o total de registros, a contagem de tickets por dia de compra e os cinco tipos de ticket mais frequentes.

Dataset utilizado: [Customer Support Ticket Dataset — Kaggle](https://www.kaggle.com/datasets/suraj520/customer-support-ticket-dataset).

## Evidências

Adicione capturas reais do projeto às pastas indicadas e mantenha estes links:

- Interface de tickets: `screenshots/tickets.png`
- Dashboard: `screenshots/dashboard.png`
- Workflow ou execução bem-sucedida do n8n: `screenshots/n8n-workflow.png`
- Export JSON do workflow: `n8n/workflow.json`

## Observações

- A aplicação foi preparada para execução local e usa endereços locais para API e webhook.
- O SQLite é criado em `backend/tickets.db` na primeira inicialização da API.
- As métricas do dashboard são atualizadas ao executar novamente o ETL.
