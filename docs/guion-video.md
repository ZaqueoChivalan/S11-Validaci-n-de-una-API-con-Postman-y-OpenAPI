# Guion sugerido para el video (máximo 3 minutos)

1. **0:00–0:35 — Aplicación y riesgos.** Mostrar que es una API local de pedidos. Explicar que se eligieron como riesgos principales la falta de autenticación, el acceso IDOR entre Alice y Bob, datos inválidos, paginación y cambios repetidos.
2. **0:35–1:25 — Ejecución.** Ejecutar la colección `S11-pedidos` y mostrar el resultado de TC-01 a TC-14. Destacar creación, consulta, paginación, errores 401/403/404/422 y el estado final de la operación PUT.
3. **1:25–2:10 — Negativa e incompatibilidad.** Mostrar TC-12 (Alice intentando consultar el pedido de Bob) y `reports/controlled-failure.json`, donde `status=degraded` contradice `const: ok` de OpenAPI.
4. **2:10–2:40 — Corrección.** Restaurar `status=ok`, repetir la prueba y mostrar que pasa. Explicar que no se modificó el contrato para ocultar el defecto.
5. **2:40–3:00 — Limitación y cierre.** Indicar que la API usa memoria y no cubre persistencia/concurrencia real. Mencionar el uso de IA como apoyo y la verificación personal de resultados.
