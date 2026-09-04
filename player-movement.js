// --- Suivi de position pour la caméra (évite tout conflit clavier) ---
AFRAME.registerComponent('camera-rig-follow', {
  schema: {
    target: { type: 'selector' }
  },
  tick: function () {
    if (!this.data.target) return;
    const targetPos = this.data.target.object3D.position;
    // Le rig se place exactement aux coordonnées du cube
    this.el.object3D.position.set(targetPos.x, targetPos.y, targetPos.z);
  }
});

// --- Déplacement physique du cube ---
AFRAME.registerComponent('player-physics-movement', {
  schema: {
    speed: { type: 'number', default: 8 },
    jumpForce: { type: 'number', default: 8 }
  },

  init: function () {
    this.keys = {};
    this.isGrounded = false;

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

    // Contact sol
    this.el.addEventListener('collide', (e) => {
      const contact = e.detail.contact;
      if (contact) {
        const normal = contact.ni;
        if (Math.abs(normal.y) > 0.5) {
          this.isGrounded = true;
        }
      }
    });

    // Stabilité physique
    this.el.addEventListener('body-loaded', () => {
      const body = this.el.body;
      if (!body) return;

      body.fixedRotation = true;
      body.updateMassProperties();

      if (body.angularFactor) {
        body.angularFactor.set(0, 0, 0);
      }
      body.angularDamping = 1.0;
      body.material.friction = 0.0;
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

    let moveX = 0;
    let moveZ = 0;

    if (this.keys.forward) moveZ -= 1;
    if (this.keys.backward) moveZ += 1;
    if (this.keys.left) moveX -= 1;
    if (this.keys.right) moveX += 1;

    const len = Math.hypot(moveX, moveZ);
    if (len > 0) {
      moveX = (moveX / len) * this.data.speed;
      moveZ = (moveZ / len) * this.data.speed;
    }

    body.velocity.x = moveX;
    body.velocity.z = moveZ;

    // Verrouillage rigide du cube
    body.angularVelocity.set(0, 0, 0);
    body.quaternion.set(0, 0, 0, 1);
  }
});