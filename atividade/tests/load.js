import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * LOAD TEST - Etapa 2
 * Cenário: Marketing anunciou uma promoção com pico de 50 usuários simultâneos.
 * Alvo: Endpoint /checkout/simple (I/O Bound)
 * 
 * Stages:
 * - Ramp-up: 0 a 50 usuários em 1 minuto
 * - Platô: Manter 50 usuários por 2 minutos
 * - Ramp-down: 50 a 0 usuários em 30 segundos
 * 
 * SLA (Thresholds):
 * - p95 da latência < 500ms
 * - Taxa de erro < 1%
 * 
 * Executar com: k6 run tests/load.js
 */

export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp-up: 0 a 50 VUsers em 1 minuto
    { duration: '2m', target: 50 },  // Platô: Manter 50 VUsers por 2 minutos
    { duration: '30s', target: 0 },  // Ramp-down: 50 a 0 VUsers em 30 segundos
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // p95 < 500ms, p99 < 1000ms
    http_req_failed: ['rate<0.01'], // Taxa de erro < 1%
    http_reqs: ['rate>100'], // Mínimo de requisições por segundo
  },
};

export default function () {
  const baseUrl = 'http://localhost:3000';
  
  // Payload para o checkout simples
  const payload = JSON.stringify({
    productId: Math.floor(Math.random() * 1000),
    quantity: Math.floor(Math.random() * 5) + 1,
    userId: Math.floor(Math.random() * 10000),
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Requisição POST para /checkout/simple
  const res = http.post(`${baseUrl}/checkout/simple`, payload, params);

  // Verificações
  check(res, {
    'status é 201': (r) => r.status === 201,
    'resposta contém APPROVED': (r) => r.body.includes('APPROVED'),
    'tempo de resposta < 500ms': (r) => r.timings.duration < 500,
    'tempo de resposta < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(Math.random() * 2); // Sleep aleatório entre 0 e 2 segundos
}
