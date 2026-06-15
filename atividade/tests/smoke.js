import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * SMOKE TEST - Etapa 1
 * Objetivo: Verificar se a API está de pé antes de iniciar testes pesados.
 * Config: 1 usuário (VUser) por 30 segundos acessando /health.
 * Critério de Sucesso: 100% de sucesso nas requisições.
 * 
 * Executar com: k6 run tests/smoke.js
 */

export const options = {
  stages: [
    { duration: '30s', target: 1 }, // 1 usuário por 30 segundos
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // p95 deve ser menor que 500ms
    http_req_failed: ['rate<0.01'], // Taxa de erro menor que 1%
  },
};

export default function () {
  const baseUrl = 'http://localhost:3000';
  
  // Requisição GET para /health
  const res = http.get(`${baseUrl}/health`);
  
  // Verificações
  check(res, {
    'status é 200': (r) => r.status === 200,
    'resposta contém status UP': (r) => r.body.includes('UP'),
    'tempo de resposta < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1); // Aguarda 1 segundo entre requisições
}
