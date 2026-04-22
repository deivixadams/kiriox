# AGENTS_STRUCTURAL.md

## Propósito

Este documento define cómo un agente de IA debe abordar el **riesgo estructural** en Kiriox.

El agente no debe tratar el riesgo estructural como una matriz, una lista de hallazgos o una suma de severidades independientes. Debe tratarlo como una **estructura interdependiente** en la que la fragilidad emerge por posición, dependencia, concentración, baja redundancia, propagación y puntos de ruptura.

La pregunta central no es:

**¿Qué riesgo individual es más alto?**

La pregunta central es:

**¿Cómo se comporta la estructura completa, por dónde puede romperse y qué intervención reduce más fragilidad sistémica?**

---

## Regla de separación obligatoria

Kiriox opera con dos lenguajes analíticos distintos.

### Motor lineal

Sirve para:

- cumplimiento;
- reporting;
- priorización básica;
- evaluación por impacto/probabilidad;
- riesgo inherente, neto o residual esperado.

### Motor estructural

Sirve para:

- fragilidad;
- interdependencia;
- resiliencia;
- cascadas;
- concentración;
- criticidad nodal;
- puntos únicos de falla;
- colapso estructural.

El agente **nunca** debe mezclar ambos motores como si fueran el mismo modelo.

El motor lineal responde: **qué tan grande es un riesgo individual**.

El motor estructural responde: **cómo se comporta el sistema completo y dónde puede romperse**.

---

## Cadena oficial del sistema

La cadena correcta es:

**Reino → Elemento → Riesgo → Control → Prueba → Evidencia**

Esta es la cadena normativa-operativa que el agente debe preservar durante el análisis.

### Implicación crítica

El agente no debe introducir una capa intermedia de dominio como parte de la cadena oficial, salvo que en una futura versión del sistema se modele explícitamente como entidad adicional.

En esta versión, la arquitectura estructural base parte de:

- Reino;
- Elemento;
- Riesgo;
- Control;
- Prueba;
- Evidencia.

Si el agente necesita agrupar elementos por familias temáticas, puede hacerlo como **agrupación analítica derivada**, pero no debe reescribir la cadena oficial del sistema.

---

## Restricción arquitectónica obligatoria

Este sistema es un **sistema nuevo**.

Por tanto:

- no existen vistas en base de datos;
- no existen tablas materializadas de análisis;
- no existen métricas persistidas por defecto;
- no existen consultas SQL canónicas listas;
- no existe una capa previa de `_v_graph_*` ni equivalentes.

El agente debe razonar a nivel de **modelo conceptual, matemático y estructural**, no como si estuviera operando sobre una base ya implementada.

### Consecuencia práctica

Cuando el agente hable de:

- nodos;
- aristas;
- centralidad;
- redundancia;
- cascadas;
- hard gates;
- puentes críticos;
- failure impact;
- simulación estructural;

lo hará como **capacidades del sistema objetivo**, no como objetos ya disponibles en una base existente.

---

## Ontología estructural mínima

El agente debe modelar el riesgo estructural usando, como mínimo, estos tipos de nodo:

- **REINO**
- **ELEMENTO**
- **RIESGO**
- **CONTROL**
- **PRUEBA**
- **EVIDENCIA**

Y estas relaciones fundamentales:

- un reino contiene elementos;
- un elemento se expone a uno o varios riesgos;
- un riesgo es mitigado por uno o varios controles;
- un control es verificado por una o varias pruebas;
- una prueba produce o valida una o varias evidencias.

### Relaciones derivadas permitidas

El agente puede además inferir relaciones como:

- elemento depende de otro elemento;
- varios riesgos comparten control;
- un control es hard gate;
- un control actúa como punto único de falla;
- una evidencia sostiene múltiples pruebas o controles;
- la falla de un control propaga exposición a múltiples riesgos.

Pero debe distinguir siempre entre:

- **relación explícita del modelo**;
- **relación inferida para análisis estructural**.

---

## Qué es riesgo estructural

Riesgo estructural es la exposición que surge de la **configuración relacional del sistema**, no solo de la debilidad individual de sus partes.

No es:

- un promedio;
- una suma lineal de incumplimientos;
- una matriz de calor;
- una lista ordenada por severidad individual.

Sí es:

- fragilidad de red;
- concentración de debilidad;
- dependencia crítica;
- baja redundancia;
- propagación de fallas;
- activación de gatillos no compensables;
- cercanía a umbrales de ruptura.

---

## Principios operativos del agente

### 1. La estructura vale más que el promedio

Un sistema puede verse razonable en promedio y ser extremadamente frágil si la exposición está concentrada en pocos nodos críticos.

### 2. Un control sin evidencia válida no tiene fuerza plena

Si la evidencia que sostiene una prueba o un control no es válida, vigente o suficiente, el agente debe tratar el control como degradado o inefectivo según el contrato del modelo.

### 3. Un hard gate no se compensa con medias

Si un control o condición es hard gate, su falla puede imponer una discontinuidad o un piso de exposición, aunque otros componentes estén bien evaluados.

### 4. La redundancia falsa no es resiliencia

Varios controles nominalmente distintos pueden ser estructuralmente equivalentes. Si dependen del mismo mecanismo operativo, del mismo dato, del mismo responsable o de la misma evidencia, el agente no debe tratarlos como independencia real.

### 5. La criticidad no depende solo del score local

La importancia de un nodo depende también de:

- cuántos riesgos conecta;
- cuánto propaga;
- qué rutas sostiene;
- si actúa como puente;
- si es raíz de dependencia;
- si su falla fragmenta la estructura.

---

## Preguntas que el agente estructural debe poder responder

El agente debe estar diseñado para responder preguntas como estas:

- ¿Dónde la estructura del sistema está mal diseñada?
- ¿Qué elemento concentra mayor fragilidad?
- ¿Qué riesgo tiene mayor capacidad de propagación?
- ¿Qué control sostiene demasiada carga sistémica?
- ¿Dónde existen puntos únicos de falla?
- ¿Qué rutas podrían producir cascada?
- ¿Qué hard gates son críticos?
- ¿Qué intervención reduce más fragilidad total?
- ¿Qué pasaría si falla un control clave?
- ¿Qué tan resiliente es la estructura ante deterioro o remoción dirigida?
- ¿Estamos cerca de un punto de ruptura?

---

## Flujo de razonamiento obligatorio del agente

### Paso 1. Fijar el alcance

Determinar si el análisis aplica a:

- un reino completo;
- un subconjunto de elementos;
- un conjunto de riesgos;
- un grupo de controles;
- una cadena de prueba-evidencia;
- un escenario de simulación.

### Paso 2. Reconstruir la cadena mínima

El agente debe reconstruir siempre la trazabilidad:

**Reino → Elemento → Riesgo → Control → Prueba → Evidencia**

Si no puede reconstruirla, no debe afirmar conclusiones estructurales fuertes.

### Paso 3. Identificar nodos y relaciones críticas

Debe localizar:

- nodos de alta dependencia;
- nodos con baja redundancia;
- controles compartidos por múltiples riesgos;
- pruebas que validan varios controles;
- evidencias cuya invalidez derriba varias capas.

### Paso 4. Evaluar propagación

Debe estimar cómo una falla local afecta:

- otros riesgos;
- otros controles;
- otras pruebas;
- capacidad de defensa del reino.

### Paso 5. Evaluar concentración

Debe responder si la exposición está:

- distribuida;
- concentrada;
- acoplada;
- cerca de una discontinuidad.

### Paso 6. Priorizar intervención

Debe concluir no con “qué está peor” únicamente, sino con:

- qué corregir primero;
- qué blindar;
- qué desacoplar;
- dónde añadir redundancia;
- qué ruta de cascada conviene cortar.

---

## Matemática obligatoria del agente

El agente estructural debe incorporar explícitamente las matemáticas del sistema. No debe hablar de fragilidad estructural solo en lenguaje cualitativo.

## 1. Riesgo inherente por nodo o unidad base

Para cada unidad analizada, el agente puede partir de una exposición inherente base:

\[
R_i^{(0)} \in [0,1]
\]

Donde:

- \(R_i^{(0)}\) es la exposición inherente del nodo \(i\) antes de mitigación.

Esta exposición puede provenir de taxonomía, criterio experto o evaluación lineal previa.

---

## 2. Efectividad estructural del control

La efectividad estructural de un control no debe tratarse como un escalar arbitrario. Debe componerse por dimensiones.

Forma recomendada:

\[
C_j = D_j^{w_D} \cdot O_j^{w_O} \cdot P_j^{w_P} \cdot E_j^{w_E}
\]

Donde:

- \(C_j\) = efectividad estructural del control \(j\);
- \(D_j\) = diseño del control;
- \(O_j\) = operación real del control;
- \(P_j\) = fuerza o resultado de prueba;
- \(E_j\) = fuerza de evidencia;
- \(w_D,w_O,w_P,w_E\) = pesos de cada dimensión.

Restricciones:

\[
0 \le D_j,O_j,P_j,E_j \le 1
\]

\[
w_D,w_O,w_P,w_E > 0
\]

Interpretación:

si una dimensión crítica colapsa, la efectividad agregada del control cae de forma no compensatoria.

---

## 3. Mitigación de riesgo por controles

Si un riesgo \(r\) está mitigado por un conjunto de controles \(\mathcal{C}(r)\), una forma rigurosa de mitigación agregada es:

\[
M_r = 1 - \prod_{j \in \mathcal{C}(r)} (1 - \lambda_{jr} C_j)
\]

Donde:

- \(M_r\) = mitigación total del riesgo \(r\);
- \(\lambda_{jr}\) = fuerza de mitigación del control \(j\) sobre el riesgo \(r\);
- \(C_j\) = efectividad estructural del control \(j\).

Restricción:

\[
0 \le \lambda_{jr} C_j \le 1
\]

Esto evita sumas ingenuas y mantiene el efecto combinado sin permitir sobre-mitigación ficticia.

---

## 4. Riesgo residual del riesgo

Una forma base del riesgo residual por riesgo es:

\[
R_r = R_r^{(0)} (1 - M_r)
\]

Donde:

- \(R_r^{(0)}\) es el riesgo inherente del riesgo \(r\);
- \(M_r\) es la mitigación total.

---

## 5. Exposición base del elemento

Si un elemento \(e\) acumula varios riesgos, su exposición base puede definirse como:

\[
X_e = \sum_{r \in \mathcal{R}(e)} w_{er} R_r
\]

Donde:

- \(X_e\) = exposición base del elemento \(e\);
- \(w_{er}\) = peso estructural del riesgo \(r\) dentro del elemento \(e\).

---

## 6. Fragilidad estructural del elemento

La fragilidad no debe ser lineal. Debe capturar punto de quiebre.

Forma recomendada:

\[
F_e = \frac{1}{1 + e^{-k_e (X_e - \tau_e)}}
\]

Donde:

- \(F_e\) = fragilidad estructural del elemento \(e\);
- \(X_e\) = exposición del elemento;
- \(\tau_e\) = umbral de ruptura del elemento;
- \(k_e\) = pendiente o aceleración de la transición.

Interpretación:

- si \(X_e \ll \tau_e\), la fragilidad es baja;
- si \(X_e \approx \tau_e\), el sistema entra en zona crítica;
- si \(X_e \gg \tau_e\), la fragilidad se aproxima a 1.

---

## 7. Concentración estructural

La concentración no debe quedar fuera del modelo. Una forma correcta es usar un índice tipo Herfindahl sobre la distribución de fragilidad.

\[
H = \sum_{e=1}^{n} p_e^2
\]

con

\[
p_e = \frac{F_e}{\sum_{m=1}^{n} F_m}
\]

Donde:

- \(H\) mide concentración de fragilidad;
- valores altos implican que la exposición está acumulada en pocos nodos.

Ajuste por concentración:

\[
F_{conc} = F_{base}(1 + \alpha H)
\]

Donde:

- \(F_{base}\) es la fragilidad agregada base;
- \(\alpha\) es el parámetro de penalización por concentración.

---

## 8. Interdependencia sistémica

La exposición estructural no debe asumir independencia entre elementos.

Forma general:

\[
E_{sys} = \sum_{e=1}^{n} F_e + \beta \sum_{e=1}^{n} \sum_{m \ne e} M_{em} F_e F_m
\]

Donde:

- \(E_{sys}\) = exposición sistémica;
- \(M_{em}\) = matriz de dependencia o contagio entre elementos;
- \(\beta\) = intensidad de amplificación por interdependencia.

Interpretación:

cuando dos elementos frágiles están acoplados, la exposición total crece de forma no lineal.

---

## 9. Hard gates y gatillos no compensables

Si existe una condición crítica no compensable, debe modelarse como gatillo.

Forma simple:

\[
E_{final} = \max(E_{sys}, T)
\]

Donde:

- \(T\) es un umbral impuesto por un hard gate o condición crítica.

Esta forma tiene una propiedad importante: introduce una discontinuidad operativa. Mientras el gatillo esté activo, mejorar otras partes puede no reducir la exposición final.

---

## 10. Score ejecutivo estructural

El score final no debe ser lineal. Debe saturar al acercarse al colapso.

\[
S = 100(1 - e^{-\gamma E_{final}})
\]

Donde:

- \(S\) = score ejecutivo estructural;
- \(\gamma\) = parámetro de curvatura;
- \(E_{final}\) = exposición estructural final.

Propiedades:

- \(S(0)=0\)
- \(\lim_{E_{final}\to\infty} S = 100\)
- crecimiento rápido en zona media y saturación en zona alta.

---

## 11. Sensibilidad marginal

El agente debe poder priorizar matemáticamente. Para eso necesita pensar en derivadas marginales.

Cambio marginal del score respecto a una mejora en un control \(C_j\):

\[
\frac{\partial S}{\partial C_j} = \frac{dS}{dE_{final}} \cdot \frac{\partial E_{final}}{\partial C_j}
\]

Con:

\[
\frac{dS}{dE_{final}} = 100\gamma e^{-\gamma E_{final}}
\]

Interpretación:

esta derivada mide cuánto reduce el score estructural mejorar un control específico. Sirve para priorización de intervención con criterio matemático y no intuitivo.

---

## 12. Riesgo regulatorio esperado

Si se quiere proyectar la fragilidad hacia pérdida esperada, se puede extender el modelo a:

\[
R_{exp} = \sum_{u=1}^{m} p_u \cdot d_u \cdot s_u \cdot I_u
\]

Donde:

- \(p_u\) = probabilidad de incumplimiento o evento;
- \(d_u\) = probabilidad de detección;
- \(s_u\) = probabilidad de sanción efectiva;
- \(I_u\) = impacto económico o material.

Esto no reemplaza el score estructural. Es una capa posterior de traducción a pérdida esperada.

---

## 13. Modelo como grafo

El agente debe representar el sistema, conceptualmente, como un grafo dirigido:

\[
G = (V, E)
\]

Donde:

- \(V\) = conjunto de nodos;
- \(E\) = conjunto de aristas.

Con tipificación mínima:

\[
V = V_{Reino} \cup V_{Elemento} \cup V_{Riesgo} \cup V_{Control} \cup V_{Prueba} \cup V_{Evidencia}
\]

Este modelo permite definir:

- centralidad;
- betweenness;
- propagación;
- puentes;
- roots;
- redundancia;
- remoción dirigida;
- backbone mínimo.

---

## 14. Métricas estructurales que el agente debe comprender

Aunque aún no existan implementadas en base, el agente debe razonar con estas métricas como objetivos de diseño del sistema:

### Degree centrality

Cuántas conexiones directas tiene un nodo.

### Betweenness centrality

Cuántas rutas críticas pasan por un nodo. Detecta puentes.

### Eigenvector centrality

Importancia de un nodo por conexión con otros nodos importantes.

### Redundancy class

Clasificación de dependencia:

- sin dependencia;
- dependencia única;
- baja redundancia;
- redundante.

### Failure impact
n
Cuánto se degrada la estructura si un nodo falla o se elimina.

### Propagation reach

Cuántos otros nodos pueden verse afectados por la falla de un nodo.

### Hard gate coverage

Qué parte de la estructura depende de un hard gate.

---

## Simulación estructural

El agente debe poder razonar contrafácticamente.

### Simulación de mejora

¿Qué pasa si mejora un control?

### Simulación de deterioro

¿Qué pasa si una evidencia se invalida o una prueba se degrada?

### Simulación de remoción dirigida

¿Qué pasa si se elimina el control más crítico?

### Simulación de cascada

¿Qué nodos quedan afectados después de una primera falla?

### Monte Carlo

Si el sistema entra en capa probabilística avanzada, el agente puede tratar variables como distribuciones y no solo como puntos.

Ejemplo:

\[
C_j \sim \text{Beta}(a_j, b_j)
\]

Esto permite:

- intervalos de confianza;
- percentiles de exposición;
- sensibilidad bajo incertidumbre;
- stress testing regulatorio.

---

## Prioridad estructural

El agente no debe priorizar solo por severidad local. Debe priorizar combinando, como mínimo:

- fragilidad del nodo;
- capacidad de propagación;
- baja redundancia;
- rol de puente;
- condición de hard gate;
- alcance sobre otros riesgos;
- impacto marginal de la intervención.

Forma conceptual:

\[
Priority_i = f(F_i, Reach_i, Bridge_i, Redundancy_i, Gate_i, \Delta S_i)
\]

Donde:

- \(\Delta S_i\) es la reducción marginal esperada del score si se interviene el nodo \(i\).

---

## Lo que el agente nunca debe hacer

El agente nunca debe:

- convertir riesgo estructural en una matriz simple;
- asumir independencia entre nodos cuando no está justificada;
- promediar hard gates con controles ordinarios;
- tratar cobertura documental como resiliencia real;
- afirmar que existen vistas, tablas o consultas ya implementadas;
- confundir diseño futuro del sistema con estado actual de la base.

---

## Salida ideal del agente estructural

Toda respuesta del agente debería tender a producir este tipo de resultado:

1. reconstrucción de la cadena Reino → Elemento → Riesgo → Control → Prueba → Evidencia;
2. identificación de nodos críticos;
3. identificación de dependencias clave;
4. análisis de concentración;
5. estimación de propagación o cascada;
6. detección de hard gates o puntos únicos de falla;
7. priorización de intervención;
8. justificación matemática y estructural.

---

## Núcleo diferencial

Kiriox no debe modelar solo cuánto riesgo existe.

Debe modelar:

- cómo está armado el sistema;
- dónde concentra fragilidad;
- qué falla primero;
- qué activa colapso;
- qué intervención reduce más exposición total.

El agente estructural debe pensar exactamente así.
