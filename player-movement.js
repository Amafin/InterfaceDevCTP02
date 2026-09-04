// --- Composant 1 : Déplacement physique et stabilité absolue du cube ---
AFRAME.registerComponent('player-physics-movement', {
  schema: {
    speed: { type: 'number', default: 8 },
    jumpForce: { type: 'number', default: 7 }
  },

  init: function () {
    this.keys = {};
    this.isGrounded = false;

    // Écouteurs clavier (ZQSD / WASD + Espace)
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'z') this.keys.forward = true;
      if (key === 's') this.keys.backward = true;
      if (key === 'a' || key === 'q') this.keys.left = true;
      if (key === 'd') this.keys.right = true;
      if (e.code === 'Space') {
        this.jump();
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'z') this.keys.forward = false;
      if (key === 's') this.keys.backward = false;
      if (key === 'a' || key === 'q') this.keys.left = false;
      if (key === 'd') this.keys.right = false;
    });

    // Détection d'atterrissage sur le sol
    this.el.addEventListener('collide', (e) => {
      const contact = e.detail.contact;
      if (contact) {
        this.isGrounded = true;
      }
    });

    // Verrouillage STRICT des rotations physiques lors des chocs
    this.el.addEventListener('body-loaded', () => {
      const body = this.el.body;
      if (!body) return;

      // 1. Bloque toute rotation sur tous les axes (X, Y, Z)
      body.fixedRotation = true;
      body.updateMassProperties();

      if (body.angularFactor) {
        body.angularFactor.set(0, 0, 0);
      }
      body.angularDamping = 1.0;
    });
  },

  jump: function () {
    if (this.isGrounded && this.el.body) {
      this.el.body.velocity.y = this.data.jumpForce;
      this.isGrounded = false;
    }
  },

  tick: function () {
    const body = this.el.body;
    if (!body) return;

    // Déplacement WASD / ZQSD
    let moveX = 0;
    let moveZ = 0;

    if (this.keys.forward) moveZ -= 1;
    if (this.keys.backward) moveZ += 1;
    if (this.keys.left) moveX -= 1;
    if (this.keys.right) moveX += 1;

    // Normalisation de la vitesse
    const len = Math.hypot(moveX, moveZ);
    if (len > 0) {
      moveX = (moveX / len) * this.data.speed;
      moveZ = (moveZ / len) * this.data.speed;
    }

    body.velocity.x = moveX;
    body.velocity.z = moveZ;

    // Annule toute vitesse angulaire parasite lors d'un choc
    body.angularVelocity.set(0, 0, 0);

    // Maintient le cube parfaitement orienté sans aucune rotation
    body.quaternion.set(0, 0, 0, 1);
  }
});

// --- Composant 2 : Suivi caméra rigide (maintient distance et hauteur constantes) ---
AFRAME.registerComponent('camera-follow', {
  schema: {
    target: { type: 'selector' },
    offsetX: { type: 'number', default: 0 },
    offsetY: { type: 'number', default: 6 },
    offsetZ: { type: 'number', default: 12 }
  },

  tick: function () {
    if (!this.data.target) return;

    // Récupération de la position du cube
    const targetPos = this.data.target.object3D.position;

    // La caméra se place exactement à la même distance horizontale
    // et garde sa hauteur fixe (sans s'abaisser ni monter)
    this.el.object3D.position.set(
      targetPos.x + this.data.offsetX,
      this.data.offsetY,
      targetPos.z + this.data.offsetZ
    );
  }
});