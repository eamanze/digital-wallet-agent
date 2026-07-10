import http from 'k6/http';
import { check } from 'k6';
export const options = { vus: Number(__ENV.VUS || 10), duration: __ENV.DURATION || '30s', thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<800'] } };
export default function () { const base=__ENV.BASE_URL || 'http://localhost:8080'; const response=http.get(`${base}/api/v1/transactions`); check(response, { 'history response is not 5xx': (r) => r.status < 500 }); }
