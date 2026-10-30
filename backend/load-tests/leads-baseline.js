import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ACCESS_TOKEN = __ENV.ACCESS_TOKEN;

export const options = {
  vus: 10,
  duration: '60s',
  summaryTrendStats: [
    'avg',
    'min',
    'med',
    'max',
    'p(90)',
    'p(95)',
    'p(99)',
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
  },
};
export default function () {
  if (!ACCESS_TOKEN) {
    throw new Error('ACCESS_TOKEN environment variable is missing');
  }

  const url = `${BASE_URL}/api/leads?limit=50`;

  const response = http.get(url, {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(0.1);
}
