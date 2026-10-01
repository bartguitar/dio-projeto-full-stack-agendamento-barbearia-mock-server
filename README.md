# Mock server - agendamento de barbearia

API local compatível com o frontend do projeto [dio-projeto-full-stack-agendamento-barbearia](https://github.com/bartguitar/dio-projeto-full-stack-agendamento-barbearia). Não precisa de dependências npm além do Node.js 18 ou superior.

## Pré-requisitos

Verifique se o Node.js e o npm estão instalados:

```bash
node --version
npm --version
```

O Node.js deve ser a versão 18 ou superior. Se algum dos comandos não for encontrado em Ubuntu ou Debian, instale-os com:

```bash
sudo apt update
sudo apt install -y nodejs npm
```

Depois, confirme novamente as versões. O erro `127` ao executar `npm start` geralmente significa que o npm não foi encontrado.

## Iniciar

Siga esta ordem para executar o projeto completo:

1. Instale e verifique o Node.js e o npm conforme a seção de pré-requisitos.
2. Abra um terminal e inicie este mock server:

```bash
npm start
```

3. Em outro terminal, confirme que a API está respondendo:

```bash
curl http://localhost:1080/
```

O resultado esperado é um JSON com `"status":"ok"`.

O servidor fica em `http://localhost:1080/`, que é a URL configurada no `environment.ts` do frontend. Na primeira execução, cria um `db.json` vazio. Os clientes e agendamentos cadastrados pelo frontend ficam salvos nesse arquivo, que é ignorado pelo Git.

## Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/clients` | Lista clientes |
| `GET` | `/clients/:id` | Busca cliente por ID |
| `POST` | `/clients` | Cadastra cliente (`name`, `email`, `phone`) |
| `PUT` | `/clients/:id` | Atualiza cliente |
| `DELETE` | `/clients/:id` | Exclui cliente e seus agendamentos |
| `GET` | `/schedules/:year/:month` | Lista agendamentos do mês |
| `POST` | `/schedules` | Cria agendamento (`startAt`, `endAt`, `clientId`) |
| `DELETE` | `/schedules/:id` | Exclui agendamento |

O CORS está habilitado para permitir chamadas do servidor Angular em `localhost:4200`. Para iniciar o frontend, siga as instruções do repositório da aplicação.

## Executar com o frontend

Com o mock server ainda rodando no primeiro terminal, abra o diretório do frontend em outro terminal:

```bash
cd ~/VSCodeProjects/dio-projeto-full-stack-agendamento-barbearia
```

```bash
docker compose up --build
```

Depois, abra `http://localhost:4200/` no navegador. O frontend usará a API deste servidor em `http://localhost:1080/`. Não encerre o terminal do mock server enquanto estiver usando o frontend.