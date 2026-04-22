# Riesgo lineal - especificación funcional y conceptual

## 1. Propósito

El módulo de **riesgo lineal** de Kiriox debe permitir evaluar riesgos de forma trazable, auditable y operativamente útil, siguiendo la lógica de la evaluación del riesgo descrita en ISO 31010: **identificación**, **análisis** y **valoración**, con documentación, monitoreo y revisión.

Su función no es modelar interdependencias sistémicas ni cascadas estructurales. Su función es convertir riesgos individuales o acotados en decisiones operativas, de cumplimiento, auditoría y priorización.

En Kiriox, el riesgo lineal debe responder con claridad a estas preguntas:

- qué puede ocurrir y por qué;
- cuáles serían las consecuencias;
- cuál es la probabilidad de ocurrencia;
- qué controles existen y qué tan eficaces son;
- cuál es el nivel de riesgo resultante;
- si ese riesgo debe aceptarse, tratarse, priorizarse, escalarse, modificarse o detener la actividad asociada.

---

## 2. Alcance del módulo

El módulo debe poder aplicarse a distintos niveles de análisis:

- organización;
- departamento;
- proceso;
- proyecto;
- actividad individual;
- riesgo específico.

Esto implica que el modelo no debe asumir un único nivel jerárquico. Debe soportar evaluaciones desde visión macro hasta evaluación puntual.

---

## 3. Naturaleza del riesgo lineal

El riesgo lineal representa el riesgo como una **unidad evaluable individual**, analizada mediante una secuencia explícita:

1. definición del contexto;
2. identificación del riesgo;
3. análisis del riesgo;
4. valoración del riesgo;
5. tratamiento, cuando aplique;
6. monitoreo y revisión.

Su lógica central es:

**riesgo = consecuencias x probabilidad, ajustado por controles existentes y evaluado contra criterios definidos**.

Pero operativamente no se reduce a una fórmula. También incorpora:

- objetivos afectados;
- partes interesadas impactadas;
- supuestos;
- incertidumbre;
- sensibilidad;
- aceptabilidad;
- prioridad de acción.

---

## 4. Separación conceptual obligatoria dentro de Kiriox

Kiriox debe separar explícitamente dos lenguajes:

### 4.1 Riesgo lineal

Usado para:

- cumplimiento;
- priorización básica;
- auditoría;
- operación;
- matrices de impacto/probabilidad;
- decisiones de tratamiento sobre riesgos individuales.

### 4.2 Riesgo estructural

Usado para:

- fragilidad sistémica;
- interdependencias;
- nodos críticos;
- cascadas;
- concentración;
- resiliencia;
- criticidad relacional.

Esta especificación cubre solo el **riesgo lineal**. Ninguna decisión del módulo lineal debe confundirse con análisis por grafos. El módulo lineal puede coexistir con el estructural, pero no sustituirlo.

---

## 5. Objetivos del módulo

El módulo debe permitir:

- registrar evaluaciones de riesgo completas y justificadas;
- comparar riesgos bajo criterios homogéneos;
- estimar consecuencias, probabilidad y nivel de riesgo;
- evaluar la eficacia de controles existentes;
- distinguir riesgo inherente y riesgo residual;
- valorar el riesgo contra criterios versionados;
- soportar decisiones de aceptación, tratamiento, priorización o escalamiento;
- documentar supuestos, limitaciones e incertidumbres;
- mantener trazabilidad completa para auditoría, revisión y mejora continua.

---

## 6. Modelo conceptual mínimo

Toda evaluación de riesgo lineal debe tener estas entidades lógicas.

### 6.1 Evaluación

Unidad documental principal.

Debe contener:

- identificador;
- título;
- fecha;
- versión;
- estado;
- nivel de análisis;
- objeto evaluado;
- responsable;
- aprobador;
- periodo de vigencia;
- metodología;
- criterios de riesgo aplicados.

### 6.2 Contexto

Debe documentar:

- objetivos de la evaluación;
- alcance;
- inclusiones;
- exclusiones;
- contexto externo;
- contexto interno;
- contexto del proceso de gestión del riesgo;
- criterios de riesgo;
- restricciones;
- supuestos;
- fuentes de información.

### 6.3 Riesgo

Cada riesgo debe incluir como mínimo:

- código;
- nombre;
- descripción;
- causa o fuente;
- evento;
- consecuencia;
- objetivo afectado;
- partes interesadas afectadas;
- proceso o actividad asociada;
- categoría;
- tipo de riesgo;
- propietario del riesgo.

### 6.4 Controles

Cada riesgo puede tener cero o más controles.

Cada control debe registrar:

- nombre;
- descripción;
- tipo;
- naturaleza preventiva, detectiva o correctiva;
- evidencia asociada;
- frecuencia;
- responsable;
- diseño esperado;
- estado de implementación;
- evaluación de eficacia;
- justificación de eficacia.

### 6.5 Análisis

Debe capturar:

- consecuencia;
- probabilidad;
- nivel de riesgo inherente;
- eficacia de controles;
- nivel de riesgo residual;
- calidad de datos;
- incertidumbre;
- sensibilidad;
- justificación analítica.

### 6.6 Valoración

Debe capturar:

- criterios usados;
- nivel de aceptabilidad;
- decisión;
- prioridad;
- justificación;
- necesidad de tratamiento;
- tipo de tratamiento sugerido.

### 6.7 Tratamiento

Si aplica, debe registrar:

- opción de tratamiento;
- acción definida;
- responsable;
- costo estimado;
- fecha objetivo;
- estado;
- riesgo esperado posterior;
- necesidad de reevaluación.

### 6.8 Monitoreo y revisión

Debe registrar:

- factores críticos a monitorear;
- hipótesis críticas;
- indicadores;
- eventos de revisión;
- frecuencia de revisión;
- evidencia nueva;
- cambios de contexto;
- resultados del monitoreo de controles.

---

## 7. Contexto de la evaluación

El contexto no es un texto decorativo. Es una capa estructural que condiciona toda la evaluación.

### 7.1 Contexto externo

Debe permitir registrar:

- factores legales y regulatorios;
- condiciones económicas;
- entorno competitivo;
- tendencias del entorno;
- stakeholders externos;
- percepciones y valores externos.

### 7.2 Contexto interno

Debe permitir registrar:

- recursos disponibles;
- capacidades y conocimiento;
- flujos de información;
- procesos de decisión;
- stakeholders internos;
- objetivos y estrategia;
- cultura;
- políticas;
- procesos;
- normas adoptadas;
- estructura organizacional.

### 7.3 Contexto del proceso de gestión del riesgo

Debe permitir registrar:

- responsables;
- alcance temporal y espacial;
- inclusiones y exclusiones;
- relaciones con otros procesos o evaluaciones;
- metodología aplicada;
- criterios de riesgo;
- decisiones a soportar;
- recursos del estudio.

### 7.4 Criterios de riesgo

Los criterios deben ser **versionados** y explícitos.

Deben definir:

- tipos de consecuencias a considerar;
- escalas de consecuencia;
- forma de expresar la probabilidad;
- método para calcular nivel de riesgo;
- umbral de tratamiento;
- aceptabilidad;
- tolerabilidad;
- reglas para combinación de variables, si existen.

---

## 8. Identificación del riesgo

La identificación del riesgo es el proceso por el cual se descubren, reconocen y registran riesgos que pueden afectar el logro de objetivos.

El registro de cada riesgo debe obligar a capturar:

- qué puede pasar;
- por qué puede pasar;
- cuál es la causa o fuente;
- qué objetivo afecta;
- a qué parte interesada impacta;
- qué controles existen ya.

### 8.1 Estructura recomendada del riesgo

Para evitar registros vagos, cada riesgo debe formularse así:

**Causa/Fuente -> Evento -> Consecuencia -> Objetivo afectado**

Ejemplo abstracto:

**deficiencia en validación documental -> aprobación indebida -> incumplimiento normativo y reproceso -> afectación del objetivo de cumplimiento y continuidad operativa**

### 8.2 Métodos posibles de identificación

Kiriox debe permitir al menos registrar qué técnica se utilizó, por ejemplo:

- tormenta de ideas;
- entrevistas estructuradas o semiestructuradas;
- listas de verificación;
- análisis preliminar de peligros;
- SWIFT;
- escenarios;
- FMEA/FMECA;
- bow tie;
- otras técnicas aplicables.

No es necesario que todas estén automatizadas al inicio, pero sí que el modelo soporte su trazabilidad.

---

## 9. Análisis del riesgo

El análisis del riesgo desarrolla comprensión del riesgo. Debe transformar un riesgo registrado en una estimación argumentada de su magnitud.

### 9.1 Componentes obligatorios del análisis

Todo análisis debe cubrir:

- causas y fuentes;
- consecuencias;
- probabilidad;
- controles existentes;
- eficacia de controles;
- nivel de riesgo inherente;
- nivel de riesgo residual;
- incertidumbres;
- sensibilidad.

### 9.2 Consecuencias

La consecuencia no debe reducirse a una etiqueta simple de alto, medio o bajo.

Debe describir:

- naturaleza del impacto;
- magnitud del impacto;
- objetivos afectados;
- stakeholders afectados;
- temporalidad del impacto;
- impactos directos e indirectos.

Kiriox debe permitir una **pantalla de impacto** o bloque estructurado donde la consecuencia se descomponga por dimensiones, por ejemplo:

- regulatoria;
- financiera;
- operativa;
- reputacional;
- seguridad;
- continuidad;
- datos o información.

### 9.3 Probabilidad

La probabilidad debe poder expresarse de forma:

- cualitativa;
- semicuantitativa;
- cuantitativa.

Además, debe admitir registro de:

- frecuencia histórica;
- base documental;
- fundamento experto;
- horizonte temporal;
- condiciones de ocurrencia.

La frecuencia debe tener peso explícito. Una probabilidad alta sin fundamento documentado no debe considerarse madura analíticamente.

### 9.4 Controles y eficacia

Kiriox debe evaluar no solo si el control existe, sino cuánto reduce el riesgo inherente.

La evaluación del control debe separar:

- existencia;
- diseño;
- implementación;
- operación real;
- evidencia;
- eficacia estimada.

La eficacia puede expresarse cualitativa, semicuantitativa o cuantitativamente, pero siempre con justificación.

### 9.5 Riesgo inherente y residual

Kiriox debe calcular y mostrar:

- **riesgo inherente**: consecuencia y probabilidad antes de considerar controles;
- **riesgo residual**: consecuencia y probabilidad tras considerar controles existentes y su eficacia.

Esto es crítico. Sin esta separación, la evaluación pierde valor para auditoría y para diseño de tratamiento.

### 9.6 Nivel de riesgo

El nivel de riesgo puede determinarse mediante matriz o fórmula, según el criterio versionado.

Kiriox debe soportar como mínimo:

- enfoque cualitativo;
- enfoque semicuantitativo con escalas numéricas;
- posibilidad futura de cuantificación avanzada.

---

## 10. Incertidumbre y sensibilidad

Esta capa es obligatoria y no opcional.

Toda evaluación madura debe declarar:

- calidad de los datos;
- supuestos utilizados;
- lagunas de información;
- grado de incertidumbre del modelo o método;
- variables sensibles;
- impacto esperado de cambios en parámetros críticos.

Kiriox debe permitir capturar:

- origen de incertidumbre;
- parámetro afectado;
- nivel de sensibilidad;
- necesidad de datos adicionales;
- implicación sobre la confianza del resultado.

Esto evita presentar niveles de riesgo con una precisión falsa.

---

## 11. Valoración del riesgo

La valoración es una capa distinta del análisis.

No debe ser una consecuencia automática del número de riesgo. Debe convertir el análisis en decisión.

### 11.1 Entradas de la valoración

La valoración debe recibir:

- nivel de riesgo resultante;
- criterios versionados;
- contexto organizacional;
- costos de mitigación;
- beneficios de la actividad;
- restricciones legales o regulatorias;
- percepción del riesgo;
- tolerabilidad y aceptabilidad definidas.

### 11.2 Salidas de la valoración

Debe producir:

- decisión;
- justificación;
- prioridad;
- nivel de aceptabilidad;
- necesidad de tratamiento;
- recomendación estratégica.

### 11.3 Decisiones posibles

Kiriox debe soportar decisiones como:

- aceptar;
- tratar;
- tratar con prioridad alta;
- escalar;
- continuar con monitoreo;
- modificar la actividad;
- detener la actividad.

### 11.4 Tres bandas

El sistema debe soportar al menos el esquema de tres bandas:

- **intolerable**: requiere tratamiento esencial;
- **ALARP o zona intermedia**: requiere balance entre costo, beneficio y reducción razonable;
- **aceptable**: no requiere tratamiento adicional, aunque puede requerir monitoreo.

### 11.5 Significado correcto de ALARP

ALARP no significa reducir el riesgo indefinidamente.

Significa reducirlo hasta el punto en que el costo adicional de reducción sea desproporcionado respecto al beneficio obtenido.

---

## 12. Tratamiento del riesgo

El tratamiento depende de la valoración, no del análisis aislado.

Opciones típicas:

- reducir probabilidad;
- reducir consecuencia;
- fortalecer controles;
- introducir controles nuevos;
- transferir parcialmente;
- evitar o detener la actividad;
- aceptar con justificación.

Luego del tratamiento debe existir una **reevaluación** del riesgo para determinar si el nuevo nivel es tolerable o si se requieren medidas adicionales.

---

## 13. Documentación del informe

Toda evaluación de riesgo lineal debe poder generar un informe con esta estructura mínima:

- objetivos y campo de aplicación;
- descripción de las partes pertinentes del sistema y sus funciones;
- resumen del contexto externo e interno;
- criterios de riesgo aplicados y justificación;
- limitaciones, supuestos e hipótesis;
- metodología aplicada;
- resultados de identificación del riesgo;
- datos, supuestos, orígenes y validación;
- resultados del análisis del riesgo;
- análisis de sensibilidad e incertidumbre;
- supuestos críticos y factores a monitorear;
- discusión de resultados;
- conclusiones y recomendaciones;
- referencias.

Este esquema no es decorativo. Debe corresponder a la estructura interna de datos del módulo para que el informe sea salida natural del sistema.

---

## 14. Monitoreo y revisión

El módulo debe permitir que la evaluación permanezca viva durante el ciclo de vida del objeto evaluado.

Debe poder monitorear:

- cambios de contexto;
- vigencia de supuestos;
- incidentes reales;
- desempeño de controles;
- nueva evidencia;
- eventos disparadores de revisión.

La revisión debe actualizar:

- el contexto;
- la eficacia de controles;
- la consecuencia;
- la probabilidad;
- la valoración;
- las acciones de tratamiento.

---

## 15. Vistas funcionales recomendadas en producto

### 15.1 Vista de contexto

Debe mostrar:

- objetivos;
- alcance;
- criterios;
- supuestos;
- restricciones;
- fuentes.

### 15.2 Vista de registro de riesgos

Tabla o lista con:

- código;
- riesgo;
- objetivo afectado;
- proceso;
- consecuencia;
- probabilidad;
- inherente;
- residual;
- valoración;
- prioridad;
- estado.

### 15.3 Vista de detalle del riesgo

Debe incluir:

- formulación completa del riesgo;
- causas y consecuencias;
- partes interesadas afectadas;
- controles;
- evaluación de eficacia;
- justificación analítica;
- incertidumbre;
- decisión;
- tratamiento;
- historial.

### 15.4 Vista de impacto

Debe desagregar impacto por dimensiones y stakeholders.

### 15.5 Vista de controles

Debe permitir evaluar si el control:

- existe;
- está diseñado correctamente;
- opera;
- tiene evidencia;
- reduce efectivamente el riesgo.

### 15.6 Vista de calor y bandas

Debe mostrar:

- matriz impacto/probabilidad;
- ubicación inherente;
- ubicación residual;
- bandas de aceptabilidad;
- prioridad asociada.

### 15.7 Vista de monitoreo

Debe mostrar:

- factores críticos;
- hipótesis críticas;
- próximos hitos de revisión;
- alertas por vencimiento o cambio de contexto.

---

## 16. Campos mínimos recomendados para base de datos

### EvaluacionRiesgo

- id
- codigo
- titulo
- descripcion
- nivel_analisis
- objeto_tipo
- objeto_id
- responsable_id
- aprobador_id
- metodologia
- criterio_version_id
- estado
- fecha_evaluacion
- fecha_revision
- vigencia_desde
- vigencia_hasta

### ContextoRiesgo

- evaluacion_id
- objetivo_evaluacion
- alcance
- inclusiones
- exclusiones
- contexto_externo
- contexto_interno
- contexto_proceso
- restricciones
- supuestos
- fuentes

### Riesgo

- id
- evaluacion_id
- codigo
- nombre
- descripcion
- causa
- evento
- consecuencia
- objetivo_afectado
- stakeholder_afectado
- categoria
- propietario_id

### Control

- id
- riesgo_id
- nombre
- descripcion
- tipo
- naturaleza
- responsable_id
- evidencia
- frecuencia
- estado_implementacion
- eficacia_valor
- eficacia_escala
- justificacion

### AnalisisRiesgo

- riesgo_id
- consecuencia_valor
- consecuencia_justificacion
- probabilidad_valor
- probabilidad_justificacion
- inherente_valor
- residual_valor
- incertidumbre_nivel
- incertidumbre_descripcion
- sensibilidad_nivel
- sensibilidad_descripcion
- calidad_dato

### ValoracionRiesgo

- riesgo_id
- aceptabilidad
- decision
- prioridad
- justificacion
- requiere_tratamiento
- recomendacion

### TratamientoRiesgo

- id
- riesgo_id
- tipo_tratamiento
- accion
- responsable_id
- costo_estimado
- fecha_objetivo
- estado
- riesgo_post_tratamiento_esperado

### MonitoreoRiesgo

- id
- riesgo_id
- factor_critico
- indicador
- hipotesis_critica
- frecuencia_revision
- trigger_revision
- evidencia
- resultado

---

## 17. Reglas funcionales clave

1. No puede existir valoración sin análisis previo.
2. No puede existir análisis sin contexto y criterios definidos.
3. Todo riesgo debe poder vincularse a objetivo afectado.
4. Todo control debe tener evidencia o justificación explícita de ausencia.
5. El sistema debe distinguir inherente y residual.
6. La valoración debe usar criterios versionados.
7. Toda reevaluación debe conservar historial.
8. La incertidumbre no puede omitirse silenciosamente en evaluaciones maduras.
9. El informe debe generarse desde datos estructurados, no desde texto libre aislado.
10. El módulo lineal no debe mezclar sus resultados con métricas de fragilidad estructural.

---

## 18. Resultado esperado del módulo

El módulo de riesgo lineal de Kiriox debe producir una evaluación que sea simultáneamente:

- **normativamente alineada** con la lógica de ISO 31010;
- **operativamente accionable** para responsables y dueños de proceso;
- **auditable** por su trazabilidad de criterios, supuestos, datos y decisiones;
- **comparable** entre áreas, procesos y proyectos;
- **separable** del análisis estructural por grafos.

Su salida final no es una matriz aislada. Su salida final es una **decisión de gestión del riesgo justificada**, basada en contexto, análisis, controles, incertidumbre y criterios de valoración.

---

## 19. Referencias base

- ISO 31010 / NCh-ISO 31010: lógica de evaluación del riesgo, técnicas, documentación, monitoreo y valoración.
- Notas conceptuales de Kiriox: separación entre riesgo lineal y riesgo estructural, foco dual entre cumplimiento operativo y fragilidad sistémica.
