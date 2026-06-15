import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * SPIKE TEST - Etapa 4
 * Objetivo: Simular comportamento de "Flash Sale"
 * Exemplo: Abertura de venda de ingressos com salto abrupto de tráfego
 * 
 * Alvo: Endpoint /checkout/simple (I/O Bound)
 * 
 * Cenário:
 * - Carga baixa (10 usuários) por 30 segundos
 * - Salto imediato para 300 usuários em 10 segundos
 * - Manter 300 usuários por 1 minuto
 * - Queda imediata para 10 usuários
 * 
 * Análise esperada:
 * - Observar degradação de performance no pico
 * - Verificar se há erros ou timeouts
 * - Avaliar recuperação após a queda
 * 
 * Executar com: k6 run tests/spike.js
 */

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Carga baixa: 10 VUsers por 30s
    { duration: '10s', target: 300 },  // Spike: Salto de 10 a 300 VUsers em 10s
    { duration: '1m', target: 300 },   // Manter: 300 VUsers por 1 minuto
    { duration: '10s', target: 10 },   // Queda: 300 a 10 VUsers em 10s
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'], // p95 < 1000ms, p99 < 2000ms
    http_req_failed: ['rate<0.05'], // Taxa de erro < 5%
  },
};

export default function () {
  const baseUrl = 'http://localhost:3000';
  
  // Payload para o checkout simples (Flash Sale)
  const payload = JSON.stringify({
    productId: 9999, // Produto em promoção
    quantity: Math.floor(Math.random() * 3) + 1,
    userId: Math.floor(Math.random() * 100000),
    flashSale: true,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: '10s',
  };

  // Requisição POST para /checkout/simple
  const res = http.post(`${baseUrl}/checkout/simple`, payload, params);

  // Verificações
  check(res, {
    'status é 201': (r) => r.status === 201,
    'resposta contém APPROVED': (r) => r.body.includes('APPROVED'),
    'tempo de resposta < 1000ms': (r) => r.timings.duration < 1000,
    'tempo de resposta < 2000ms': (r) => r.timings.duration < 2000,
  });

  // Sleep mais curto para simular usuários clicando rapidamente
  sleep(Math.random() * 0.5); // Sleep aleatório entre 0 e 0.5 segundos
}
