import * as THREE from 'three';
import { NodeData, EdgeData, CONFIG } from '../domain/AnalyticsEngine';

export class ThreeManager {
  canvas: HTMLCanvasElement;
  toggleControl: (id: string) => void;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  group: THREE.Group;
  nodeMeshes: Record<string, THREE.Mesh> = {};
  edgeLines: THREE.Object3D[] = [];
  planeMesh: THREE.Mesh | null = null;
  originalPlanePositions: Float32Array | null = null;
  nodeLabels: Record<string, THREE.Sprite> = {};
  nodeLabelLines: Record<string, THREE.Line> = {};
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
  isDragging: boolean = false;
  previousMousePosition: { x: number; y: number } = { x: 0, y: 0 };
  dragStartPosition: { x: number; y: number } = { x: 0, y: 0 };
  theta: number = Math.PI / 4;
  phi: number = Math.PI / 3;
  radius: number = 115;   // Acercar la cámara para mayor prominencia de los nodos
  clock: THREE.Clock;
  nodes: Record<string, NodeData> | null = null;
  animationId: number | null = null;
  materialCache: Record<string, THREE.MeshStandardMaterial> = {};
  edgeMaterialCache: Record<string, THREE.LineBasicMaterial> = {};
  cylinderGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 6);
  onHover?: (name: string | null, x: number, y: number) => void;

  constructor(canvas: HTMLCanvasElement, toggleControl: (id: string) => void, onHover?: (name: string | null, x: number, y: number) => void) {
    this.canvas = canvas;
    this.toggleControl = toggleControl;
    this.onHover = onHover;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#020617');
    this.scene.fog = new THREE.Fog('#020617', 100, 300); // Niebla ajustada a la nueva escala

    const aspect = canvas.clientWidth / canvas.clientHeight || 1;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const pointLight = new THREE.PointLight(0xffffff, 1.8);
    pointLight.position.set(0, 70, 0);
    this.scene.add(pointLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(30, 50, 30);
    this.scene.add(dirLight);

    this.group = new THREE.Group();
    // Centrado dinámico: movemos el grupo a la derecha para que no lo tape el dashboard
    this.group.position.set(15, -25, 0); // Bajamos el grupo para que los controles verdes no choquen arriba
    this.scene.add(this.group);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();

    this.initInteraction();
    this.animate = this.animate.bind(this);
    this.animate();
  }

  updateCamera() {
    // Calculamos la órbita anclándola al offset X=15 del clúster, de modo que la distancia al centro es CONSTANTE.
    this.camera.position.x = 15 + this.radius * Math.sin(this.phi) * Math.sin(this.theta);
    this.camera.position.y = this.radius * Math.cos(this.phi);
    this.camera.position.z = this.radius * Math.sin(this.phi) * Math.cos(this.theta);
    
    // Miramos al centro del grupo desplazado permanentemente
    this.camera.lookAt(15, -30, 0); 
  }

  initInteraction() {
    const handleMouseDown = (e: MouseEvent) => {
      this.isDragging = true;
      this.dragStartPosition = { x: e.clientX, y: e.clientY };
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (this.isDragging) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;
        this.theta -= deltaX * 0.007;
        this.phi -= deltaY * 0.007;
        this.phi = Math.max(0.1, Math.min(Math.PI / 2.1, this.phi));
        this.updateCamera();
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }

      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.group.children);
      
      let hoveredInteractive = false;
      let hoveredName: string | null = null;
      let hoverX = 0, hoverY = 0;

      for (let i = 0; i < intersects.length; i++) {
        const obj = intersects[i].object;
        if (obj.userData.isInteractive) {
          hoveredInteractive = true;
          hoveredName = obj.userData.name || 'Unknown Control';
          
          // Calcular posición 2D
          const vec = obj.position.clone();
          vec.project(this.camera);
          hoverX = (vec.x * .5 + .5) * rect.width + rect.left;
          hoverY = -(vec.y * .5 - .5) * rect.height + rect.top;
          break;
        }
      }
      
      document.body.style.cursor = hoveredInteractive ? 'pointer' : 'default';
      if (this.onHover) this.onHover(hoveredName, hoverX, hoverY);
    };

    const handleMouseUp = () => {
      this.isDragging = false;
    };

    const handleClick = (e: MouseEvent) => {
      if (Math.abs(e.clientX - this.dragStartPosition.x) > 5 || Math.abs(e.clientY - this.dragStartPosition.y) > 5) {
        return; 
      }
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.group.children);
      for (let i = 0; i < intersects.length; i++) {
        const obj = intersects[i].object;
        if (obj.userData.isInteractive) {
          this.toggleControl(obj.userData.id);
          break;
        }
      }
    };

    this.canvas.addEventListener('mousedown', handleMouseDown);
    this.canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    this.canvas.addEventListener('click', handleClick);

    this.updateCamera();
  }

  getMaterial(colorStr: string, emissiveIntensity: number) {
    const key = `${colorStr}_${emissiveIntensity}`;
    if (!this.materialCache[key]) {
      this.materialCache[key] = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorStr),
        emissive: new THREE.Color(colorStr),
        emissiveIntensity: emissiveIntensity,
        roughness: 0.2,
        metalness: 0.8
      });
    }
    return this.materialCache[key];
  }

  updateData(nodes: Record<string, NodeData>, edges: EdgeData[]) {
    // 1. Cleanup old nodes/labels/lines that are not in the new dataset
    Object.keys(this.nodeMeshes).forEach(id => {
      if (!nodes[id]) {
        this.group.remove(this.nodeMeshes[id]);
        delete this.nodeMeshes[id];
        
        if (this.nodeLabels[id]) {
          this.group.remove(this.nodeLabels[id]);
          delete this.nodeLabels[id];
        }
        
        if (this.nodeLabelLines[id]) {
          this.group.remove(this.nodeLabelLines[id]);
          delete this.nodeLabelLines[id];
        }
      }
    });

    this.nodes = nodes;

    Object.values(nodes).forEach(data => {
      let colorObj = CONFIG.colors.element;
      if (data.type === 'control') colorObj = data.active ? CONFIG.colors.control : CONFIG.colors.controlFailed;
      if (data.type === 'risk') colorObj = data.active ? CONFIG.colors.risk : CONFIG.colors.riskMitigated;
      if (data.type === 'element') colorObj = data.stress > 0.5 ? CONFIG.colors.elementStressed : CONFIG.colors.element;
      
      const emissiveInt = data.active || data.stress > 0 ? 0.8 : 0.2;
      const material = this.getMaterial(colorObj.getStyle(), emissiveInt);

      if (!this.nodeMeshes[data.id]) {
        let geometry;
        if (data.type === 'element') {
          geometry = new THREE.TetrahedronGeometry(1.2);
        } else if (data.type === 'risk') {
          geometry = new THREE.OctahedronGeometry(1.2);
        } else {
          geometry = new THREE.SphereGeometry(1, 16, 16);
        }
        const mesh = new THREE.Mesh(geometry, material);
        
        if (data.type === 'element') {
          mesh.rotation.x = Math.PI / 4;
          mesh.rotation.y = Math.PI / 4;
        } else if (data.type === 'risk') {
          mesh.rotation.z = Math.PI / 4;
        }
        
        mesh.position.set(data.x, data.y, data.z);
        mesh.userData = { 
          id: data.id, 
          name: data.name, 
          type: data.type, 
          isInteractive: data.type === 'control' 
        };
        this.group.add(mesh);
        this.nodeMeshes[data.id] = mesh;
      } else {
        this.nodeMeshes[data.id].material = material;
        this.nodeMeshes[data.id].userData.name = data.name;
      }

      // --- ESCALA BASADA EN IMPACTO REAL ---
      const mesh = this.nodeMeshes[data.id];
      const baseScale = 1.0 + (data.failure_impact_score || 0) * 0.4; // Hasta 40% más grande según impacto
      mesh.scale.setScalar(baseScale);
      mesh.position.set(data.x, data.y, data.z);

      // (Lógica de Labels eliminada para restaurar diseño de tetraedros amarillos)
    });

    this.edgeLines.forEach(line => {
      this.group.remove(line);
      if ((line as any).geometry) (line as any).geometry.dispose();
    });
    this.edgeLines = [];

    edges.forEach(edge => {
      const source = nodes[edge.source];
      const target = nodes[edge.target];
      if (!source || !target) return;

      const controlNode = source.type === 'control' ? source : (target.type === 'control' ? target : null);
      if (controlNode && !controlNode.active) return; // Si el control muere, las líneas que lo conectan deben desaparecer

      let color = CONFIG.colors.edgeIdle;
      let opacity = 0.15;

      if (controlNode && controlNode.active) {
        color = CONFIG.colors.edgeMitigation;
        opacity = 0.4;
      } else if ((source.type === 'risk' && source.active) || (target.type === 'risk' && target.active)) {
        color = CONFIG.colors.edgeImpact;
        opacity = 0.6;
      }

      const riskNode = source.type === 'risk' ? source : (target.type === 'risk' ? target : null);
      const elementNode = source.type === 'element' ? source : (target.type === 'element' ? target : null);
      const isRiskToElement = riskNode !== null && elementNode !== null;

      if (isRiskToElement && riskNode!.active) {
        const dist = new THREE.Vector3(source.x, source.y, source.z).distanceTo(new THREE.Vector3(target.x, target.y, target.z));
        const midPoint = new THREE.Vector3((source.x + target.x) / 2, (source.y + target.y) / 2, (source.z + target.z) / 2);
        
        const matKey = `thin_cyl_${color}_${opacity}`;
        if (!this.materialCache[matKey]) {
          this.materialCache[matKey] = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            emissive: new THREE.Color(color),
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.8
          });
        }
        
        const cyl = new THREE.Mesh(this.cylinderGeo, this.materialCache[matKey]);
        cyl.position.copy(midPoint);
        const direction = new THREE.Vector3().subVectors(new THREE.Vector3(target.x, target.y, target.z), new THREE.Vector3(source.x, source.y, source.z));
        cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
        
        // Aumenta el grosor dinámicamente si el riesgo pierde controles asociados (incremento de hasta +150%)
        const baseThickness = 0.25;
        const thickness = baseThickness * (1 + ((riskNode!.stress || 0) * 1.5)); 
        cyl.scale.set(thickness, dist, thickness);
        
        this.group.add(cyl);
        this.edgeLines.push(cyl);
      } else {
        const matKey = `${color}_${opacity}`;
        if (!this.edgeMaterialCache[matKey]) {
          this.edgeMaterialCache[matKey] = new THREE.LineBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: opacity
          });
        }

        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(source.x, source.y, source.z),
          new THREE.Vector3(target.x, target.y, target.z)
        ]);
        const line = new THREE.Line(geometry, this.edgeMaterialCache[matKey]);
        this.group.add(line);
        this.edgeLines.push(line);
      }
    });

    if (!this.planeMesh) {
      const planeGeo = new THREE.PlaneGeometry(120, 120, 80, 80);
      const planeMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
        emissive: 0x3b82f6,
        emissiveIntensity: 0.2
      });
      this.planeMesh = new THREE.Mesh(planeGeo, planeMat);
      this.planeMesh.position.set(0, -5, 0);
      this.planeMesh.rotation.x = -Math.PI / 2;
      this.group.add(this.planeMesh);
      this.originalPlanePositions = new Float32Array(planeGeo.attributes.position.array);
    }

    const positions = (this.planeMesh.geometry.attributes.position as THREE.BufferAttribute);
    const elements = Object.values(nodes).filter(n => n.type === 'element' && n.stress > 0);

    for (let i = 0; i < positions.count; i++) {
      const localX = this.originalPlanePositions![i * 3];
      const localY = this.originalPlanePositions![i * 3 + 1];
      const globalX = localX;
      const globalZ = -localY;

      let localStress = 0;
      for (const el of elements) {
        const dx = el.x - globalX;
        const dz = el.z - globalZ;
        const distSq = dx * dx + dz * dz;
        if (distSq < 400) {
          localStress += (el.stress * 4) * Math.exp(-distSq / 80);
        }
      }
      positions.setZ(i, -localStress);
    }
    positions.needsUpdate = true;
    this.planeMesh.geometry.computeVertexNormals();
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate);
    const elapsedTime = this.clock.getElapsedTime();

    if (!this.isDragging) {
      this.theta += 0.001;
      this.updateCamera();
    }

    if (this.nodes) {
      Object.values(this.nodes).forEach(data => {
        const mesh = this.nodeMeshes[data.id];
        if (!mesh) return;
        
        if (data.type === 'control' && !data.active) {
          mesh.scale.setScalar(0.001);
        } else if (data.type === 'risk' && data.active) {
          mesh.scale.setScalar(1.2);
        } else if (data.type === 'element' && data.stress > 0) {
          const scale = 1 + (data.stress * 0.2);
          mesh.scale.setScalar(scale);
        } else {
          mesh.scale.setScalar(1);
        }
      });
    }

    this.renderer.render(this.scene, this.camera);
  }

  cleanup() {
    if (this.animationId !== null) cancelAnimationFrame(this.animationId);
    this.renderer.dispose();
  }

  createLabelTexture(text: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; // Ampliamos el canvas enormemente para que quepa cualquier letra larga
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Se eliminó el fondo (roundRect) y el borde para dejar el texto limpio flotando sobre la escena

    // Texto
    ctx.font = '700 48px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Configuración de sombreado
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 10;
    
    // Truncar texto si es muy largo (ahora podemos usar más de 40 caracteres!)
    let displayText = text.toUpperCase();
    if (displayText.length > 35) {
      displayText = displayText.substring(0, 33) + '...';
    }

    // Dibujar CONTORNO negro para máximo contraste en el CENTRO del nuevo canvas (512x128)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.strokeText(displayText, 512, 128);

    // Dibujar RELLENO blanco (deshabilitando sombra para el relleno interno)
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'white';
    ctx.fillText(displayText, 512, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }

  roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: boolean, stroke: boolean) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }
}
