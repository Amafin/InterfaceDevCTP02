AFRAME.registerComponent('player-physics-movement', {
  schema: {
    speed: { type: 'number', default: 8 },
    jumpForce: { type: 'number', default: 6 }
  },

  init: function () {
    this.keys = {};
    this.isGrounded = false;

    // Écouteurs clavier (support WASD et ZQSD)
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

    // Détection de contact avec le sol via les collisions Cannon.js
    this.el.addEventListener('collide', (e) => {
      // Vérifie si la collision vient d'un objet en dessous
      const contact = e.detail.contact;
      if (contact) {
        this.isGrounded = true;
      }
    });

    // Configuration de la stabilité physique dès que le corps physique est prêt
    this.el.addEventListener('body-loaded', () => {
      const body = this.el.body;
      if (!body) return;

      // Réduire l'impact des collisions sur la rotation (Stabilité) :
      // 1. Amortissement angulaire quasi total
      body.angularDamping = 0.99;

      // 2. Verrouillage des axes X et Z pour empêcher le cube de basculer
      if (body.angularFactor) {
        body.angularFactor.set(0, 1, 0); // Autorise uniquement la rotation sur Y
      }
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

    // Déplacement fluide en modifiant la vitesse horizontale (X, Z)
    let moveX = 0;
    let moveZ = 0;

    if (this.keys.forward) moveZ -= 1;
    if (this.keys.backward) moveZ += 1;
    if (this.keys.left) moveX -= 1;
    if (this.keys.right) moveX += 1;

    // Normalisation diagonale
    const len = Math.hypot(moveX, moveZ);
    if (len > 0) {
      moveX = (moveX / len) * this.data.speed;
      moveZ = (moveZ / len) * this.data.speed;
    }

    // Application de la vitesse tout en conservant la vélocité Y (gravité / saut)
    body.velocity.x = moveX;
    body.velocity.z = moveZ;

    // Sécurité supplémentaire anti-bascule : remise à zéro des vitesses de rotation sur X et Z
    body.angularVelocity.x = 0;
    body.angularVelocity.z = 0;
  }
});