#include "Enemy.h"
#include "Player.h"

int Enemy::totalEnemiesCreated = 0;

Enemy::Enemy(const std::string& type, int health, int damage, int rewardScrap, const Vec2& pos)
    : GameObject(pos), type(type), health(health), damage(damage), rewardScrap(rewardScrap) {
    ++totalEnemiesCreated;
}

Enemy::Enemy(const Enemy& other)
    : GameObject(other.position), type(other.type), health(other.health), damage(other.damage), rewardScrap(other.rewardScrap) {
    ++totalEnemiesCreated;
}

void Enemy::display() const {
    std::cout << type << " at " << position << " HP: " << health << " DMG: " << damage << "\n";
}

void Enemy::takeDamage(int amount) { health -= amount; }
bool Enemy::isDead() const { return health <= 0; }
int Enemy::getRewardScrap() const { return rewardScrap; }

Enemy::~Enemy() {
    std::cout << "Enemy destructor called for " << type << "\n";
}

NormalEnemy::NormalEnemy() : Enemy("NormalEnemy", 60, 12, 20, Vec2(1, 1)) {}
FastEnemy::FastEnemy() : Enemy("FastEnemy", 45, 18, 25, Vec2(2, 1)) {}
TankEnemy::TankEnemy() : Enemy("TankEnemy", 100, 10, 35, Vec2(0, 2)) {}
BossEnemy::BossEnemy() : Enemy("BossEnemy", 180, 25, 80, Vec2(3, 3)) {}

void NormalEnemy::attack(Player& player) { player.takeDamage(damage); }
void FastEnemy::attack(Player& player) { player.takeDamage(damage + 4); }
void TankEnemy::attack(Player& player) { player.takeDamage(damage); }
void BossEnemy::attack(Player& player) { player.takeDamage(damage + 8); }

void NormalEnemy::update() { position = position + Vec2(1, 0); }
void FastEnemy::update() { position = position + Vec2(2, 0); }
void TankEnemy::update() { position = position + Vec2(0, 1); }
void BossEnemy::update() { position = position + Vec2(1, 1); }

int BossEnemy::bonusReward() const { return 50; }
