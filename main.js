import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Scène, Caméra & Rendu ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lumières
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// --- Sol & Skybox (Exercice 1) ---

// 1. Skybox panoramique équirectangulaire généré par Canvas
const skyCanvas = document.createElement('canvas');
skyCanvas.width = 1024;
skyCanvas.height = 512;
const skyCtx = skyCanvas.getContext('2d');

// Dégradé vertical pour simuler le ciel et l'horizon
const skyGradient = skyCtx.createLinearGradient(0, 0, 0, 512);
skyGradient.addColorStop(0.0, '#1e528e'); // Zénith bleu profond
skyGradient.addColorStop(0.5, '#7ca9d6'); // Ciel dégagé
skyGradient.addColorStop(0.7, '#dceaf7'); // Horizon lumineux
skyGradient.addColorStop(1.0, '#4a6042'); // Terre / horizon lointain
skyCtx.fillStyle = skyGradient;
skyCtx.fillRect(0, 0, 1024, 512);

const skyTexture = new THREE.CanvasTexture(skyCanvas);
skyTexture.colorSpace = THREE.SRGBColorSpace;
skyTexture.mapping = THREE.EquirectangularReflectionMapping;
scene.background = skyTexture;
scene.environment = skyTexture;

// 2. Texture d'herbe procédurale avec motif et variations
const grassCanvas = document.createElement('canvas');
grassCanvas.width = 256;
grassCanvas.height = 256;
const grassCtx = grassCanvas.getContext('2d');

// Fond vert herbe
grassCtx.fillStyle = '#3a7d32';
grassCtx.fillRect(0, 0, 256, 256);

// Taches d'herbe variées (teintes claires et sombres)
for (let i = 0; i < 2000; i++) {
  const x = Math.random() * 256;
  const y = Math.random() * 256;
  const greenVariation = Math.floor(Math.random() * 60) - 30;
  grassCtx.fillStyle = `rgb(${50 + greenVariation}, ${130 + greenVariation}, ${45 + greenVariation})`;
  grassCtx.fillRect(x, y, 2, 4);
}

const grassTexture = new THREE.CanvasTexture(grassCanvas);
grassTexture.colorSpace = THREE.SRGBColorSpace;
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(20, 20);

// Grand plan horizontal pour le sol
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ map: grassTexture, roughness: 0.8 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// --- Joueur (Exercice 2) ---
const cubeSize = 2;
const playerGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff3333, roughness: 0.4 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);

// Base qui repose sur le sol
const groundY = cubeSize / 2;
player.position.set(0, groundY, 0);
scene.add(player);

// --- Gestion des Entrées Clavier ---
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  space: false
};

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key === 'w' || key === 'z') keys.w = true; // Support ZQSD / WASD
  if (key === 'a' || key === 'q') keys.a = true;
  if (key === 's') keys.s = true;
  if (key === 'd') keys.d = true;
  if (e.code === 'Space') keys.space = true;
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  if (key === 'w' || key === 'z') keys.w = false;
  if (key === 'a' || key === 'q') keys.a = false;
  if (key === 's') keys.s = false;
  if (key === 'd') keys.d = false;
  if (e.code === 'Space') keys.space = false;
});

// --- Paramètres Physiques & Déplacement ---
const velocity = new THREE.Vector3(0, 0, 0);
const acceleration = 40.0; // Vitesse de montée en régime
const friction = 5.0;      // Décélération au relâchement
const maxSpeed = 12.0;     // Vitesse horizontale max
const gravity = -30.0;     // Force de gravité
const jumpStrength = 12.0; // Impulsion de saut
let isGrounded = true;

const clock = new THREE.Clock();

// --- Boucle d'Animation ---
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  // Direction voulue par l'utilisateur
  const inputDirection = new THREE.Vector3();
  if (keys.w) inputDirection.z -= 1; // Avancer (vers -Z)
  if (keys.s) inputDirection.z += 1; // Reculer (vers +Z)
  if (keys.a) inputDirection.x -= 1; // Gauche (-X)
  if (keys.d) inputDirection.x += 1; // Droite (+X)

  if (inputDirection.lengthSq() > 0) {
    inputDirection.normalize();
  }

  if (inputDirection.lengthSq() > 0) {
    velocity.x += inputDirection.x * acceleration * delta;
    velocity.z += inputDirection.z * acceleration * delta;

    const currentSpeed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);
    if (currentSpeed > maxSpeed) {
      velocity.x = (velocity.x / currentSpeed) * maxSpeed;
      velocity.z = (velocity.z / currentSpeed) * maxSpeed;
    }
  } else {
    const damp = Math.exp(-friction * delta);
    velocity.x *= damp;
    velocity.z *= damp;

    if (Math.abs(velocity.x) < 0.01) velocity.x = 0;
    if (Math.abs(velocity.z) < 0.01) velocity.z = 0;
  }

  // Saut autorisé uniquement si le cube touche le sol
  if (keys.space && isGrounded) {
    velocity.y = jumpStrength;
    isGrounded = false;
  }

  // Gravité
  velocity.y += gravity * delta;

  // Mise à jour de la position du cube
  player.position.x += velocity.x * delta;
  player.position.y += velocity.y * delta;
  player.position.z += velocity.z * delta;

  // Collision avec le sol
  if (player.position.y <= groundY) {
    player.position.y = groundY;
    velocity.y = 0;
    isGrounded = true;
  }

  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();