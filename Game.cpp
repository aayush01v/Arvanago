#include "Game.h"
#include "Enemy.h"
#include "SaveSystem.h"
#include "GameException.h"
#include <iostream>
#include <cstdlib>
#include <ctime>

Game::Game() : player("Commander", 130, 120, 70), running(true) {
    std::srand(static_cast<unsigned>(std::time(nullptr)));
}

void Game::startBattle() {
    // Dynamic allocation using new: enemy type is decided at runtime.
    Enemy* enemy = nullptr; // pointer to object
    int roll = std::rand() % 4;
    if (roll == 0) enemy = new NormalEnemy();
    else if (roll == 1) enemy = new FastEnemy();
    else if (roll == 2) enemy = new TankEnemy();
    else enemy = new BossEnemy();

    std::cout << "A battle begins!\n";
    enemy->display();

    while (!enemy->isDead() && !player.isDead()) {
        // Early binding example: direct call resolved at compile-time.
        player.attack(*enemy);

        if (enemy->isDead()) {
            int reward = enemy->getRewardScrap();
            if (BossEnemy* boss = dynamic_cast<BossEnemy*>(enemy)) {
                reward += boss->bonusReward();
            }
            player.addScrap(reward);
            std::cout << "Enemy defeated! Scrap gained: " << reward << "\n";
            break;
        }

        // Late binding (runtime polymorphism): virtual call via base pointer.
        enemy->attack(player);
        enemy->update();
        std::cout << "You attacked and enemy counterattacked.\n";
        player.display();
        enemy->display();
    }

    // Dynamic deallocation using delete.
    delete enemy;
}

void Game::visitShop() {
    std::cout << "1. Buy Weapon\n2. Upgrade Fuel\nChoice: ";
    int c;
    std::cin >> c;
    if (c == 1) shop.buyWeapon(player);
    else if (c == 2) shop.upgradePlayerFuel(player);
}

void Game::showStats() const {
    player.display();
    std::cout << "Total players created: " << Player::totalPlayersCreated << "\n";
    std::cout << "Total enemies created: " << Enemy::totalEnemiesCreated << "\n";
}

void Game::demonstrateCopyConstructor() {
    // Copy constructor demonstration.
    Player copyPlayer(player);
    std::cout << "Copied player data:\n";
    copyPlayer.display();
}

void Game::demonstrateOperatorOverloading() {
    // Operator overloading demonstration.
    Weapon w1("Photon", 20, 30);
    Weapon w2("Rail", 15, 25);
    Weapon merged = w1 + w2;
    std::cout << "Merged weapon: " << merged << "\n";
    std::cout << "Equality check (w1 == w2): " << (w1 == w2 ? "true" : "false") << "\n";

    Vec2 a(1, 2), b(3, 4);
    std::cout << "Vec2 sum: " << (a + b) << "\n";
}

void Game::demonstrateFriendFunction() const {
    // Friend function can access private members.
    showSecretPlayerData(player);
}

void Game::run() {
    while (running) {
        printDivider();
        std::cout << "Cosmic OOP Arena\n"
                  << "1. Start Battle\n"
                  << "2. Visit Shop\n"
                  << "3. Show Player Stats\n"
                  << "4. Save Game\n"
                  << "5. Load Game\n"
                  << "6. Demonstrate Copy Constructor\n"
                  << "7. Demonstrate Operator Overloading\n"
                  << "8. Demonstrate Friend Function\n"
                  << "9. Exit\n"
                  << "Choice: ";

        int choice;
        std::cin >> choice;

        try {
            switch (choice) {
                case 1: startBattle(); break;
                case 2: visitShop(); break;
                case 3: showStats(); break;
                case 4: SaveSystem::savePlayer(player); std::cout << "Game saved.\n"; break;
                case 5: SaveSystem::loadPlayer(player); std::cout << "Game loaded.\n"; break;
                case 6: demonstrateCopyConstructor(); break;
                case 7: demonstrateOperatorOverloading(); break;
                case 8: demonstrateFriendFunction(); break;
                case 9: running = false; break;
                default: std::cout << "Invalid option.\n"; break;
            }
        } catch (const GameException& ex) {
            std::cout << "GameException: " << ex.what() << "\n";
        } catch (const std::exception& ex) {
            std::cout << "Standard exception: " << ex.what() << "\n";
        }
    }
}
