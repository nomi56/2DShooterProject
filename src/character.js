/**
 * Base class for all game characters (player and enemies).
 *
 * Provides:
 *   - Position and size (x, y, width, height)
 *   - Health system (hp, maxHp, dead)
 *   - Score value
 *   - Default centered AABB via getBounds()
 *   - Default hit(power) that reduces hp and sets dead
 *
 * Subclasses must implement:
 *   - update(bullets, dt)
 *   - draw(ctx)
 */
export class Character {
  constructor(x, y, width, height, hp) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.hp = hp;
    this.maxHp = hp;
    this.dead = false;
    this.score = 0;
  }

  /** Centered AABB. Override for a tighter or offset hitbox. */
  getBounds() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      w: this.width,
      h: this.height,
    };
  }

  /** Reduce hp by power; mark dead when hp reaches 0. */
  hit(power) {
    this.hp = Math.max(0, this.hp - power);
    if (this.hp <= 0) this.dead = true;
  }
}
