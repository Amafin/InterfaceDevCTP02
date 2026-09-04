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

/*
// --- Sol & Skybox (Exercice 1) ---
const textureLoader = new THREE.TextureLoader();
textureLoader.load(
  'textures/skybox.png',
  (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.environment = texture;
  },
  undefined,
  (err) => console.error('Erreur chargement skybox.png :', err)
);

const grassTexture = textureLoader.load(
  'textures/grass.png',
  (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
  },
  undefined,
  (err) => console.error('Erreur chargement grass.png :', err)
);
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(20, 20);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ map: grassTexture, roughness: 0.8 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);
*/

// --- Sol & Skybox (Exercice 1) ---
const textureLoader = new THREE.TextureLoader();

// Test avec une skybox en ligne (panoramique)
textureLoader.load(
  'https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr', // ou jpg équivalent
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.environment = texture;
  },
  undefined,
  () => {
    // Fallback image panoramique standard si HDR non supporté directement
    textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/2294472375_24a3b8ef46_o.jpg', (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      scene.background = tex;
      scene.environment = tex;
    });
  }
);

// Test avec une texture d'herbe en ligne
const grassTexture = textureLoader.load(
  'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/terrain/grasslight-big.jpg',
  (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
  }
);
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(20, 20);

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