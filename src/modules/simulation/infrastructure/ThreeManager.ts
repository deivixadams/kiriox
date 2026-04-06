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
  radius: number = 110; // Alejamos un poco más la cámara para ganar aire arriba
  clock: THREE.Clock;
  nodes: Record<string, NodeData> | null = null;
  animationId: number | null = null;
  materialCache: Record<string, THREE.MeshStandardMaterial> = {};
  edgeMaterialCache: Record<string, THREE.LineBasicMaterial> = {};
  cylinderGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 6);

  constructor(canvas: HTMLCanvasElement, toggleControl: (id: string) => void) {
    this.canvas = canvas;
    this.toggleControl = toggleControl;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#020617');
    this.scene.fog = new THREE.Fog('#020617', 60, 180);

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
    this.camera.position.x = this.radius * Math.sin(this.phi) * Math.sin(this.theta);
    this.camera.position.y = this.radius * Math.cos(this.phi);
    this.camera.position.z = this.radius * Math.sin(this.phi) * Math.cos(this.theta);
    // Miramos al centro del grupo desplazado
    this.camera.lookAt(15, -30, 0); // Miramos más abajo para que la parte superior del cluster no choque
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
      for (let i = 0; i < intersects.length; i++) {
        if (intersects[i].object.userData.isInteractive) {
          hoveredInteractive = true;
          break;
        }
      }
      document.body.style.cursor = hoveredInteractive ? 'pointer' : 'default';
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
        mesh.userData = { id: data.id, type: data.type, isInteractive: data.type === 'control' };
        this.group.add(mesh);
        this.nodeMeshes[data.id] = mesh;
      } else {
        this.nodeMeshes[data.id].material = material;
      }

      // --- LABELS FOR ELEMENTS ---
      if (data.type === 'element' && data.name) {
        if (!this.nodeLabels[data.id]) {
          const spriteMaterial = new THREE.SpriteMaterial({
            map: this.createLabelTexture(data.name),
            transparent: true,
            opacity: 0.9,
            depthTest: false // Render over everything
          });
          const sprite = new THREE.Sprite(spriteMaterial);
          sprite.scale.set(10, 4, 1); // Relación de aspecto del rectángulo
          // --- POSICIÓN HORIZONTAL ALEJADA ---
          const dirX = data.x === 0 && data.z === 0 ? 1 : data.x;
          const dirZ = data.z === 0 && data.x === 0 ? 0 : data.z;
          const mag = Math.sqrt(dirX * dirX + dirZ * dirZ);
          const offsetX = (dirX / mag) * 15; // Aumentado en 20%+ (de 12 a 15)
          const offsetZ = (dirZ / mag) * 15;

          sprite.position.set(data.x + offsetX, data.y, data.z + offsetZ);
          this.group.add(sprite);
          this.nodeLabels[data.id] = sprite;

          // --- LINEA DE CONEXIÓN HORIZONTAL ---
          const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
          const linePoints = [
            new THREE.Vector3(0, 0, 0), // Base del nodo
            new THREE.Vector3(offsetX, 0, offsetZ) // Hasta el sprite alejado
          ];
          const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
          const connectionLine = new THREE.Line(lineGeo, lineMat);
          connectionLine.position.set(data.x, data.y, data.z);
          this.group.add(connectionLine);
          this.nodeLabelLines[data.id] = connectionLine;
        } else {
          // ACTUALIZACIÓN DE POSICIÓN (Incluso si ya existen)
          const dirX = data.x === 0 && data.z === 0 ? 1 : data.x;
          const dirZ = data.z === 0 && data.x === 0 ? 0 : data.z;
          const mag = Math.sqrt(dirX * dirX + dirZ * dirZ);
          const offsetX = (dirX / mag) * 15; // Sincronizado a 15
          const offsetZ = (dirZ / mag) * 15;

          this.nodeLabels[data.id].position.set(data.x + offsetX, data.y, data.z + offsetZ);
          
          if (!this.nodeLabelLines[data.id]) {
            const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
            const linePoints = [
              new THREE.Vector3(0, 0, 0),
              new THREE.Vector3(offsetX, 0, offsetZ)
            ];
            const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
            const connectionLine = new THREE.Line(lineGeo, lineMat);
            this.group.add(connectionLine);
            this.nodeLabelLines[data.id] = connectionLine;
          }
          this.nodeLabelLines[data.id].position.set(data.x, data.y, data.z);
        }
      }
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
      if (source.type === 'control' && !source.active) return;

      let color = CONFIG.colors.edgeIdle;
      let opacity = 0.15;

      if (source.type === 'control' && source.active) {
        color = CONFIG.colors.edgeMitigation;
        opacity = 0.4;
      } else if (source.type === 'risk' && source.active) {
        color = CONFIG.colors.edgeImpact;
        opacity = 0.6;
      }

      if (source.type === 'risk' && target.type === 'element' && source.active) {
        const dist = new THREE.Vector3(source.x, source.y, source.z).distanceTo(new THREE.Vector3(target.x, target.y, target.z));
        const midPoint = new THREE.Vector3((source.x + target.x) / 2, (source.y + target.y) / 2, (source.z + target.z) / 2);
        
        const matKey = `thick_${color}_${opacity}`;
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
        cyl.scale.set(1, dist, 1);
        
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
          mesh.scale.lerp(new THREE.Vector3(0.001, 0.001, 0.001), 0.2);
        } else if (data.type === 'risk' && data.active) {
          const scale = 1 + Math.sin(elapsedTime * 4) * 0.15;
          mesh.scale.setScalar(scale);
        } else if (data.type === 'element' && data.stress > 0) {
          const scale = 1 + Math.sin(elapsedTime * 2 + data.x) * (data.stress * 0.2);
          mesh.scale.setScalar(scale);

          // EFECTO BLINK EN LABEL
          const label = this.nodeLabels[data.id];
          if (label) {
            const speed = 2 + data.stress * 6; // La velocidad escala con el estrés
            const pulse = 0.5 + Math.sin(elapsedTime * speed) * 0.5;
            // El color va de blanco/azul (normal) a Rojo intenso (alerta)
            const colorIntensity = Math.min(1, data.stress);
            label.material.color.setRGB(
              1, // Siempre rojo al máximo si hay estrés
              1 - (colorIntensity * pulse), // G se reduce -> más rojo
              1 - (colorIntensity * pulse)  // B se reduce -> más rojo
            );
            // La opacidad también pulsa si el riesgo es alto
            label.material.opacity = 0.7 + (pulse * 0.3 * colorIntensity);
          }
        } else {
          mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
          const label = this.nodeLabels[data.id];
          if (label) {
            label.material.color.setRGB(1, 1, 1);
            label.material.opacity = 0.8;
          }
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
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Fondo elegante (Glassmorphism oscuro)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    this.roundRect(ctx, 10, 60, 492, 136, 20, true, true);

    // Borde sutil
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Texto
    ctx.fillStyle = 'white';
    ctx.font = '700 48px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText(text.toUpperCase(), 256, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
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
