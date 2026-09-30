# Mock server - agendamento de barbearia

API local compatível com o frontend do projeto [dio-projeto-full-stack-agendamento-barbearia](https://github.com/bartguitar/dio-projeto-full-stack-agendamento-barbearia). Não precisa de dependências npm além do Node.js 18 ou superior.

## Iniciar

```bash
npm start
```

O servidor fica em `http://localhost:1080/`, que é a URL configurada no `environment.ts` do frontend. Na primeira execução, cria `db.json` com clientes e agendamentos de demonstração para o mês atual. As alterações ficam salvas nesse arquivo, que é ignorado pelo Git.

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