from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors

out = 'docs/entrega-s11.pdf'
doc = SimpleDocTemplate(out, pagesize=letter, rightMargin=0.55*inch, leftMargin=0.55*inch, topMargin=0.5*inch, bottomMargin=0.5*inch)
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleCenter', parent=styles['Title'], alignment=TA_CENTER, fontSize=16, leading=20))
styles.add(ParagraphStyle(name='Small', parent=styles['BodyText'], fontSize=8.5, leading=11))
story = [Paragraph('S11 — Validación de una API con Postman y OpenAPI', styles['TitleCenter']), Spacer(1, 10), Paragraph('<b>Estudiante:</b> PENDIENTE — completar nombre y carné', styles['BodyText']), Paragraph('<b>Curso:</b> Aseguramiento de la calidad de software', styles['BodyText']), Paragraph('<b>Repositorio:</b> https://github.com/ZaqueoChivalan/S11-Validaci-n-de-una-API-con-Postman-y-OpenAPI', styles['Small']), Paragraph('<b>Video:</b> PENDIENTE — pegar enlace verificable (máximo 3 minutos)', styles['BodyText']), Spacer(1, 10)]
story += [Paragraph('<b>Resumen</b>', styles['Heading2']), Paragraph('Se implementó una API local de pedidos protegida con Bearer token. Permite autenticación, listado paginado, creación y consulta de pedidos, control de permisos entre Alice y Bob y una operación PUT idempotente para fijar el estado.', styles['Small']), Spacer(1, 7)]
data = [['Elemento', 'Resultado'], ['Contrato OpenAPI 3.1', 'Incluye seguridad, parámetros, cuerpos y respuestas 2xx/4xx.'], ['Matriz y colección', '14 casos TC-01 a TC-14 automatizados.'], ['Ejecución limpia', 'Postman: 15 pruebas aprobadas, 0 fallos y 0 errores.'], ['Incompatibilidad', 'Fallo esperado con status=degraded; corrección aprobada con status=ok.'], ['Evidencia', 'reports/last-run.json y reports/controlled-failure.json.']]
t = Table(data, colWidths=[1.65*inch, 5.6*inch])
t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#1f4e79')),('TEXTCOLOR',(0,0),(-1,0),colors.white),('GRID',(0,0),(-1,-1),0.4,colors.grey),('VALIGN',(0,0),(-1,-1),'TOP'),('FONTSIZE',(0,0),(-1,-1),8),('LEADING',(0,0),(-1,-1),10),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#eef4f8')])]))
story += [t, Spacer(1, 8), Paragraph('<b>Casos cubiertos</b>', styles['Heading2']), Paragraph('Solicitudes válidas y verificación posterior, campos obligatorios y datos inválidos, ausencia y falsedad de credenciales, acceso a recurso ajeno, recurso inexistente, paginación, repetición idempotente y esquemas de éxito/error.', styles['Small']), Spacer(1, 7), Paragraph('<b>Limitación</b>', styles['Heading2']), Paragraph('La API almacena datos en memoria; no se cubren persistencia ante reinicio ni concurrencia real.', styles['Small']), Spacer(1, 7), Paragraph('<b>Uso responsable de IA</b>', styles['Heading2']), Paragraph('Se utilizó IA como apoyo para proponer casos, redactar el contrato y revisar scripts. Se verificaron personalmente la ejecución, la cobertura y el fallo controlado. No se usaron secretos ni datos reales.', styles['Small'])]
doc.build(story)
print(out)
