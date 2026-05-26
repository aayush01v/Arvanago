#ifndef SHOP_H
#define SHOP_H

#include "Weapon.h"
#include "Player.h"

class Shop {
private:
    Weapon availableWeapons[3];

public:
    Shop();
    void showItems() const;
    void buyWeapon(Player& player);
    void upgradePlayerFuel(Player& player);
};

#endif
