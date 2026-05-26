#include "Shop.h"
#include <iostream>

Shop::Shop() {
    availableWeapons[0] = Weapon("Ion Rifle", 22, 30);
    availableWeapons[1] = Weapon("Nova Shot", 30, 50);
    availableWeapons[2] = Weapon("Quantum Lance", 45, 80);
}

void Shop::showItems() const {
    std::cout << "=== Shop Weapons ===\n";
    for (int i = 0; i < 3; ++i) {
        std::cout << i << ". " << availableWeapons[i] << "\n";
    }
}

void Shop::buyWeapon(Player& player) {
    showItems();
    std::cout << "Choose weapon index (0-2): ";
    int choice;
    std::cin >> choice;

    if (choice < 0 || choice > 2) {
        std::cout << "Invalid choice.\n";
        return;
    }

    Weapon selected = availableWeapons[choice];
    if (player.getScrap() < selected.getPrice()) {
        std::cout << "Not enough scrap.\n";
        return;
    }

    player.spendScrap(selected.getPrice());
    player.setWeapon(0, selected);
    std::cout << "Bought and equipped: " << selected << "\n";
}

void Shop::upgradePlayerFuel(Player& player) {
    const int cost = 25;
    if (player.getScrap() < cost) {
        std::cout << "Not enough scrap to upgrade fuel.\n";
        return;
    }
    player.spendScrap(cost);
    player.setFuel(player.getFuel() + 20);
    std::cout << "Fuel upgraded by 20.\n";
}
