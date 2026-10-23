
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  const token = __ENV.ACCESS_TOKEN;

  if (!token) {
    throw new Error('ACCESS_TOKEN environment variable is missing');
  }

  const url = 'http://localhost:3000/api/leads?limit=50';

  const response = http.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(0.1);
}
