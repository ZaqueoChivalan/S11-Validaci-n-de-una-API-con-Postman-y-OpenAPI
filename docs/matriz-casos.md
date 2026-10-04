# Matriz de pruebas S11

| ID | Operación | Riesgo | Precondiciones | Datos | Resultado esperado | Aserciones | Limpieza |
|---|---|---|---|---|---|---|---|
| TC-01 | GET /health | Servicio caído | API iniciada | Ninguno | 200 y health válido | status, campos, tipos | Ninguna |
| TC-02 | POST /auth/login | Login no funciona | API iniciada | alice/Alice123! | 200 y token | código, token, usuario | No persistente |
| TC-03 | GET /orders | Lista expone datos | Token Alice | page=1&pageSize=1 | 200 paginado | data, pagination, límite | Ninguna |
| TC-04 | POST /orders | Creación rompe reglas | Token Alice | product y quantity válidos | 201 | estructura completa y owner=me | Guardar orderId |
| TC-05 | GET /orders/{id} | Cambio no consultable | TC-04 | orderId creado | 200 | mismo id y datos | Pedido se reinicia |
| TC-06 | PUT /orders/{id}/status | Cambio de estado incorrecto | TC-04 | confirmed | 200 | estado confirmado | Pedido se reinicia |
| TC-07 | PUT repetido (idempotencia) | Repetir duplica/varía efecto | TC-04 | confirmed dos veces | 200 dos veces, estado final confirmed, un recurso | comparar id/estado |
| TC-08 | POST /orders | Campos obligatorios omitidos | Token Alice | quantity solamente | 422 | Error schema y product | Ninguna |
| TC-09 | POST /orders | Tipo/rango inválido | Token Alice | quantity=0 | 422 | VALIDATION_ERROR y details | Ninguna |
| TC-10 | GET /orders | Acceso anónimo | Sin token | Ninguno | 401 | Error schema | Ninguna |
| TC-11 | GET /orders | Token inválido | Bearer inválido | Ninguno | 401 | UNAUTHORIZED | Ninguna |
| TC-12 | GET /orders/{id} | IDOR entre usuarios | Alice + id de Bob | ord-seed-002 | 403 | FORBIDDEN, no datos | Ninguna |
| TC-13 | GET /orders/{id} | Manejo de inexistente | Token Alice | ord-no-existe | 404 | NOT_FOUND | Ninguna |
| TC-14 | GET /orders | Paginación inválida | Token Alice | page=0 o no entero | 400 | INVALID_PAGINATION | Ninguna |

La colección identifica cada request y sus pruebas con el ID `TC-xx`. La validación de estructura se hace mediante aserciones de campos; la conformidad completa contra OpenAPI se documenta separadamente y no se confunde con validar solo el cuerpo.
