#ifndef WEAPON_H
#define WEAPON_H

#include <string>
#include <iostream>

class Weapon {
private:
    std::string name;
    int damage;
    int price;

public:
    Weapon();
    Weapon(const std::string& name, int damage, int price);
    Weapon(const Weapon& other);

    Weapon& operator=(const Weapon& other);
    bool operator==(const Weapon& other) const;
    Weapon operator+(const Weapon& other) const;

    std::string getName() const;
    int getDamage() const;
    int getPrice() const;

    friend std::ostream& operator<<(std::ostream& os, const Weapon& weapon);
};

#endif
