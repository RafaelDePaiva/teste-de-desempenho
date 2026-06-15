import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * STRESS TEST - Etapa 3
 * Objetivo: Encontrar o ponto de ruptura da API com operações CPU-Heavy
 * Pergunta: "Quantos usuários fazendo cálculos de criptografia derrubam o servidor?"
 * 
 * Alvo: Endpoint /checkout/crypto (CPU Bound)
 * 
 * Cenário: Aumente a carga agressivamente
 * - 0 a 200 usuários em 2 minutos
 * - 200 a 500 usuários em 2 minutos
 * - 500 a 1000 usuários em 2 minutos
 * 
 * Análise: Observe no terminal o momento exato em que:
 * - Os tempos de resposta começam a subir exponencialmente
 * - Ocorrem Timeouts
 * - A taxa de erro aumenta significativamente
 * 
 * Executar com: k6 run tests/stress.js
 */

export const options = {
  stages: [
    { duration: '2m', target: 200 },  // 0 a 200 VUsers em 2 minutos
    { duration: '2m', target: 500 },  // 200 a 500 VUsers em 2 minutos
    { duration: '2m', target: 1000 }, // 500 a 1000 VUsers em 2 minutos
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // p95 < 2000ms (mais tolerante para stress)
    http_req_failed: ['rate<0.1'], // Taxa de erro < 10% (mais tolerante)
  },
};

export default function () {
  const baseUrl = 'http://localhost:3000';
  
  // Payload para o checkout com criptografia
  const payload = JSON.stringify({
    productId: Math.floor(Math.random() * 1000),
    quantity: Math.floor(Math.random() * 5) + 1,
    userId: Math.floor(Math.random() * 100000),
    secureMode: true,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: '10s', // Timeout de 10 segundos
  };

  // Requisição POST para /checkout/crypto (CPU-Heavy)
  const res = http.post(`${baseUrl}/checkout/crypto`, payload, params);

  // Verificações
  check(res, {
    'status é 201': (r) => r.status === 201,
    'resposta contém SECURE_TRANSACTION': (r) => r.body.includes('SECURE_TRANSACTION'),
    'tempo de resposta < 2000ms': (r) => r.timings.duration < 2000,
    'tempo de resposta < 5000ms': (r) => r.timings.duration < 5000,
  });

  sleep(Math.random() * 1); // Sleep aleatório entre 0 e 1 segundo
}
