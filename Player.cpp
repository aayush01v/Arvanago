#include "Player.h"
#include "Enemy.h"

int Player::totalPlayersCreated = 0;

Player::Player() : name("Pilot"), health(120), fuel(100), scrap(50) {
    inventory[0] = Weapon("Rusty Laser", 10, 0);
    inventory[1] = Weapon("Pulse Gun", 20, 40);
    inventory[2] = Weapon("Plasma Cannon", 35, 75);
    ++totalPlayersCreated;
}

Player::Player(const std::string& name, int health, int fuel, int scrap)
    : name(name), health(health), fuel(fuel), scrap(scrap) {
    inventory[0] = Weapon("Starter Blaster", 15, 0);
    inventory[1] = Weapon("Pulse Gun", 20, 40);
    inventory[2] = Weapon("Plasma Cannon", 35, 75);
    ++totalPlayersCreated;
}

Player::Player(const Player& other)
    : name(other.name), health(other.health), fuel(other.fuel), scrap(other.scrap) {
    for (int i = 0; i < 3; ++i) inventory[i] = other.inventory[i];
    ++totalPlayersCreated;
}

Player::~Player() {
    std::cout << "Player destructor called for " << name << "\n";
}

Player& Player::operator=(const Player& other) {
    if (this != &other) {
        name = other.name;
        health = other.health;
        fuel = other.fuel;
        scrap = other.scrap;
        for (int i = 0; i < 3; ++i) inventory[i] = other.inventory[i];
    }
    return *this;
}

void Player::setName(const std::string& name) {
    this->name = name; // this pointer demonstration
}

std::string Player::getName() const { return name; }
int Player::getHealth() const { return health; }
int Player::getFuel() const { return fuel; }
int Player::getScrap() const { return scrap; }
Weapon Player::getWeapon(int index) const { return inventory[index]; }

void Player::setFuel(int newFuel) { fuel = newFuel; }
void Player::spendScrap(int amount) { scrap -= amount; }
void Player::setWeapon(int index, const Weapon& weapon) { inventory[index] = weapon; }

void Player::heal() { health += 10; }
void Player::heal(int amount) { health += amount; }

void Player::attack(Enemy& enemy) {
    enemy.takeDamage(inventory[0].getDamage());
}

void Player::takeDamage(int amount) { health -= amount; }
void Player::addScrap(int amount) { scrap += amount; }
bool Player::isDead() const { return health <= 0; }

void Player::display() const {
    std::cout << "Player: " << name << " | HP: " << health << " | Fuel: " << fuel << " | Scrap: " << scrap << "\n";
    std::cout << "Weapons:\n";
    for (int i = 0; i < 3; ++i) std::cout << "  Slot " << i << ": " << inventory[i] << "\n";
}

void showSecretPlayerData(const Player& player) {
    std::cout << "[Friend Access] Secret data => Name: " << player.name
              << ", HP: " << player.health
              << ", Fuel: " << player.fuel
              << ", Scrap: " << player.scrap << "\n";
}
