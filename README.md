# S11 — Validación de una API con Postman y OpenAPI

API local de pedidos creada para la actividad de la Semana 11. Implementa listado paginado, creación y consulta protegida, permisos entre dos usuarios y `PUT /orders/{id}/status` como operación idempotente documentada.

## Entrega

- Estudiante: Zaqueo Osvaldo Chivalan Osorio.
- Carné: 2890-22-8915.
- Repositorio: https://github.com/ZaqueoChivalan/S11-Validaci-n-de-una-API-con-Postman-y-OpenAPI
- Video (máximo 3 minutos): https://drive.google.com/file/d/1SyHNf2Xel4w_xfkHxr_BQ4THuuz5tTxc/view?usp=sharing
- PDF breve: [`docs/entrega-s11.pdf`](docs/entrega-s11.pdf).

## Requisitos y versiones

- Node.js 20.11.1 o superior.
- npm 10.2.4 o superior.
- Postman Desktop 11.x o Newman 6.x para ejecutar la colección exportada.
- No se usa base de datos: los datos son controlados y se reinician al iniciar la API o con `POST /test/reset`.

## Preparación y ejecución

```powershell
npm install
npm start
```

La API queda en `http://localhost:3000`. Usuarios controlados para la demo: `alice / Alice123!` y `bob / Bob123!`. Son datos de laboratorio; no son credenciales reales.

Para verificar todos los casos sin depender de IDs anteriores:

```powershell
npm run test:api
npm run test:failure
```

El primer comando ejecuta TC-01 a TC-14 y crea `reports/last-run.json`. El segundo ejecuta la incompatibilidad controlada TC-SCHEMA-01 y crea `reports/controlled-failure.json`.

Para Newman, con la API iniciada:

```powershell
npx newman run postman/S11-pedidos.collection.json -e postman/S11-local.environment.json --reporters cli,json --reporter-json-export reports/newman-run.json
```

La colección es Postman Collection Format v2.1; el ambiente es exportable y no contiene secretos externos. La colección utiliza tokens locales controlados y genera el `orderId` en cada ejecución, por lo que no depende de IDs de otra corrida.

## Artefactos

- [`openapi/openapi.yaml`](openapi/openapi.yaml): contrato OpenAPI 3.1 con parámetros, seguridad, cuerpos, respuestas de éxito y error.
- [`docs/matriz-casos.md`](docs/matriz-casos.md): 14 casos con ID, riesgo, precondiciones, datos, resultado, aserciones y limpieza.
- [`postman/S11-pedidos.collection.json`](postman/S11-pedidos.collection.json): colección automatizada con pruebas identificadas TC-01 a TC-14.
- [`postman/S11-local.environment.json`](postman/S11-local.environment.json): ambiente sin secretos externos.
- [`reports/controlled-failure.json`](reports/controlled-failure.json): evidencia legible del fallo por `status=degraded` contra el esquema `const: ok` y la corrección posterior.

## Decisión de idempotencia

La operación es `PUT /orders/{id}/status`. Repetir el mismo estado no crea otro pedido ni cambia el identificador; el efecto final sigue siendo exactamente `confirmed`. La prueba TC-07 comprueba el efecto final, no solamente que las respuestas tengan el mismo formato.

## Limitación

La API usa memoria, por lo que no se evalúa persistencia ante reinicios ni concurrencia real. Las pruebas comprueban el contrato y reglas funcionales del servicio local.

## Uso responsable de IA

Se utilizó IA como apoyo para proponer la matriz, redactar el contrato y revisar los scripts. Se verificó personalmente la ejecución local, la cobertura de los 14 casos, el fallo controlado y la corrección. No se utilizaron secretos ni datos personales reales.
