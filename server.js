import { createServer } from 'node:http';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const databasePath = join(directory, 'db.json');
const port = Number(process.env.PORT || 1080);

function toIsoDate(date) {
  return new Date(date).toISOString();
}

function createInitialDatabase() {
  const today = new Date();
  const appointmentTime = (hour) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, 0);
    return toIsoDate(date);
  };

  return {
    clients: [
      { id: 1, name: 'Joao Silva', email: 'joao@example.com', phone: '11987654321' },
      { id: 2, name: 'Marcos Santos', email: 'marcos@example.com', phone: '11912345678' },
      { id: 3, name: 'Pedro Oliveira', email: 'pedro@example.com', phone: '11999887766' }
    ],
    schedules: [
      { id: 1, startAt: appointmentTime(9), endAt: appointmentTime(10), clientId: 1 },
      { id: 2, startAt: appointmentTime(11), endAt: appointmentTime(12), clientId: 2 }
    ],
    nextClientId: 4,
    nextScheduleId: 3
  };
}

if (!existsSync(databasePath)) {
  writeFileSync(databasePath, `${JSON.stringify(createInitialDatabase(), null, 2)}\n`);
}

const database = JSON.parse(readFileSync(databasePath, 'utf8'));

function persistDatabase() {
  const temporaryPath = `${databasePath}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(database, null, 2)}\n`);
  renameSync(temporaryPath, databasePath);
}

function sendJson(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(data));
}

function sendNoContent(response) {
  response.writeHead(204);
  response.end();
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Corpo da requisicao muito grande'));
        request.destroy();
      }
    });
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('JSON invalido'));
      }
    });
    request.on('error', reject);
  });
}

function validClient(client) {
  return typeof client.name === 'string' && client.name.trim()
    && typeof client.email === 'string' && client.email.trim()
    && typeof client.phone === 'string' && client.phone.trim();
}

function getClientPayload(body) {
  return {
    name: body.name.trim(),
    email: body.email.trim(),
    phone: body.phone.trim()
  };
}

function handleRequest(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const path = url.pathname.replace(/\/$/, '') || '/';

  if (request.method === 'GET' && path === '/') {
    sendJson(response, 200, { status: 'ok', service: 'barbershop-mock-server' });
    return;
  }

  if (path === '/clients' && request.method === 'GET') {
    sendJson(response, 200, database.clients);
    return;
  }

  if (path === '/clients' && request.method === 'POST') {
    readJsonBody(request).then((body) => {
      if (!validClient(body)) {
        sendJson(response, 400, { message: 'name, email e phone sao obrigatorios' });
        return;
      }
      const client = { id: database.nextClientId++, ...getClientPayload(body) };
      database.clients.push(client);
      persistDatabase();
      sendJson(response, 201, client);
    }).catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  const clientMatch = path.match(/^\/clients\/(\d+)$/);
  if (clientMatch) {
    const clientId = Number(clientMatch[1]);
    const clientIndex = database.clients.findIndex((client) => client.id === clientId);

    if (clientIndex < 0) {
      sendJson(response, 404, { message: 'Cliente nao encontrado' });
      return;
    }

    if (request.method === 'GET') {
      sendJson(response, 200, database.clients[clientIndex]);
      return;
    }

    if (request.method === 'PUT') {
      readJsonBody(request).then((body) => {
        if (!validClient(body)) {
          sendJson(response, 400, { message: 'name, email e phone sao obrigatorios' });
          return;
        }
        const updatedClient = { id: clientId, ...getClientPayload(body) };
        database.clients[clientIndex] = updatedClient;
        persistDatabase();
        sendJson(response, 200, updatedClient);
      }).catch((error) => sendJson(response, 400, { message: error.message }));
      return;
    }

    if (request.method === 'DELETE') {
      database.clients.splice(clientIndex, 1);
      database.schedules = database.schedules.filter((schedule) => schedule.clientId !== clientId);
      persistDatabase();
      sendNoContent(response);
      return;
    }
  }

  if (path === '/schedules' && request.method === 'POST') {
    readJsonBody(request).then((body) => {
      const startAt = new Date(body.startAt);
      const endAt = new Date(body.endAt);
      const clientId = Number(body.clientId);
      if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime())
        || !database.clients.some((client) => client.id === clientId)) {
        sendJson(response, 400, { message: 'startAt, endAt e clientId validos sao obrigatorios' });
        return;
      }
      const schedule = {
        id: database.nextScheduleId++,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        clientId
      };
      database.schedules.push(schedule);
      persistDatabase();
      sendJson(response, 201, schedule);
    }).catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  const scheduleMonthMatch = path.match(/^\/schedules\/(\d{4})\/(\d{1,2})$/);
  if (scheduleMonthMatch && request.method === 'GET') {
    const year = Number(scheduleMonthMatch[1]);
    const month = Number(scheduleMonthMatch[2]);
    if (month < 1 || month > 12) {
      sendJson(response, 400, { message: 'Mes deve estar entre 1 e 12' });
      return;
    }
    const scheduledAppointments = database.schedules
      .filter((schedule) => {
        const date = new Date(schedule.startAt);
        return date.getFullYear() === year && date.getMonth() + 1 === month;
      })
      .map((schedule) => {
        const date = new Date(schedule.startAt);
        const client = database.clients.find((item) => item.id === schedule.clientId);
        return {
          ...schedule,
          day: date.getDate(),
          clientName: client?.name || ''
        };
      });
    sendJson(response, 200, { year, month, scheduledAppointments });
    return;
  }

  const scheduleMatch = path.match(/^\/schedules\/(\d+)$/);
  if (scheduleMatch && request.method === 'DELETE') {
    const scheduleId = Number(scheduleMatch[1]);
    const scheduleIndex = database.schedules.findIndex((schedule) => schedule.id === scheduleId);
    if (scheduleIndex < 0) {
      sendJson(response, 404, { message: 'Agendamento nao encontrado' });
      return;
    }
    database.schedules.splice(scheduleIndex, 1);
    persistDatabase();
    sendNoContent(response);
    return;
  }

  sendJson(response, 404, { message: 'Rota nao encontrada' });
}

const server = createServer((request, response) => {
  try {
    handleRequest(request, response);
  } catch (error) {
    sendJson(response, 500, { message: 'Erro interno do mock server' });
    console.error(error);
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Mock server disponivel em http://localhost:${port}`);
});