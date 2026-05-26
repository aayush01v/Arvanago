#include "Weapon.h"

Weapon::Weapon() : name("Rusty Laser"), damage(10), price(0) {}

Weapon::Weapon(const std::string& name, int damage, int price)
    : name(name), damage(damage), price(price) {}

Weapon::Weapon(const Weapon& other)
    : name(other.name), damage(other.damage), price(other.price) {}

Weapon& Weapon::operator=(const Weapon& other) {
    if (this != &other) {
        name = other.name;
        damage = other.damage;
        price = other.price;
    }
    return *this;
}

bool Weapon::operator==(const Weapon& other) const {
    return name == other.name && damage == other.damage && price == other.price;
}

Weapon Weapon::operator+(const Weapon& other) const {
    return Weapon(name + " + " + other.name, damage + other.damage, price + other.price);
}

std::string Weapon::getName() const { return name; }
int Weapon::getDamage() const { return damage; }
int Weapon::getPrice() const { return price; }

std::ostream& operator<<(std::ostream& os, const Weapon& weapon) {
    os << weapon.name << " [DMG: " << weapon.damage << ", Price: " << weapon.price << "]";
    return os;
}
