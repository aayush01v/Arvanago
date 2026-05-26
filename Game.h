#ifndef GAME_H
#define GAME_H

#include "Player.h"
#include "Shop.h"

class Game {
private:
    Player player;
    Shop shop;
    bool running;

    void startBattle();
    void visitShop();
    void showStats() const;
    void demonstrateCopyConstructor();
    void demonstrateOperatorOverloading();
    void demonstrateFriendFunction() const;

    inline void printDivider() const { std::cout << "-----------------------------\n"; } // inline function

public:
    Game();
    void run();
};

#endif
