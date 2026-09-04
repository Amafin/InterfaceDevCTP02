import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 1. Initialisation de la scène, caméra et rendu
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

// Contrôles pour explorer la scène à la souris
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Gestion des lumières
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

const textureLoader = new THREE.TextureLoader();

// 2. Skybox (Image panoramique équirectangulaire)
textureLoader.load('textures/skybox.png', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = texture;
  scene.environment = texture; // Éclaire la scène avec les teintes du ciel
});

// 3. Plan horizontal texturé (Sol en herbe)
const grassTexture = textureLoader.load('textures/grass.png');
// Répétition de la texture pour éviter qu'elle soit trop étirée
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(20, 20);

// Grand plan (ex: 100x100 unités)
const planeGeometry = new THREE.PlaneGeometry(100, 100);
const planeMaterial = new THREE.MeshStandardMaterial({ 
  map: grassTexture,
  roughness: 0.8 
});

const ground = new THREE.Mesh(planeGeometry, planeMaterial);
// Rotation obligatoire : PlaneGeometry est vertical par défaut (plan XY)
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// 4. Redimensionnement dynamique de la fenêtre
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 5. Boucle d'animation
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();